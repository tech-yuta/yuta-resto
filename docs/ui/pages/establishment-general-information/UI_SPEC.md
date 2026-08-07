# UI Specification

Status: Current implemented UI reference

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-07

## Visual reference

Primary desktop reference:

- `references/establishment-general-information-desktop-reference.png`

Use it for visual hierarchy, proportions, spacing, density, and visual tone only. Use the current YUTA shell, typography, semantic tokens, and `@yuta/ui` components from the repository.

## Page copy

- H1: `Informations générales`
- Subtitle: `Gérez les informations principales et les coordonnées publiques de votre établissement.`
- Primary action: `Enregistrer`

French labels must follow current repository vocabulary when it differs from the mockup.

## Application shell

Reuse the current back-office shell. Do not implement a page-local sidebar or top bar. Preserve:

- current navigation source of truth;
- organization/establishment switcher;
- user controls;
- responsive navigation behavior;
- active-route treatment.

The screenshot's unrelated navigation is non-authoritative.

## Desktop page structure

### Header

Left:

- page title;
- supporting text.

Save is placed after the form at the end of the primary column. Completion is
shown in the preview header. There is no external preview action.

Do not reserve empty space for unsupported actions. `Enregistrer` follows existing form conventions and is unavailable when the user is read-only, the form is pristine/invalid, or a save is in progress.

### Main grid

At large desktop widths:

- primary form column: approximately 68–72%;
- preview column: approximately 28–32%;
- use repository spacing tokens, visually close to the reference;
- preview may be sticky only when compatible with the current shell and without nested-scroll problems.

## Form sections

Use five stacked cards when booking is enabled, or the closest existing
page-section primitive. Numbered green markers are page-level visual elements
and must use semantic tokens.

### 1. `Identité de l’établissement`

Visual composition:

- logo preview in a compact left column and commercial name plus description in
  the wider right column at desktop;
- character counters use the current contract limits;
- validated logo/cover URL fields remain in a secondary image-source disclosure;
- preview images update only when a complete HTTP(S) URL is available.

Candidate labels from the approved visual:

- `Logo de l’établissement`
- `Nom commercial`
- `Description de l’établissement`

Character counters are shown only when the current validation contract defines limits. Do not invent `80` or `500` as persistence rules solely from the screenshot.

### 2. `Coordonnées`

Present existing approved address/contact fields in a balanced responsive grid. Candidate labels:

- `Adresse`
- `Complément d’adresse`
- `Code postal`
- `Ville`
- `Pays`
- `Téléphone`
- `Email`
- `Site web`

`Vérifier l’adresse` appears only when an approved repository capability exists.

The implemented desktop layout uses a wider address column on the left and a
stacked phone, email, and website column on the right. Postal code, city, and
country share the final address row. Address verification remains omitted.

### 3. `Informations publiques`

Left side:

- existing public email and public phone fields, when supported.

Right side:

- existing approved public-visibility controls, when supported.

Do not render mockup-only visibility options as persistent controls unless Prompt 00 maps them to current contracts. Unsupported options must be omitted or clearly documented as proposals, not silently implemented.

The implemented desktop layout places public email and phone in the left
column, with visibility controls in a wider right column. Commercial name and
logo are represented as always visible rather than adding a redundant
persistence flag.

### 4. `Langues et modes de service`

- use the current language selector/multi-select pattern;
- selected languages may render as removable chips;
- render service-mode choices from the current approved domain contract;
- selected state must be distinguishable by more than color;
- controls must use real checkbox/toggle-button semantics, not clickable `div` elements.

The implemented desktop layout uses a `2/5` language column and a constrained
`3/5` service-mode column. Selected languages appear as chips; selected service
modes use a compact icon, textual label, border, and check indicator so state
never relies on color alone.

### 5. `Horaires hebdomadaires`

- render all seven weekdays from persisted booking service periods;
- show each active service range, capacity, and the derived global table
  duration;
- keep create and delete controls in independent forms so the profile form is
  never nested with booking mutations;
- expose mutations only with `booking.settings.manage`;
- omit the section when the booking entitlement is disabled.

## Public-preview panel

The panel is read-only and may reflect unsaved local form state.

Visual order:

1. title row `Aperçu public`;
2. existing cover image or repository fallback;
3. overlapping logo treatment;
4. commercial name;
5. description;
6. existing public contact rows;
7. languages;
8. service modes;
9. informational note below the card.

Rules:

- never render hidden or empty rows;
- do not render raw HTML from descriptions;
- do not add cover upload to this page;
- previewing unsaved values must not persist them;
- external preview navigation must use a real existing route/modal.

Suggested note copy:

`Ceci est un aperçu de votre fiche publique. Les informations apparaîtront ainsi aux clients sur la plateforme YUTA.`

## Responsive behavior

### 1440 px desktop

- two-column composition;
- header actions aligned to the right when space permits;
- no content collision with shell.

### 1024 px tablet

- primary form becomes full-width or uses a reduced two-column ratio according to the shell;
- preview moves below the form or into an existing drawer pattern;
- header actions may wrap.

### 768 px narrow tablet

- form grids collapse progressively;
- identity and public-information split layouts become stacked;
- no horizontal overflow.

### 390 px mobile

- single-column layout;
- compact header with actions following the existing mobile page-action pattern;
- logo area above text fields;
- visibility controls in one column;
- service modes in one or two columns only when labels remain legible;
- preview after the form or in the existing mobile preview pattern.

## States

Support current repository patterns for:

- loading;
- initial-load error;
- empty optional values;
- read-only permission;
- saving;
- save success;
- save failure;
- upload progress/failure when logo upload exists;
- missing active establishment context.

## Accessibility

- exactly one page H1;
- programmatic label for every control;
- required/error state announced semantically;
- keyboard-operable upload, multi-select, checkboxes, and service-mode controls;
- logical focus order matching visual order;
- visible focus indicators;
- sufficient contrast using project tokens;
- decorative icons hidden from assistive technology when adjacent text conveys meaning.
