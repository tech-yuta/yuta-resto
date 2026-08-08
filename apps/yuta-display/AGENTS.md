# YUTA Display Agent Instructions

`apps/yuta-display` is a standalone restaurant-local digital-signage product.
Its UI is French and its server code owns the display database under `src/db`.

For UI work, also follow `docs/ui/YUTA_FRONTEND_RULES.md` while preserving the
standalone Display runtime and product rules below.

- Use `DISPLAY_DATABASE_URL`; never access cloud or POS databases.
- Do not create `packages/db-display` without a second legitimate server-side
  consumer.
- Keep database access in services/server boundaries and validate external
  input with Zod.
- Store uploads under the configured `UPLOAD_DIR` on a persistent volume. Never
  rely only on a container's writable layer.
- The `/display` screen must keep playing the last successful in-memory playlist
  during temporary backend/database failure and skip broken media.
- Keep the MVP focused on upload, list, edit, delete, activation, ordering,
  playback, and durable PostgreSQL/file storage.
- Reuse `@yuta/ui`; do not add authentication, complex roles, analytics, cloud
  storage, AI, or multi-display features without approved scope.

Validate with architecture check, display typecheck/build, upload-route checks,
and database migration verification when persistence changes. Update the shared
local-development and deployment documents for operational changes.
