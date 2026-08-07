# Product Scope

## Implemented page responsibility

`/etablissement/informations-generales` is the establishment profile/settings page for the currently selected restaurant. It belongs to the `ÉTABLISSEMENT` area of the back-office.

Approved information categories:

1. establishment identity: commercial name and logo;
2. description;
3. address;
4. primary contact details: phone, email, website;
5. public contact details;
6. spoken languages;
7. supported service modes: dine-in, takeaway, reservation, delivery,
   click-and-collect, private events, and catering;
8. visibility controls for optional public profile fields;
9. persisted weekly booking service periods when booking is enabled.

All data is establishment-scoped and must remain inside the validated active `organization + establishment` context.

## Visual intentions from the reference

The reference proposes:

- a page header with title, subtitle, completion summary, preview action, and save action;
- five compact numbered sections when booking is enabled;
- a right-side public-preview panel on desktop;
- numbered section markers;
- selected/unselected service-mode cards;
- live visual feedback while editing.

The current implementation supports a local preview, derived completion,
visibility flags, and the approved service-mode enum. It does not claim a
public profile route, address verification, or media upload flow.

## Capability decision table

| Capability shown or implied                                                                                         | Pack treatment                                                                                 |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Commercial name, logo/cover URLs, structured address, phone, email, website, description, languages, public contact | Implemented on the establishment profile                                                       |
| Public preview inside the editor                                                                                    | Approved UI behavior when it can derive safely from current form values                        |
| External `Aperçu public` destination                                                                                | Use only an existing approved route/modal; otherwise disabled or omitted with an explicit note |
| Profile-completion percentage                                                                                       | Derived locally from supported profile fields; not persisted                                   |
| Address verification                                                                                                | Use only an existing approved capability; otherwise omit                                       |
| Cover image in preview                                                                                              | Display existing cover/fallback only; cover editing is outside this page                       |
| Individual public-visibility switches                                                                               | Implemented for optional public fields                                                         |
| Service-mode choices                                                                                                | Implemented through the approved establishment service-mode contract                           |
| Logo removal or media cleanup                                                                                       | Expose only when current upload/storage infrastructure supports it                             |

## Out of scope

- global shell or sidebar redesign;
- organization or establishment selection redesign;
- opening-hours management;
- menu/catalog management;
- reservations configuration;
- table/floor-plan management;
- customer-order, checkout, payment, invoicing, or cash-management workflows;
- new geocoding, storage, analytics, or media providers;
- new public-profile platform architecture;
- new database schema, enum, permission, API route, or contract without a separate approved proposal.

## Existing-page protection rule

When Prompt 00 classifies the page as `EXISTING_PAGE`, all current behavior is protected unless explicitly changed by this pack. Preserve:

- server-side authorization;
- organization and establishment scoping;
- data loading;
- mutation and cache invalidation;
- validation;
- upload behavior;
- error handling;
- tests;
- accessibility behavior.

A visual refactor is not permission to replace or simplify these systems.
