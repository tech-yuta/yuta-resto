# Authentication Package Instructions

`@yuta/auth` contains environment-neutral authentication contracts and
cryptographic primitives. It must not import persistence, Next.js, HTTP/UI,
tenant resolution, provider adapters, or environment loading.

Use secure randomness and constant-time comparison where applicable. Never log
passwords, session/reset tokens, secret keys, hashes used as credentials, or
derived credential material. Keep public errors non-sensitive. Prefer immutable
inputs/results, validate configurable security parameters, and check every
consumer before breaking an export.

Validate with the auth typecheck/tests and architecture check.
