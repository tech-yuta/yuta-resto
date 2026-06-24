# docs/MVP.md

# Yuta Display — MVP Specification

## 1. Product Goal

Build an internal digital signage web application for a restaurant.

The application displays a playlist of images and videos on a Samsung The Frame TV using the built-in TV browser.

The app is for internal restaurant use only.

Primary use cases:

```txt
Display promotions
Display menu images
Display food videos
Display event announcements
Display QR code campaigns
Loop media automatically on TV
```

---

## 2. Target Device

Primary display device:

```txt
Samsung The Frame TV
```

The TV will access the display page through its built-in browser.

Expected display URL during development:

```txt
http://SERVER_IP:3000/display
```

Future display URL through Nginx Proxy Manager:

```txt
http://display.luna.local
```

The display page must be lightweight, stable, and suitable for restaurant opening hours.

---

## 3. Language

Documentation and technical specifications must be written in English.

Source code must use English for:

```txt
File names
Variable names
Function names
Component names
Service names
Database field names
Type names
Code comments
```

The application UI must be written in French.

Reason:

```txt
The app will be used by French restaurant staff.
The admin page must be immediately understandable by non-technical French-speaking users.
```

All user-facing text must be in French.

Examples of correct UI text:

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
Ouvrir l'affichage
Aucun média actif
```

The `/display` page fallback message must be:

```txt
Aucun média actif
```

The `/admin` page must not show English labels such as:

```txt
Dashboard
Media
Add media
Delete
Edit
Active
Inactive
Sort order
No active media
```

For the MVP:

```txt
Do not implement full multi-language support.
Use French as the only UI language.
Keep code and documentation in English.
Future i18n support can be added later if needed.
```

---

## 4. Tech Stack

Use the latest stable versions available at the time of development.

Do not hardcode old framework versions.

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

Framework requirements:

```txt
Use Next.js App Router only
Do not use Pages Router
Use TypeScript strict mode
Use Server Components by default
Use Server Actions where appropriate
Use API routes when they are more suitable, especially for file upload
Use Drizzle ORM for database access
Use Zod for validation
Use React Hook Form for admin forms
Use Tailwind CSS for styling
Do not use Prisma
Do not use Bootstrap
```

---

## 5. Code Conventions

Follow these rules across the project:

```txt
No default exports
Use named exports only
Components must use PascalCase
Services must use PascalCase
Database schema files must use kebab-case file names
Keep business logic out of UI components
Use a service layer for database operations
Use strict TypeScript types
Avoid unnecessary client components
Use client components only when interactivity is required
```

Correct:

```ts
export const MediaList = () => {
  return <div>...</div>;
};
```

Incorrect:

```ts
export default MediaList;
```

---

## 6. Main Routes

## 6.1 `/admin`

Admin page for managing media.

Authentication is not required for the MVP.

The page must be usable from:

```txt
Laptop
Tablet
Desktop browser
```

Required features:

```txt
Upload image
Upload video
List all uploaded media
Preview image or video
Edit media title
Edit image duration
Edit sort order
Enable or disable media
Delete media
Open display page
```

Expected table columns:

```txt
Aperçu
Titre
Type
Durée
Ordre d'affichage
Statut
Actions
```

Required French UI labels:

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
Ouvrir l'affichage
```

---

## 6.2 `/display`

Public TV display page.

This route is designed for the Samsung The Frame browser.

Requirements:

```txt
No authentication
Fullscreen-friendly layout
Black background
No header
No footer
No navigation
No visible cursor if possible
Display active media only
Sort media by sortOrder ASC
Loop playlist forever
Refresh playlist every 60 seconds
Update running playlist without manual refresh
```

Image behavior:

```txt
Supported formats: JPG, JPEG, PNG, WEBP
Display each image for duration seconds
Use object-fit contain or cover depending on best TV result
Avoid layout shift
```

Video behavior:

```txt
Supported format: MP4
Autoplay
Muted
playsInline
Go to next media when video ends
If video fails to load, skip to next media
```

Empty playlist behavior:

```txt
Aucun média actif
```

Error behavior:

```txt
If one media item fails, skip to next item
If the server is temporarily unavailable, keep playing the last loaded playlist in browser memory
The display must not become a blank screen during temporary backend failure
```

---

## 7. Database

Use PostgreSQL with Drizzle ORM.

Database name:

```txt
luna_display
```

Main table:

```txt
display_media
```

Fields:

```ts
id: uuid primary key

title: varchar(255), nullable

type: varchar(20), required
// allowed values: image | video

fileUrl: text, required

fileName: text, required

mimeType: varchar(100), required

size: integer, required

duration: integer, default 10
// used for images only

sortOrder: integer, default 0

isActive: boolean, default true

createdAt: timestamp, default now

updatedAt: timestamp, default now
```

Recommended indexes:

```txt
isActive
sortOrder
createdAt
```

---

## 8. File Upload

Upload directory inside the app:

```txt
/public/uploads/display
```

Public URL format:

```txt
/uploads/display/<filename>
```

Allowed image MIME types:

```txt
image/jpeg
image/png
image/webp
```

Allowed video MIME types:

```txt
video/mp4
```

File size limits:

```txt
Image: 10 MB
Video: 300 MB
```

Upload rules:

```txt
Generate a safe unique filename
Keep the original file extension
Sanitize the original filename
Reject unsupported MIME types
Reject files exceeding size limits
Store file metadata in PostgreSQL
Store physical files on disk
Delete the physical file when the media record is deleted
Uploaded files must persist after Docker container restart
```

Filename strategy example:

```txt
timestamp-random.extension
```

Example:

```txt
1710000000000-a8f3x2.mp4
```

---

## 9. API Endpoints

## 9.1 `GET /api/display-media`

Return media sorted by:

```txt
sortOrder ASC
```

Query params:

```txt
active=true
```

If `active=true`, return only active media.

Response example:

```json
[
  {
    "id": "uuid",
    "title": "Menu du midi",
    "type": "image",
    "fileUrl": "/uploads/display/menu.jpg",
    "fileName": "menu.jpg",
    "mimeType": "image/jpeg",
    "size": 123456,
    "duration": 10,
    "sortOrder": 1,
    "isActive": true,
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  }
]
```

---

## 9.2 `POST /api/display-media`

Create media metadata.

Expected body:

```json
{
  "title": "Menu du midi",
  "type": "image",
  "fileUrl": "/uploads/display/menu.jpg",
  "fileName": "menu.jpg",
  "mimeType": "image/jpeg",
  "size": 123456,
  "duration": 10,
  "sortOrder": 1,
  "isActive": true
}
```

---

## 9.3 `PATCH /api/display-media/:id`

Update media fields.

Editable fields:

```txt
title
duration
sortOrder
isActive
```

Expected body example:

```json
{
  "title": "Nouveau titre",
  "duration": 15,
  "sortOrder": 2,
  "isActive": true
}
```

---

## 9.4 `DELETE /api/display-media/:id`

Delete media.

Required behavior:

```txt
Delete database record
Delete physical file if it exists
Return success even if the physical file is already missing
```

---

## 9.5 `POST /api/upload/display`

Upload one media file.

Expected request:

```txt
multipart/form-data
field name: file
```

Response example:

```json
{
  "fileUrl": "/uploads/display/1710000000000-a8f3x2.mp4",
  "fileName": "1710000000000-a8f3x2.mp4",
  "mimeType": "video/mp4",
  "size": 123456
}
```

---

## 10. Display Player Logic

The display player must:

```txt
Fetch active media on initial load
Store playlist in browser state
Refresh playlist every 60 seconds
Keep playing the current playlist if refresh fails
Move to the next item automatically
Loop forever
Skip broken media automatically
```

Pseudo-code:

```ts
const [items, setItems] = useState<DisplayMedia[]>([]);
const [index, setIndex] = useState(0);

async function fetchPlaylist() {
  try {
    const result = await fetch("/api/display-media?active=true");
    const data = await result.json();

    if (Array.isArray(data)) {
      setItems(data);
      setIndex((current) => {
        if (current >= data.length) return 0;
        return current;
      });
    }
  } catch {
    // Keep current playlist
  }
}

function next() {
  setIndex((current) => {
    if (items.length === 0) return 0;
    return (current + 1) % items.length;
  });
}
```

Image behavior:

```ts
setTimeout(next, currentItem.duration * 1000);
```

Video behavior:

```tsx
<video
  src={currentItem.fileUrl}
  autoPlay
  muted
  playsInline
  onEnded={next}
  onError={next}
/>
```

---

## 11. Recommended Folder Structure

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

## 12. UI Text Constants

For MVP, full i18n is not required.

However, user-facing text should be centralized when practical.

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
  uploadSuccess: "Média ajouté avec succès",
  save: "Enregistrer",
  cancel: "Annuler",
  confirmDelete: "Voulez-vous vraiment supprimer ce média ?",
} as const;
```

---

## 13. Docker Requirements

The app must be Docker-ready.

Use a standalone build if supported by the selected Next.js version.

Required environment variables:

```env
DATABASE_URL=postgres://luna_admin:PASSWORD@luna-postgres:5432/luna_display
UPLOAD_DIR=/app/public/uploads/display
```

Required Docker volume:

```yaml
volumes:
  - yuta_display_uploads:/app/public/uploads/display
```

Uploaded files must not be lost when:

```txt
The app container restarts
The app image is updated
The stack is redeployed in Portainer
The server reboots
```

---

## 14. Deployment Target

The app will be deployed on an internal Ubuntu mini server.

Existing server stack:

```txt
Ubuntu Server
Docker
Portainer
PostgreSQL
pgAdmin
Nginx Proxy Manager
Tailscale
```

Expected internal access:

```txt
http://SERVER_IP:3000
```

Future reverse proxy access:

```txt
http://display.luna.local
```

The application must connect to the existing PostgreSQL container:

```txt
luna-postgres
```

Database to create before deployment:

```sql
CREATE DATABASE luna_display;
```

---

## 15. Security Scope for MVP

For MVP:

```txt
No authentication required
/admin is accessible only inside the local network or through Tailscale
Do not expose the app publicly to the Internet
Do not open router ports
```

Future version may add:

```txt
Admin login
Role-based access
Upload audit log
Multi-user management
```

---

## 16. Acceptance Criteria

The MVP is complete when all conditions are met.

### Admin

```txt
I can open /admin from my laptop.
I can upload an image.
I can upload an MP4 video.
I can preview uploaded media.
I can edit media title.
I can edit image duration.
I can edit sort order.
I can enable or disable media.
I can delete media.
Deleting media also deletes the physical file.
The admin UI is in French.
```

### Display

```txt
I can open /display on Samsung The Frame browser.
The display page uses a black background.
Active media loops automatically.
Images respect their configured duration.
Videos autoplay muted.
Videos move to the next media when finished.
Broken media is skipped automatically.
Empty playlist shows: Aucun média actif
Temporary backend failure does not immediately break the running display.
The display UI is in French.
```

### Persistence

```txt
PostgreSQL data persists after container restart.
Uploaded files persist after container restart.
Uploaded files persist after stack redeployment.
Uploaded files persist after server reboot.
```

### Deployment

```txt
The app runs inside Docker.
The app can be deployed through Portainer.
The app can connect to the existing PostgreSQL container.
The app can later be routed through Nginx Proxy Manager.
```
