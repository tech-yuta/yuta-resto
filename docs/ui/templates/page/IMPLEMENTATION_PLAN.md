# <Page name> — Implementation Plan

Status: Draft

Visibility: Engineering

## Phase 0 — Repository analysis

Inspect route, shell, current implementation, authorization, data, `@yuta/ui`, tokens, tests, and references.

No code changes.

## Phase 1 — Visual baseline

For a new route, implement a typed responsive composition if approved.

For an existing integrated route, improve the current route in place and preserve behavior.

Do not change contracts, permissions, schema, or unrelated routes.

## Phase 2 — Component boundaries

Extract meaningful page-level components without visual or behavioral regression.

## Phase 3 — Approved interactions

Implement only approved interaction semantics.

## Phase 4 — Data integration or extension

Map current domain fields first. Stop for approval when a new field, enum, route, permission, contract, or migration is required.

## Phase 5 — Visual and responsive QA

Capture requested widths, compare, fix major differences, and run repository checks.

## Delivery evidence

For each phase report files, commands, results, screenshots, deviations, and risks.
