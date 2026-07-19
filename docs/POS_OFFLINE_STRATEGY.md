# YuTa POS Offline Strategy

## Decision Status

- Status: accepted architecture direction.
- Decision date: 2026-07-19.
- Approved now: phases 1 and 2.
- Deferred until the YuTa cloud foundation exists: phase 3.
- Deferred until operational evidence justifies it: phase 4.

This document records the agreed offline direction for `apps/yuta-pos`. It is a
roadmap and design constraint, not a statement that every item below is already
implemented.

Repository implementation progress as of 2026-07-19:

- Kitchen send plus kitchen print-job creation is atomic and idempotent.
- Payment capture plus final receipt-job creation is atomic and idempotent.
- Competing payments for one order are serialized by an order-row lock.
- Order cancellation and split changes share that transaction and lock
  boundary, so they cannot interleave with payment capture.
- Docker Compose includes a local print-worker service with a heartbeat.
- `/api/health` and the POS status strip expose local service failure states.
- Backup and guarded restore scripts are available.
- Local Docker QA verified POS/database health, worker heartbeat, mock print
  processing, and recovery after container restart.
- A custom-format backup, checksum verification, and restore into the local
  drill database completed successfully on Windows Git Bash and Docker.
- Physical printer transport, site HTTPS/DNS setup, scheduled off-device
  backups, and the restaurant Internet-disconnection acceptance test still
  require deployment work.

## Offline Availability Target

The primary availability target is:

> The restaurant can continue normal POS, kitchen, payment-recording, and local
> printing operations during an Internet outage while the restaurant LAN and
> local edge server remain available.

Browser-only operation after both the LAN or edge server become unavailable is
not part of the initial offline target.

## Current State

The current POS is an installable level-one PWA, not an offline-capable POS.

- `apps/yuta-pos/public/sw.js` caches the manifest, icons, and immutable Next.js
  static assets only.
- Page navigation, Server Actions, order data, kitchen actions, and payments
  require the Next.js server.
- The Next.js server requires PostgreSQL through `packages/db`.
- Kitchen tickets and customer receipts are represented by database-backed
  `print_jobs`; the physical ESC/POS integration is not implemented yet.
- Background synchronization and a browser command outbox do not exist.

Do not describe the current PWA as supporting offline order entry.

## Chosen Architecture

The restaurant edge server is the operational source of truth during service.
It runs on the restaurant network and hosts:

```txt
apps/yuta-pos
PostgreSQL
local print worker
future synchronization worker (disabled until phase 3)
backup and health-check jobs
```

POS terminals, tablets, and kitchen displays connect to this server over the
restaurant LAN or Wi-Fi. Internet access is not required for local operations.

The preferred topology is:

```txt
POS terminals/tablets ---+
Kitchen display ---------+--> restaurant edge server --> local PostgreSQL
                         |             |
                         |             +--> local print worker --> printers
                         |
                         +-- Internet when available --> future YuTa cloud
```

This architecture is preferred over making every browser an independent
database node. It keeps all tills and the kitchen on one authoritative local
database and avoids multi-device order and payment conflicts during service.

## Phase 1: Restaurant Edge Operation

Phase 1 is approved for implementation.

### Goals

- Run the POS application and its PostgreSQL database inside the restaurant
  network.
- Run the print worker locally so kitchen and receipt printing do not depend on
  Internet access.
- Keep all POS and kitchen clients on the same local operational database.
- Provide a stable local hostname and HTTPS suitable for an installed PWA.
- Make Internet, local server, database, and printer failures distinguishable
  to operators.
- Establish backup, restore, health-check, and restart procedures.
- Protect the edge server, router, network switch, and printers with appropriate
  power and network resilience, including a UPS where practical.

### Acceptance Criteria

Phase 1 is not complete until a controlled Internet-disconnection test proves
that operators can:

1. Open the locally hosted POS.
2. Create an order and add items.
3. Send a new item batch to the kitchen.
4. See and update the order on the kitchen screen.
5. Record an allowed local payment.
6. Create and process the corresponding local print jobs.
7. Continue to find the order after restarting the POS container.

The test must not rely on an already-open page continuing to display stale
content. New application requests must succeed over the LAN while the Internet
uplink is disconnected.

### Payment Boundary

- Cash can be recorded locally without Internet access.
- Card and restaurant-ticket acceptance depends on the payment terminal and its
  acquirer, not on the PWA service worker.
- The POS must not infer that a card payment succeeded merely because a local
  command was queued.
- External terminal transaction identifiers and reconciliation fields should be
  introduced before automated payment-terminal integration.

## Phase 2: Data Integrity and Operational Hardening

Phase 2 is approved for implementation.

### Atomic Transactions

Each business operation and its mandatory side effects must commit atomically.
At minimum:

```txt
Send to kitchen
  update the exact pending item batch
  + create its kitchen print job
  + create its future sync event when the outbox exists

Complete an order or check payment
  record the immutable payment
  + update the check/order state
  + create its customer receipt print job
  + create its future sync event when the outbox exists
```

The current action implementations perform some of these steps separately.
Refactor the service layer so actions call one transaction-owning operation.
Do not solve this only by wrapping calls in the UI action.

### Idempotency and Concurrency

- Important commands must carry an idempotency key, including kitchen sends,
  payments, cancellations, refunds when added, and manual print retries.
- Retrying the same command after a timeout must return the original result and
  must not create a duplicate payment or ticket.
- Payment and order transitions must use database constraints, row locking, or
  equivalent compare-and-set rules where concurrent terminals could race.
- Payment records should be append-only. Corrections should be explicit status
  transitions or new refund/reversal records, never destructive rewrites.
- Print jobs need a stable deduplication relationship to the business event that
  created them. Retrying a failed physical print is different from creating a
  second business receipt.

### Cloud-Ready Foundations Without Cloud Synchronization

Phase 2 should prepare the data model so phase 3 does not require redesigning
the order and payment core. This preparation does not enable cloud sync.

- Scope operational records by a trustworthy `establishment_id` once
  authentication and tenant context are available.
- Add an `origin_node_id` for records or events that can originate at an edge
  node.
- Generate stable UUIDs at the application boundary where future disconnected
  creation requires it; do not depend exclusively on database-generated IDs.
- Reserve an idempotency key on command results with a database uniqueness
  constraint.
- Prefer immutable domain events for synchronization-sensitive operations.
- An optional `sync_outbox` table may be created in phase 2, but its worker must
  remain disabled until the phase-3 cloud API and security model exist.

An outbox row must eventually be written in the same database transaction as
the business change it represents. Writing it after the business transaction
would reintroduce a data-loss window.

### Backup and Recovery

- Document automatic local backup retention and the destination outside the
  primary database disk.
- Encrypt backups that leave the restaurant device.
- Test restoration into a clean PostgreSQL instance; the existence of backup
  files alone is not sufficient.
- Record recovery-time and recovery-point expectations.
- Define what operators do when the edge server, database, Wi-Fi, or a printer
  is unavailable.

### Operator Visibility

The POS should distinguish at least:

```txt
Online: local server and Internet available
Internet unavailable: local POS operation still available
Server unavailable: business writes are unavailable
Printer unavailable: operations continue and print jobs await retry
```

Do not use a single generic "offline" state for all four conditions.

## Phase 3: Cloud Synchronization

Phase 3 is explicitly deferred until the YuTa cloud foundation exists. It
requires a central API, authenticated node identity, tenant and establishment
scoping, operational monitoring, and central reporting rules.

The intended direction is application-level synchronization using a
transactional outbox:

1. A local transaction writes business data and an immutable outbox event.
2. A sync worker sends unacknowledged events in order when Internet is
   available.
3. The cloud API deduplicates by event ID and origin node.
4. The worker marks the event acknowledged only after a durable cloud ACK.
5. Menu, staff, and configuration versions may be pulled back to the edge.

Do not introduce direct PostgreSQL multi-master replication for operational
orders and payments. The edge owns the service-time order lifecycle; the cloud
receives an idempotent copy for reporting, backup, and later integrations.

Conflict rules must be explicit before phase 3 begins:

- Orders and kitchen transitions are owned by their origin establishment edge.
- Payments are immutable events and deduplicated by business and external
  transaction identifiers.
- Menu and configuration changes use server-issued versions.
- Existing order snapshots are never rewritten by later menu changes.
- Cloud administration must not concurrently mutate a locally active order.

## Phase 4: Browser Emergency Mode

Phase 4 is deferred and should be implemented only if incident data shows that
staff must continue drafting orders while a tablet cannot reach the edge
server.

A possible limited emergency mode may cache the application shell, menu,
selectable staff, and locally created draft commands in IndexedDB. It should
initially allow only draft order creation and pending item editing.

The initial emergency mode must not allow:

- Browser-assumed card payment success.
- Complex split payments.
- Kitchen status changes that other devices cannot observe.
- Concurrent offline edits to the same order on multiple devices.
- Claims that an order was sent to the kitchen when no server or print worker
  received it.

Phase 4 is not a prerequisite for phases 1 through 3.

## Explicit Non-Goals

- Using the service-worker Cache API as a database.
- Treating cached HTML as proof that POS operations work offline.
- Queueing non-idempotent Server Actions without command identifiers.
- Supporting peer-to-peer browser synchronization between tills.
- Multi-master writes to the same active order from cloud and edge.
- Marking terminal payments successful without an acquirer or terminal result.

## Implementation Handoff Checklist

Before continuing this roadmap, review:

- `docs/YUTA_POS.md` for current application behavior and business rules.
- `docs/POS_USER_GUIDE.md` for operator workflows.
- `docs/DEPLOYMENT.md` for production Docker conventions.
- `docs/LOCAL_DATABASE.md` for development database setup.
- `packages/core/src/orders.ts` and `packages/core/src/payments.ts` for current
  service boundaries.
- `apps/yuta-pos/src/app/actions/order-actions.ts` and
  `apps/yuta-pos/src/app/actions/payment-actions.ts` for non-atomic orchestration
  that must move into transaction-owning services.
- `packages/core/src/prints.ts` and `packages/core/src/print-worker.ts` for the
  database-backed print flow.

When a phase changes actual behavior, update this document together with
`docs/YUTA_POS.md`, `docs/POS_USER_GUIDE.md`, and the relevant deployment,
database, and QA documentation in the same change.
