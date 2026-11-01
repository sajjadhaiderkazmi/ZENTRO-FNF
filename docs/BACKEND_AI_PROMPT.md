# Copy-ready continuation prompt — Zentro - POS v0.2

Upload the entire **Zentro-POS-Project.zip**, extract it and give this prompt to your coding AI. Backend code already exists in this version. Continue that code; do not rebuild a second disconnected frontend or pretend the old HTML demo is the production application.

---

You are implementing and preparing **Zentro - POS**, an installed Windows retail application with an online shared backend and Power/company Admin panels. The developer credit must stay clickable in login, main UI and receipts:

```html
<a href="mailto:sajjadhaiderconnect@gmail.com">Developed By Sajjad Haider</a>
```

Read README.md, START_HERE_ROMAN_URDU.md, docs/SECURITY.md, docs/QA_REPORT.md, docs/API_CONTRACT.json, docs/RELEASE_GATES.md, server/, web/, desktop/, deploy/ and the tests before changing anything. Record the exact initial test results. Distinguish implemented features from missing release gates. Preserve existing working functionality and the navy/purple/white interface. Do not introduce a fake role selector into the authenticated app.

## What already exists

Node.js 24.22.1+ server using native Argon2id and SQLite; one platform DB and separate company DBs; server-derived tenant identity; real Power/admin/staff accounts; single-use owner/staff invitations; activation keys stored as digests; mandatory admin/Power MFA and hashed recovery codes; cookie/CSRF/Origin/Host protection; rate limits; branch assignments; device enrollment and revocation; role-scoped API; persistent atomic/idempotent checkout; products, prices, aliases, branch stock, purchases, customers, credit/collections, free products and automatic offers; returns/exchanges; cash shifts; full-history report/search/export; encrypted backup/restore/scheduler; operator recovery. The connected UI is web/, not src/app.mjs. src/core.mjs and src/styles.css are shared.

Electron desktop source has sandbox/context-isolation, restricted IPC for local first setup, cloud HTTPS mode, local embedded-server mode, NSIS build configuration and a signing script. No executable has been built/tested in the supplied environment. Root server has zero external npm dependencies. Desktop tools need installation, a generated lockfile and dependency review on the build machine.

## Work to carry to completion

1. Run existing tests and fix actual failures. Review code for tenant leakage, RBAC/branch bypass, cached idempotency results after role changes, MFA/session/invitation races, stock/refund rounding, profile registration limitations, unexpected-error handling, backup consistency and filesystem permissions. Do not equate passing regression tests with zero vulnerabilities. Add meaningful regression tests for real fixes; avoid tests that only repeat implementation constants.
2. On Windows x64, install the pinned desktop dependencies, generate/retain their lockfile, review the resolved dependency tree, verify the embedded Node runtime supports this server's Argon2/SQLite APIs and build the installer. Test clean install, cloud/local first launch, secure account setup/MFA, checkout/return/shift/report, printing, device release, HTTPS failure, close/reopen, retained data, upgrade and uninstall/reinstall. Test keyboard/USB scanner and the real intended printers. Do not claim a build exists without attaching its actual binary/checksum and logs. Request a Windows runner if this environment cannot execute it; do not fabricate results.
3. Configure cloud deployment only when the owner supplies a domain/hosting destination. Make all preparation reviewable before any required approval. Use one server process and local persistent disk for this SQLite design. Configure exact HTTPS origin, restrictive permissions, service management, proxy/edge limits, monitoring and encrypted offsite backups. Test restore independently and two-device/two-company access from separate networks. Never invent a hosting account or silently use a paid service.
4. Obtain the owner's signing certificate through protected environment/secret handling; never embed certificate files/passwords in source, renderer or arguments. Produce/verify a signed release when those inputs are available. Otherwise label the artifact unsigned/evaluation.
5. If completing cloud offline-first operation, implement it as a reviewed native capability rather than a localStorage/local role workaround. Use a local database in app data, OS-protected credential/device-key storage, bounded signed offline license/permission lease, minimum necessary catalog cache, durable outbox with stable command IDs and payload hashes, server-authoritative sync, explicit pending/rejected/settled states and safe stock/price/payment conflict handling. Define how revocation/expiry and offline stock oversell are handled. Do not accept cached role flags or activation keys as perpetual authority. Keep card/payment entries external unless a real gateway is integrated. Test lost connection before/after commit, duplicate/out-of-order messages, restart/power loss, stale catalog, concurrent final stock, expired lease, disabled user, revoked device and reconnect reconciliation. Do not enable offline checkout until those tests pass. The supplied local standalone mode is independent storage, not cloud synchronization.
6. Measure capacity using realistic company/product/history counts. Current storage rewrites a company JSON document and reports scan in memory. If scale requires a normalized PostgreSQL model, design migrations and row-level tenant enforcement, transaction/idempotency/audit guarantees, backup/restore and rollback before replacing storage. Do not silently claim the current SQLite implementation is PostgreSQL or horizontally scalable.
7. Complete authenticated manual/browser/native UI QA through secure user-assisted credentials. Include role-specific navigation, receipts, original branch return, full-history paging/search, exports, one-time secrets, expired sessions, invalid form inputs, keyboard focus, narrow screens and error recovery. Keep real customer data, passwords, MFA seeds, activation tokens and screenshots containing secrets out of deliverables/logs. Never ship a fixture account, preauthenticated cookie, public setup bypass or debug endpoint.
8. Update all docs, exact API inventory, .env.example, release notes and QA evidence to match the delivered final behavior. Remove obsolete "backend not implemented" statements except for the clearly labeled legacy HTML demo. Keep the legacy demo separated; `npm run build` only generates it. Deliver source ZIP, runnable setup, actual Windows artifact when built, checksums, concrete test results, known limits and a clear release status.

## Required acceptance evidence

- Company A cannot read or mutate Company B through any ID or API; Power cannot browse business ledgers by default.
- Password-only pre-MFA sessions cannot read protected data; login/session/MFA replay/recovery/disable controls work.
- Owner activation needs independent invite plus key; invite consumes once; expired/suspended/revoked licenses and device/user limits are enforced by the server.
- A cashier cannot obtain cost/profit or bypass free/discount restrictions, including cached operation replay after demotion or branch reassignment.
- Same-key retries commit once; changed payload rejects; concurrent final-unit sales do not both succeed; failed sale/exchange writes roll back.
- Partial/full/free/damaged/credit returns and cash exchanges reconcile stock, ledger, profit, tax, refunds and cash movements exactly.
- Full-history reports and export are not truncated to snapshot limits. CSV formulas and HTML/SQL-shaped strings remain inert.
- Encrypted backups restore on a clean directory; wrong/tampered archives reject; real recovery and scheduled failure monitoring work.
- Windows/native security settings, real hardware and deployment configuration are verified in their actual environments.

Report honestly which gates passed, which failed and which require an unavailable external input. Never use “hack-proof,” “zero vulnerabilities,” “all complete” or “production-ready” without bounded evidence. Ask only for information actually needed to proceed, and continue independent implementation meanwhile.

---

Expected output: the upgraded source and actual built artifacts where available, exact commands/results, and a short Roman Urdu explanation for Sajjad Haider describing installation, Power → company → Admin → staff onboarding, backups and any remaining gate.
