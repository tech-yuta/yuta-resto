# YUTA Public Website

Status: Current

Visibility: Public product

Owner: YUTA engineering

Last updated: 2026-08-05

`apps/web` serves the public YUTA product website as well as tenant-facing
public feedback routes.

## Public marketing routes

- `/` positions YUTA as a modular restaurant-management suite. Reviews and
  Google Business Profile appear as lower-page product and integration
  sections, not as the primary company positioning.
- `/solutions` presents the four product pillars: customer relationships,
  operations, team, and business development.
- `/solutions/avis-commentaires` documents the pilot reviews workflow without
  presenting it as the whole YUTA product.
- `/integrations/google-business-profile` explains Google Business Profile
  authorization, data use, reply validation, and revocation.
- `/integrations/google` permanently redirects to the canonical Google
  Business Profile integration route.
- `/pour-les-restaurateurs` describes the modular product approach for
  independent restaurant operators.
- `/a-propos` explains YUTA's field-led product approach.
- `/privacy` describes YUTA's current privacy commitments.
- `/terms` describes the current product usage rules.
- `/mentions-legales` contains the available publisher and hosting
  information. `/legal` permanently redirects to it.
- `/gestion-des-donnees` explains Google disconnection and data-deletion
  requests. `/data-management` permanently redirects to it.
- `/contact` provides the public support and demo contact.

Marketing content must distinguish released features from features still in
development. Google reply suggestions must never be described as publishing
automatically.

## Search discoverability

- Root metadata positions YUTA as a restaurant-management suite and uses
  `https://yutapro.fr` as the canonical origin.
- Every indexable marketing page has a unique title, description, canonical
  URL, Open Graph subject, and visible H1.
- `/sitemap.xml` contains only substantive canonical public pages.
- `/robots.txt` allows the marketing site and excludes API and preview routes.
- Tenant feedback pages and internal tool shells are `noindex, nofollow`.
- The homepage publishes truthful `Organization` and `WebSite` JSON-LD only;
  no price, rating, legal name, address, or social profile is added until it is
  confirmed.
- `/opengraph-image` and `/twitter-image` present the full YUTA suite rather
  than the reviews module.

## Layout rules

Public pages use a hybrid full-width layout:

- every major section owns a full-width outer wrapper;
- `PublicContainer` owns three named width presets: `marketing` at 1280px,
  `article` at 800px, and `legal` at 1200px. These dimensions include the
  shared responsive horizontal padding, so readable article copy is no wider
  than 720px on wide screens;
- solution cards use at most three columns on wide desktop;
- legal pages use a 260px table of contents and the same 720px reading column
  as standard editorial pages;
- the final homepage call to action follows the standard 1280px content grid;
- the header exposes the complete navigation through a mobile menu below the
  desktop breakpoint.

## Typography

- Use Geist Sans across the complete public website, with Inter as the
  fallback.
- Do not use serif fonts.
- Headings, body text, navigation, buttons, forms, and the footer use the same
  font family.
- Headings use weight 600–700 with slightly negative letter spacing.
- Body copy uses weight 400 with generous line height.
- Public body text must be at least 15px and should normally be 16px.
- Compact navigation labels, metadata, badges, legal disclaimers, and text
  inside illustrative product previews may use 13–14px when they are not the
  primary reading content.
- Legal article copy uses 16px text with approximately 28px line height.
- Avoid light gray text for essential, legal, privacy, and data-control
  information.

Homepage photography is stored as right-sized WebP assets. New marketing
photography must use a responsive `next/image` `sizes` value and should not
ship as a multi-megabyte source PNG.

## Marketing buttons

- Primary and success marketing buttons use the same restrained YUTA green
  gradient, from the darker brand tone to the standard brand tone.
- The gradient may shift subtly on hover and use a small shadow for depth, but
  must not use glow effects or excessive animation.
- Secondary, outline, and ghost buttons remain neutral so the primary action
  stays visually dominant.
- Keyboard focus rings must remain visible.

## Brand and country assets

- Use official, locally stored assets for third-party brands and country
  flags; do not recreate them with CSS.
- Google brand assets must come from an official Google resource and must not
  be recolored, distorted, combined with the YUTA logo, or used to imply an
  endorsement.
- Country flags use the reviewed SVGs from the MIT-licensed `flag-icons`
  project and keep their ISO country code as the filename.
- Use `lucide-react` for functional interface icons and flow connectors.
- Step-to-step workflows use the same understated `MoveRight` connector;
  arrows inside buttons and links may continue to use `ArrowRight`.

## Public contact and application link

The public role addresses are active Google Workspace aliases:

- `contact@yutapro.fr` for general and legal contact;
- `support@yutapro.fr` for product and Google integration support;
- `privacy@yutapro.fr` for privacy, revocation, and deletion requests.

They currently route to the primary operator mailbox while YUTA has a single
operator. The primary mailbox must not replace these role addresses in public
content.

Set the restaurant back-office URL per environment:

```env
NEXT_PUBLIC_BACKOFFICE_URL=https://app.yutapro.fr
```

Without an override, the public site links to `https://app.yutapro.fr`.

## Google review preparation

Before using these pages in an OAuth or Business Profile API review:

- publish them over HTTPS on a verified `yutapro.fr` hostname;
- ensure every legal and data-management link is reachable without login;
- replace the current pilot-project publisher details with the registered
  business information after YUTA is incorporated;
- add the publisher's required postal address before commercial launch;
- keep the Google integration description aligned with the implemented scopes
  and data lifecycle;
- retain the statement that YUTA is independent from Google.

## Content accuracy

The homepage identifies `Avis & commentaires` as a pilot module. Other modules
are described as a progressively deployed environment without being marked
available. The product preview is explicitly labeled as illustrative and must
not contain invented customer names, performance claims, testimonials, or
unverified certifications.

## Production launch checklist

- Redirect alternate HTTP and `www` hostnames to `https://yutapro.fr` at the
  edge or reverse proxy.
- Verify the domain in Google Search Console and submit
  `https://yutapro.fr/sitemap.xml`.
- Validate the rendered metadata, social cards, canonical URLs, and JSON-LD.
- Replace incomplete legal publisher and hosting information before commercial
  launch.
- Test public pages, the OAuth trust links, and Core Web Vitals in production.
