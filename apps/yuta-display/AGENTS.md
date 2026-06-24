# AGENTS.md

## Project Context

This project is part of the Yuta internal restaurant tool ecosystem.

Current application:

```txt
yuta-display
```

Future applications may include:

```txt
yuta-pos
yuta-staff
yuta-reservation
yuta-crm
```

The codebase must stay simple, maintainable, and consistent with future Yuta apps.

---

## Language Rules

Use English for all technical elements:

* Documentation
* Code comments
* Variable names
* Function names
* Component names
* Service names
* Type names
* Database schema names
* API field names
* Commit messages

Use French for all user-facing UI text.

This application is used by French restaurant staff, so the visible interface must be in French.

Correct UI labels:

```txt
Tableau de bord
Médias
Ajouter un média
Modifier
Supprimer
Actif
Inactif
Durée
Ordre d'affichage
Statut
Actions
Aperçu
Ouvrir l'affichage
Aucun média actif
```

Incorrect UI labels:

```txt
Dashboard
Media
Add media
Edit
Delete
Active
Inactive
Duration
Sort order
Status
Actions
Preview
Open display
No active media
```

For the MVP, do not add full i18n complexity.

Use French-only UI strings.

If possible, centralize UI text in:

```txt
src/constants/ui-text.ts
```

The goal is to make future translation easier without adding unnecessary complexity now.

---

## Tech Rules

Use the latest stable versions available at development time.

Required stack:

```txt
Next.js latest stable
React latest stable
TypeScript latest stable
Tailwind CSS latest stable
PostgreSQL latest stable
Drizzle ORM latest stable
Zod latest stable
React Hook Form latest stable
Docker
Docker Compose
Portainer deployment
```

Do not use:

```txt
Pages Router
Prisma
Bootstrap
Default exports
```

---

## Next.js Rules

Use Next.js App Router only.

Prefer Server Components.

Use Client Components only when interactivity is required.

Use Server Actions when suitable.

Use API routes for:

* File upload
* JSON endpoints
* Media deletion
* Data consumed by the TV display page

Keep route handlers small.

Move business logic to services.

---

## TypeScript Rules

Enable strict mode.

Avoid `any`.

Create shared types when used in multiple places.

Validate external input with Zod.

External input includes:

* Form data
* Upload metadata
* API request bodies
* Route params

---

## Export Rules

Use named exports only.

Correct:

```ts
export const MediaList = () => {
  return <div />;
};
```

Incorrect:

```ts
export default MediaList;
```

---

## Naming Rules

Components must use PascalCase.

Examples:

```txt
MediaList.tsx
MediaForm.tsx
MediaPreview.tsx
DisplayPlayer.tsx
```

Services must use PascalCase.

Example:

```txt
DisplayMediaService.ts
```

Schema files must use kebab-case.

Example:

```txt
display-media.ts
```

---

## Folder Rules

Recommended structure:

```txt
src/
  app/
    admin/
      page.tsx
      _components/
        MediaForm.tsx
        MediaList.tsx
        MediaPreview.tsx
        MediaActions.tsx

    display/
      page.tsx
      DisplayPlayer.tsx

    api/
      display-media/
        route.ts
        [id]/
          route.ts

      upload/
        display/
          route.ts

  db/
    index.ts
    schema/
      display-media.ts
      index.ts

  services/
    DisplayMediaService.ts

  types/
    display-media.ts

  utils/
    file.ts
    media.ts

  constants/
    ui-text.ts
```

---

## Database Rules

Use PostgreSQL with Drizzle ORM.

Use a service layer for database access.

Do not query the database directly inside UI components.

Main service:

```txt
DisplayMediaService
```

Expected service methods:

```ts
getAll()
getActive()
getById(id)
create(data)
update(id, data)
delete(id)
```

---

## File Upload Rules

Uploaded media files must be stored in:

```txt
/public/uploads/display
```

The upload path must be configurable with:

```env
UPLOAD_DIR=
```

Uploaded files must persist in Docker using a volume.

Do not store uploaded files only inside the container writable layer.

---

## Docker Rules

The app must be deployable with Docker Compose and Portainer.

Do not require manual steps inside the container after deployment.

Use environment variables for configuration.

Required environment variables:

```env
DATABASE_URL=
UPLOAD_DIR=
```

Uploaded files must survive:

```txt
Container restart
Image update
Portainer stack redeploy
Server reboot
```

---

## MVP Priority

Build only the MVP features first.

Do not add:

```txt
Authentication
Complex roles
Multi-playlist support
Multi-TV support
Drag and drop reorder
Cloud storage
Cloudflare Tunnel
Analytics
AI features
Advanced scheduling
```

Focus only on:

```txt
Upload
List
Edit
Delete
Activate / deactivate
Sort order
TV display loop
Docker persistence
PostgreSQL persistence
```

---

## UI Rule

All user-facing UI text must come from French labels.

Recommended file:

```txt
src/constants/ui-text.ts
```

Example:

```ts
export const uiText = {
  dashboard: "Tableau de bord",
  media: "Médias",
  addMedia: "Ajouter un média",
  edit: "Modifier",
  delete: "Supprimer",
  active: "Actif",
  inactive: "Inactif",
  duration: "Durée",
  sortOrder: "Ordre d'affichage",
  status: "Statut",
  actions: "Actions",
  preview: "Aperçu",
  openDisplay: "Ouvrir l'affichage",
  noActiveMedia: "Aucun média actif",
  fileTooLarge: "Le fichier est trop volumineux",
  unsupportedFileFormat: "Format de fichier non autorisé",
  mediaDeleted: "Média supprimé avec succès",
} as const;
```

---

## Stability Rule for TV Display

The `/display` page is used on a restaurant TV.

It must be stable.

The screen must not become blank during temporary backend failure.

If the backend or PostgreSQL is temporarily unavailable, the display page must keep playing the last successfully loaded playlist in browser memory.

Broken media must be skipped automatically.
