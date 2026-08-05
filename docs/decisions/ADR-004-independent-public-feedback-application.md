# ADR-004: Use an independent public feedback application

Status: Accepted

Date: 2026-08-05

Decision owners: YUTA

## Context

Direct customer feedback is an anonymous, mobile-first flow reached from
restaurant-owned links and QR codes. It has a distinct abuse-protection,
privacy, hostname-resolution, deployment, and release boundary from the public
YUTA marketing website.

The first implementation lived under `apps/web`, although its data already
belonged to the cloud reputation domain and its administration belonged to the
authenticated back-office.

## Decision

Maintain public direct-feedback collection in `apps/feedback-web`. The app uses
`packages/contracts` for request validation, `packages/db-cloud` from server
code only, `packages/tenant` for verified public hostname resolution, and
`apps/backoffice` for authenticated restaurant processing.

Production requests resolve the establishment from an active verified hostname
and cross-check the configured public feedback slug. A slug, route parameter,
header, form value, or browser cookie is never trusted tenant scope. The
development-only localhost slug fallback remains unavailable in production.

## Alternatives considered

- Keep the flow in `apps/web`: rejected because anonymous feedback has an
  independent runtime, privacy boundary, abuse controls, and release cadence.
- Put the flow in `apps/backoffice`: rejected because public anonymous traffic
  and authenticated restaurant administration require different trust
  boundaries.
- Create a new feedback database or package: rejected because the reputation
  domain, contracts, tenant model, and cloud persistence already own the
  required behavior.

## Consequences

Feedback can deploy independently without duplicating its domain or storage.
The app receives `CLOUD_DATABASE_URL` and a feedback-specific IP-hash salt, but
its browser bundle receives neither. Existing public feedback routes move out
of `apps/web`; deployment must route verified restaurant feedback hostnames to
the new application.
