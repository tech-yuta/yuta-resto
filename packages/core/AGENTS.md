# Core Package Instructions

`@yuta/core` contains pure deterministic domain logic and registries. It must
not access databases, frameworks, HTTP, filesystem, network, providers,
environment variables, tenant lookup, authentication, or hidden global state.

Functions receive all required context explicitly and return deterministic,
testable results. Keep internal domain types independent of database rows and
add focused tests for edge cases and state transitions.

Validate with core typecheck/tests and architecture check.
