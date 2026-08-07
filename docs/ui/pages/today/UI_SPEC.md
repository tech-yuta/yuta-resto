# Today dashboard — UI specification

Status: Current design reference

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-06

## Authority and route maturity

`/aujourdhui` is an authenticated, establishment-scoped Server Component integrated
with current booking and reputation sources. It preserves the shared shell,
tenant selection, and server authentication.

The written scope and current repository behavior take precedence over
`references/today-dashboard-approved.png`. The reference controls visual
hierarchy, relative proportions, density, spacing direction, and visual tone
only.

## Header

Show:

- the establishment-local date;
- `Bonjour, <display name>.`;
- `Voici votre plan d’action pour aujourd’hui.`;
- an `Ajouter` action only when at least one supported, permission-allowed
  destination exists.

The first supported add destination is reservation creation. Do not render a
menu for one item when a direct link is clearer, and do not add placeholder
actions.

## Attention summaries

Use a balanced responsive grid. Available cards are derived from enabled and
authorized current modules:

- `Réservations aujourd’hui`;
- `Avis à traiter` when reputation is available;
- `Services aujourd’hui` when booking administration data is available.

Each card contains an icon, label, value or explicit state, one supporting
label, and a real destination. Do not render email, content, task, or team
cards. Do not turn unavailable capabilities into misleading zero counts.

## Main content

### Reservations today

This is the dominant task surface. Show a limited chronological list containing
only fields returned by the current reservation source:

- local time;
- guest display name;
- party size;
- reservation status;
- link to the existing detail route when permitted.

Do not invent table assignment or phone display. Status filters are added only
when their semantics and interaction are implemented and tested.

### Booking services today

Derive service tiles from today's enabled persisted booking service periods.
Show service name, local time range, capacity when appropriate, and a textual
current/upcoming/completed state when deterministically derived.

Do not add operational opening, cleaning, preparation, closing, reservation
cut-off, or last-arrival fields.

### Reviews requiring attention

Render only when the reputation entitlement and permission apply. Show current
source, author, rating when present, a safely truncated excerpt, received time,
and a real link to the reviews workflow. Do not fabricate source metadata or
reply state.

## Layout

At wide desktop widths:

- the summary row appears below the header;
- reservations occupy the dominant column;
- booking services and reviews form secondary cards;
- the grid uses `minmax(0, 1fr)` and current spacing tokens.

At tablet widths, cards form a balanced one- or two-column layout. At mobile
widths, use this order:

1. header and supported add action;
2. attention summaries;
3. reservations;
4. booking services;
5. reviews.

No breakpoint may introduce horizontal page scrolling.

## Language and visual system

- User-facing copy is French, following current Backoffice conventions.
- Do not introduce an i18n framework for this page.
- Reuse `@yuta/ui`, semantic tokens, and `lucide-react`.
- Preserve Geist Sans and current shell typography.
- Use restrained semantic status colors and no raw reference-image colors.
- Do not add gradients, charts, glass effects, or a second token system.

## Required states

Each supported section implements, as applicable:

- loading with stable skeleton dimensions;
- populated;
- valid empty;
- forbidden or capability-hidden;
- unavailable or error;
- retry or recovery where a safe current pattern exists.

One section failure must not be represented as a successful zero value.

## Accessibility

- Use one page-level `h1` and logical section headings.
- Preserve visible focus and keyboard navigation.
- Icon-only actions have accessible names.
- Status includes text and does not rely on color.
- Links describe their destination.
- Skeletons and updates avoid disruptive announcements.

## Intentional deviations from the reference

- Existing Backoffice navigation and shell remain authoritative.
- Tasks, team, emails, and content approval are omitted.
- Reservations do not show unsupported table or phone fields.
- Booking services omit cut-off and last-arrival information.
- The number of summary and content cards is lower and capability-dependent.
