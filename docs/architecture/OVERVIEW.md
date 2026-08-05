# YUTA Architecture Overview

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-05

YUTA combines cloud SaaS applications with local restaurant products. These
runtime families share contracts, pure logic, and UI components, but they do
not share operational databases.

```text
Public visitors --> web / booking-web / feedback-web --> db-cloud (server only)
Restaurant users --> backoffice -------> db-cloud (server only)
POS terminals ----> yuta-pos ----------> site-agent --> db-pos
Display browser --> yuta-display ------> app-owned display database
```

Applications own framework boundaries and user flows. Database packages own
persistence. `tenant` owns trusted cloud scope and guards, `auth` owns portable
authentication primitives, `contracts` owns boundary schemas, `core` and
`booking` own pure domain logic, and `ui` owns reusable presentation primitives.

Server code may resolve identity and tenant context, enforce authorization,
query persistence, call providers, and access secrets. Client code may render
trusted results, collect input, and call approved server boundaries; it must not
import database packages, drivers, server environment modules, or secrets.

Platform-wide YUTA administration belongs in the future `apps/platform-admin`,
never in the restaurant back-office.

## Public-product visibility

Architecture documentation may describe every maintained runtime family.
Public YUTA product communication describes only approved cloud/public-service
capabilities. Local operational products remain engineering-owned without
becoming public-service claims.

Create an ADR before changing application ownership, dependency direction,
database ownership, tenant/authentication semantics, public compatibility, or
deployment topology.
