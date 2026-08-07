# Prompt 05 — Visual QA

Perform final visual and responsive QA for `/etablissement/informations-generales` without changing backend, schema, authorization, contracts, or data behavior.

## Reference

- `references/establishment-general-information-desktop-reference.png`

The screenshot is authoritative only for hierarchy, proportions, spacing, density, and visual tone. Current shell, navigation, tokens, components, business logic, and approved capabilities remain authoritative.

## Required browser captures

- 1440 px desktop;
- 1024 px tablet;
- 768 px narrow tablet;
- 390 px mobile.

Use a consistent test account/context and document the viewport height.

## Compare in this order

1. application-shell integration;
2. page-header hierarchy and action placement;
3. main/preview column proportions;
4. section-card width, spacing, borders, radius, and density;
5. numbered section markers;
6. identity/logo composition;
7. coordinates grid balance;
8. public-information split layout;
9. language and service-mode states;
10. preview cover/logo overlap and content hierarchy;
11. responsive reflow;
12. long French copy and overflow;
13. loading, read-only, focus, hover, disabled, saving, and error states.

## Diff classification

Create a table:

```text
Area | viewport | expected | actual | severity | action
```

Severity:

- `Critical` — unusable, overflow, missing content/action, broken shell;
- `Major` — material hierarchy/proportion/spacing mismatch;
- `Minor` — small polish difference;
- `Intentional` — required by repository conventions, current capabilities, accessibility, or responsive behavior.

Fix Critical and Major visual issues in this pass. Do not change data/business logic during visual QA.

## Validation

Run only Prompt-00-verified commands. Do not claim a lint result when no lint script exists.

## Final report

```text
Route tested
Page classification
Screenshot paths
Critical/Major issues fixed
Minor differences remaining
Intentional deviations and reason
Horizontal overflow result
Console/hydration result
Files changed
Commands run and exact results
Proposals still awaiting approval
```
