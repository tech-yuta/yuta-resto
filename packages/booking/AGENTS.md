# Booking Package Instructions

`@yuta/booking` owns pure public-booking domain rules such as availability,
capacity, time-slot calculation, and state-transition validation.

- Keep it independent of React, Next.js, databases, environment variables,
  providers, network, filesystem, and tenant/session resolution.
- Receive timezone, locale, clock, capacity, and policy inputs explicitly.
- Preserve deterministic behavior around daylight saving time, boundaries,
  concurrency inputs, and status transitions.
- Do not turn transport DTOs or database rows directly into the domain model.

Validate with booking typecheck/tests and architecture check.
