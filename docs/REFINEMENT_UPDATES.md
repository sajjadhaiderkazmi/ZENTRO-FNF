# Two refinement updates — 1 November 2026

These updates improve the connected app (`web/`), not the retained standalone demo. The existing backend, data format, access controls and mandatory administrator MFA remain in use. Source version remains 0.2.0; Update 1 and Update 2 are delivery iterations, not a claim of production certification.

## Update 1: visual design and daily usability

- Refined sign-in with local gradients, clearer hierarchy and password visibility controls.
- Larger text, stronger text contrast, roomier controls, readable tables and consistent cards.
- Responsive desktop and mobile workspace; scrollable navigation for long role menus.
- Explicit quantity button labels, selected-state announcements, visible keyboard focus, and Escape to dismiss mobile navigation.
- Initial focus in dialogs and content focus after navigation. Search preserves the selected text range during rendering.
- Added `scripts/ui-smoke.mjs`: real Chromium/HTTP/SQLite checks with temporary accounts and a disposable database.

Validation at this checkpoint: 90 backend/domain tests, 36 existing static checks, and 8 real-browser integration groups passed. The added browser script increases the subsequent static-check count to 37.

## Update 2: connection recovery and transaction clarity

- Persistent connection notices without rebuilding a form or losing text being entered.
- Malformed gateway responses produce a clear error and a working reconnect action.
- Browser online/offline events provide hints; actual server requests establish connectivity. No automatic payment replay.
- A confirmed sale still clears its cart and displays its receipt if the follow-up workspace refresh fails. The saved operation is not presented as a failed payment. Further business commands require successful refresh while records are stale.
- Repeated submission of the same in-flight form is ignored. Checkout blocks concurrent cart/navigation actions; a tab-close warning protects an unsaved cart where supported by the browser.
- The refresh timestamp reflects completion of a server refresh, rather than each UI render.
- Expanded browser coverage to all five roles and injected connection failures.

## Final validation

| Check | Result |
| --- | --- |
| `npm test` | 90 passed; 0 failed, skipped or cancelled |
| `npm run check` | 37/37 passed |
| `npm run test:http` | 17/17 passed (standalone demo HTTP checks) |
| `npm run build` | Passed; both generated demo bundles remained byte-identical |
| Real Chromium integration | 14/14 groups passed |
| `git diff --check` | Passed |

Browser checks use actual backend requests and disposable SQLite databases, including Power login, MFA enrollment, owner invitation acceptance, all 15 admin routes, permitted manager/inventory/cashier routes, product creation, scanner input, quantity changes, checkout, receipt, stock deduction, gateway-response errors, duplicate-submit protection, saved-sale refresh failure, reconnection, mobile navigation, logout and uncaught JavaScript errors. Mobile checks use a 390 × 844 viewport; desktop uses 1440 × 1000. Connection failures are deliberately injected using browser request interception; normal requests use the real backend.

Run the optional browser suite with an external `playwright-core` installation and Chromium:

```sh
# Root server needs Node.js >=24.22.1 and no npm installation.
# Install optional browser tooling outside the checkout:
npm install --prefix /tmp/zentro-ui-tools --no-audit --no-fund playwright-core
ZEN_PLAYWRIGHT_MODULE=/tmp/zentro-ui-tools/node_modules/playwright-core/index.mjs \
CHROMIUM_PATH=/usr/bin/chromium node scripts/ui-smoke.mjs
# Optional: set ZEN_UI_ARTIFACT_DIR to save screenshots.
```

The browser test creates no permanent user accounts. Real operators still run `npm run bootstrap` interactively. No test passwords, cookies, MFA seeds or databases are included in the delivered archives.

## Research used

Read the official sources via their GitHub mirrors because direct W3C/MDN host access was blocked in this environment:

- [W3C WCAG 2.2: target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — [source read](https://github.com/w3c/wcag/blob/main/understanding/22/target-size-minimum.html). Supports larger touch targets; this is not a full WCAG conformance audit.
- [W3C ARIA: modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — [source read](https://github.com/w3c/aria-practices/blob/main/content/patterns/dialog-modal/dialog-modal-pattern.html). Supports modal focus, keyboard dismissal and clear dialog labels.
- [MDN: Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) — [source read](https://github.com/mdn/content/blob/main/files/en-us/web/api/navigator/online/index.md). Online/offline flags are hints and must not be treated as reliable server reachability.

## Limits

Automated checks do not prove every feature or deployment works. Windows Electron installation/signing, physical scanners/printers, real payment processing, real-network outage behavior, screen-reader review and a full accessibility/security audit remain outside this Linux validation. Offline cloud synchronization remains unimplemented. Unsaved carts stay in memory; browser tab-close warnings are best effort and do not make carts persistent. No production hosting or public deployment was performed.
