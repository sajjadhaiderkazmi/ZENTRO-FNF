# Zentro - POS v0.2.0 — QA and targeted security review

Prepared 1 November 2026. Runtime: **Node.js v24.22.1**, managed Linux. Result: the connected backend passes the exercised real HTTP/SQLite regression cases below; the live sign-in UI renders. This is an evaluation source release, not a production-security approval or a verified Windows binary.

## Executed results

| Command | Result | Scope |
| --- | --- | --- |
| `npm test` | **90 passed, 0 failed** | 47 deterministic domain tests plus 43 backend/security/integration tests (including the HTTP parent test) |
| `npm run check` | **36/36 passed** | Every delivered JS module syntax check, demo bundle CSP hashes and targeted static checks |
| `npm run test:http` | **17/17 passed** | Retained static-demo server headers, methods and file allowlist; this suite is not the connected business backend |
| `npm run build` | Pass | Regenerates separate single-file demo, 144,217 bytes; does not build Electron |
| Archive validation | Performed during packaging | ZIP CRC, explicit source allowlist and exclusion of runtime databases/keys/backup archives/node_modules |

Exact outputs are in `QA_AUTOMATED_OUTPUT.txt`, `QA_STATIC_OUTPUT.txt` and `QA_HTTP_OUTPUT.txt`. Tests use isolated temporary directories and synthetic fixture accounts; no fixture account/database is distributed as an active installation.

## Real backend cases exercised

The backend tests start the actual HTTP application and use persistent SQLite databases; they do not substitute mock authentication or an in-memory business API.

- RFC 6238 authenticator vector and replay protection; native Argon2id verification; AES-GCM wrong-key/tamper rejection.
- No public setup API; Origin/CSRF and Host rejection; MFA before Power access; login throttling; HttpOnly/SameSite cookies.
- Two independently invited companies; activation key is not an owner invitation; invitations consume once; full activation/invitation secrets are absent from platform output and license records.
- Power cannot read company business data; separate company product data; foreign-company stock and sale IDs are denied; parameterized SQL remains intact after SQL/HTML-shaped input.
- Real staff invitations; no password hashes in team output; cashier cost/profit/report/team/platform restrictions; inventory staff checkout denied; injected manual free/discount rejected for cashiers.
- Atomic sale/stock update, same-key replay without duplicate sale, changed-payload key conflict, underpaid-sale rollback and concurrent last-stock protection.
- Server-managed bonus offers and profit cost; return must include promotional bonus; over-return rejected; append-only tenant audit SQL trigger.
- Branch stock starts separately; unassigned branch denied; reassignment revokes sessions and applies after sign-in; disabling staff revokes access; last active admin guard.
- Partial/damaged/resellable credit returns reconcile exact customer balances and collections; opening cash + cash sale − cash expense reconciles counted shift close with zero variance.
- Invalid cart payload/expense method rejects without partial write; invalid calendar dates and reversed report date range reject.
- Linked return/replacement cash exchange reconciles difference and references.
- Cached transaction replay after manager-to-cashier demotion redacts cost/unit cost; replay after branch removal is denied.
- Seeded history beyond 200 receipts remains searchable through real API paging and fully exported to CSV; other company history stays separate; cashier export denied.
- Terminal limit rejects extra enrollment; released terminal token cannot bill; key revocation blocks existing-terminal business writes; replacement key restores licensed writes.
- Expired license preserves reads and blocks writes; suspension revokes sessions without blocking another company.
- Opt-in scheduled startup snapshot is encrypted/restorable; shutdown waits for completion, disabled configuration stays disabled and invalid interval rejects.
- Encrypted snapshot restores independently, passes SQLite integrity check and retains verifiable password hashes; wrong passphrase and nonempty restore destination reject.
- Secret-file HTTP access denied and no permissive CORS.

Domain tests separately cover bounded integer money/quantity parsing, paid/free cost and tax/discount allocation, duplicate-line stock constraints, archived/foreign references, CSV formula protection, display escaping, identifier/alias collisions and Code 39 geometry/quiet zones.

## Browser/UI evidence

The **connected v0.2 login screen** was loaded in Chrome through the running backend. Branding, company-code/username/password fields, invitation/recovery controls and exact clickable developer email were visible. A screenshot was inspected. Captured error logs contained browser-extension metadata errors, not an application-origin JavaScript error.

Authenticated browser/native flows were **not** executed for v0.2. Browser automation could not securely enter the synthetic sign-in credentials through the available authentication mechanism without user involvement; the real authentication/business flows were verified via HTTP integration instead. Those API tests are not equivalent to clicking every authenticated control.

The retained v0.1 demonstration had earlier browser checks of checkout/free products, discount, full return, scanner keyboard input, inventory/customer creation, purchase, reports, labels and narrow layouts. Those results establish the older demo only; they do not certify the connected UI or Electron build. v0.2 has shared responsive/print CSS and native dialogs but still needs authenticated end-to-end, accessibility, narrow-screen and print testing against its actual runtime.

## Findings corrected during development

- Company creation SQL placeholder mismatch was caught and corrected by real owner-onboarding integration.
- Missing branch balance fallback was corrected so another branch does not inherit main-branch stock.
- Authentication/permission statuses were corrected to distinguish missing sessions and denied role actions.
- CSV sales export was corrected to read full branch history instead of the latest-200 workspace snapshot; paging/search added.
- Current branch checks and cost redaction now apply on cached idempotent replies after role/branch changes.
- Invalid cart shapes, expense payment methods and impossible calendar dates now reject before persistent mutation.
- Staff role/branch editing revokes sessions; expired UI sessions acquire a fresh anonymous CSRF context before a new sign-in.
- Windows helper launchers now respect the server .env file; signed-build spawn failures return failure, not a false success.

## Limits and release status

No independent penetration test or exhaustive vulnerability audit was performed. Zero vulnerabilities/hack-proof status is not claimed. The root server has zero third-party npm dependencies, but Node/OS/browser/runtime vulnerabilities still matter; no resolved Electron dependency tree was installed or CVE-audited here.

The backup encryption/restore path and scheduler startup/shutdown were tested; a long-running scheduled timer, offsite transfer, retention policy and operator recovery terminal interaction were not end-to-end tested. Interactive bootstrap/operator scripts were syntax/source reviewed and their underlying store/password/backup behavior tested. No real production environment or reverse-proxy/service installation was executed.

Electron tools, a Windows execution environment, a signing certificate and physical scanner/printer hardware were unavailable. No compiled `.exe`, Authenticode result or hardware-printed receipt/label is supplied. Desktop wrapper/IPC and Windows batch behavior remain runtime release gates.

Cloud offline synchronization is absent. Local standalone mode uses independent storage and does not synchronize with the cloud. The current single-process per-company document storage needs capacity/load and crash/power-loss testing before scaled deployment. See `RELEASE_GATES.md` for concrete next steps.
