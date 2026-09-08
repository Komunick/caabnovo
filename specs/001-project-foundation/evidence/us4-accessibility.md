# US4 accessibility and interface consistency validation

Date: 2026-09-08
Scope: login, MFA, authenticated shell, user administration, audit investigation and export dialog.

## Final results

| Layer | Command | Result |
| --- | --- | --- |
| UI tokens, variants and accessible-name contracts | `corepack pnpm test:unit` | PASS — UI contracts included |
| Axe WCAG 2.2 AA and keyboard/reflow matrix | `corepack pnpm exec playwright test --config apps/web/playwright.config.ts accessibility.spec.ts keyboard-responsive.spec.ts` | PASS — 32/32 scenarios |
| Browser profiles | Chromium, Firefox, WebKit and iPad Pro 11 | PASS — 8/8 scenarios per profile |

The first keyboard run intentionally failed on the legacy interface because there was no skip link,
the custom dialog did not receive/trap focus, and the audit page overflowed at 320 CSS pixels. After
the corrections, the complete four-profile matrix passed without retries.

## Manual WCAG 2.2 AA review

| Area | Review | Result |
| --- | --- | --- |
| Keyboard | Verified skip-link activation, logical form/navigation order, dialog open/close with Enter/Escape, focus containment and return to trigger. WebKit/iPad link focus was invoked directly because its host preference may exclude links from the Tab cycle; activation and destination focus still passed. | PASS |
| Visible focus | Two-color focus treatment remains distinguishable on white, green and action-button surfaces; forced-colors mode delegates the outline to `Highlight`. | PASS |
| Contrast and non-color meaning | Text/action/danger tokens use dark foregrounds or white-on-dark treatments. Statuses, alerts and validation communicate explicit text/roles rather than color alone. Axe found no contrast violations in the tested states. | PASS |
| Text resize and reflow | Audit content was exercised at 200% text size and at 320 CSS pixels without page-level horizontal scrolling. Wide data stays inside a named, keyboard-focusable table scroller. | PASS |
| Structure and screen-reader semantics | `pt-BR`, one primary heading, landmarks, named navigation/regions/tables, associated field labels, live status/alert regions, `aria-current`, real button/link controls and named/described modal dialogs were inspected through the browser accessibility representation. Decorative Lucide icons are hidden. | PASS |
| Motion and touch | Spinner animation is disabled by `prefers-reduced-motion`; controls retain a minimum 44 CSS-pixel target in normal density and tablet layout. | PASS |

Formal acceptance with a human participant's preferred screen reader remains recommended before a
production promotion; the technical semantic inspection and automated assistive-technology proxies
for the foundation scope are complete.

## Corrections applied

- Added semantic design tokens and local Button, Input, FormField, Alert, Spinner, Dialog, Menu,
  Table and Pagination primitives.
- Added the global skip link, focusable main target, named landmarks, global polite live region and
  current-page navigation state.
- Replaced ad-hoc sensitive/export dialogs with Radix focus management and an explicit close control.
- Added responsive minimum-width constraints, single-column filters and mobile metadata/button
  layout to eliminate page-level overflow.
- Converted audit date filters from browser-local `datetime-local` values to ISO timestamps with an
  offset before navigation, preserving UTC storage and consistent server validation.
- Added reduced-motion and forced-colors accommodations and static, `aria-hidden` Lucide icons.

No automated or manual technical defects remain open from this US4 review.
