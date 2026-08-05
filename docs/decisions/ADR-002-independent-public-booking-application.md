# ADR-002: Use an independent public booking application

Status: Accepted

Date: 2026-08-05

Decision owners: YUTA

## Context

Public booking has a distinct anonymous flow, deployment surface, route model,
performance profile, indexing policy, and tenant-resolution boundary.

## Decision

Maintain public booking in `apps/booking-web`. Use `packages/booking` for pure
domain logic, `packages/contracts` for transport boundaries,
`packages/db-cloud` from server code only, and `apps/backoffice` for
authenticated restaurant booking administration.

The booking browser bundle never receives database dependencies, credentials,
or trusted tenant scope.

## Alternatives considered

- `apps/web`: rejected because booking has an independent runtime and release
  boundary.
- `apps/backoffice`: rejected because anonymous traffic and authenticated
  restaurant administration have different trust boundaries.

## Consequences

Booking can deploy independently. Shared logic and contracts remain outside
application framework code, and architecture checks cover both
`packages/booking` and `apps/booking-web/src`.
