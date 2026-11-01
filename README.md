# Zentro - POS

Developed By [Sajjad Haider](mailto:sajjadhaiderconnect@gmail.com)

**v0.2.0 — working server-backed evaluation release and Windows desktop build source.**

This release adds a real backend, persistent company databases, real accounts and a connected interface. It is ready for local evaluation and further release engineering. A compiled/signed Windows installer, a hosted production service, cloud offline synchronization and independent penetration testing are not included. Read `docs/QA_REPORT.md` for exactly what was verified.

## Is this computer software?

Yes: `desktop/` contains an Electron desktop application that can be built into a Windows installer and opened from a desktop shortcut. The shop's desktop app connects to your HTTPS backend. The Power and company Admin panels use the same server and can also be opened in a browser from other locations.

There are two distinct deployment modes:

| Mode | Behavior |
| --- | --- |
| Cloud desktop | Installed Windows client connects to one online backend. Companies, users and reports share that backend. Internet is required for checkout. |
| Standalone local desktop | Embedded backend runs on the computer with its own local databases. Works without internet, but its accounts/data are independent and do not synchronize with a cloud server. |

This is not cloud offline-first software yet. Do not deploy a separate local server for each shop and expect global reports or activation keys to transfer between those servers.

## Start the actual backend in VS Code

Install official **Node.js 24.22.1 or a compatible later version**. These instructions were executed with v24.22.1. Native `node:sqlite` and `crypto.argon2` must be available.

Extract the ZIP, open the `zentro-pos` folder in VS Code, and run:

```sh
npm run bootstrap
npm start
```

No `npm install` is required for the root server: it has zero external npm dependencies. Bootstrap runs interactively in the terminal. Choose your Power name, username and a 14–128 character password/passphrase; password input is hidden. There are **no shipped/default accounts** and no public web setup endpoint.

Open `http://127.0.0.1:4173`. Leave company code empty to sign in as Power. At first sign-in, add the displayed MFA secret to an authenticator app and verify its six-digit code. Save the eight one-time recovery codes privately. This release displays the manual authenticator setup key; it does not render a QR code.

On Windows, `Create-Power-Account.bat` and `Start-Zentro.bat` run the same backend commands. Batch launchers and Electron itself still require Windows validation.

### Company onboarding

1. Power creates a company with a unique code, owner, admin username, expiry and device/user limits.
2. The server displays one activation key and a **separate**, single-use owner invitation. Save them immediately; full values cannot be retrieved later.
3. Give the owner the company code and admin username, and deliver the invitation and key through separate trusted channels.
4. Owner chooses **Accept company / staff invitation**, enters both secrets and chooses their password. This enrolls the first terminal.
5. Owner completes mandatory MFA, then uses the Admin panel to add staff, products, prices, branches and offers.
6. Staff use their own single-use invitation to choose a password, then sign in with company code and username. No automatic emails/messages are sent.
7. For each additional sales terminal, Admin signs in and enrolls it with the activation key under **Terminals**. Cashiers can then sign in on that enrolled browser/app profile.

A key by itself cannot claim the company Admin account. Power manages company licensing metadata; it has no business-data endpoint. Server filesystem operators remain trusted administrators of the databases.

## Implemented behavior

| Area | Connected backend behavior |
| --- | --- |
| POS | Keyboard scanner input, quantity, trusted server prices, admin/manager discount and manual free items, automatic buy-X-get-Y offers, cash change, cash/card/bank/credit records, receipt print view |
| Inventory | Add/edit, archive/restore, purchase cost/sale price, alias-preserving barcode changes, branch quantities, counted adjustment with revision checks, low-stock display, weighted-average purchase receiving |
| Customers | Add/edit/archive, outstanding balance, collections and store credit from returns |
| Sales | Durable atomic checkout/stock/customer/audit update, idempotent retry, paginated full-history search, full sales CSV export, reprint |
| Returns/exchange | Partial/full returns, resellable/damaged/discarded dispositions, cumulative refund rounding, linked cash-difference exchange, promotional bonus return requirement |
| Reports | Date/timezone filtering across full ledger, sales, returns, tax, cost, free-item cost, gross profit, expenses, operating estimate and cash movements |
| Admin | Real staff invites, role/branch assignment, disable/re-enable and session revocation, last-admin guard, branches, terminals, offers, settings |
| Shifts | Opening cash, linked cash events, counted close and variance; checkout does not require an open shift |
| Power | Real companies, hashed activation keys, renewal, limits, suspension, resume, key replacement/revocation and platform activity |
| Backups/recovery | Passphrase-encrypted backup and restore CLI, optional automatic backup scheduler, operator password/MFA recovery |
| Barcode labels | Internal Code 39 SVG label generator, selection and system print dialog |

Deleting products/customers/staff means archiving or disabling them so existing financial history stays intact. Purchases receive one product at a time. Currency is PKR; quantities are whole units. Payments are externally processed records, not a card/payment gateway. Credit-invoice exchanges must be returned to customer balance and sold separately. Held carts, import tools, supplier CRUD, fiscal/e-invoicing integration, offline cloud queue and automatic updater are not implemented in the connected app.

## Build the Windows desktop app

Use a Windows x64 build machine with Node.js and network access to the official npm/Electron distribution services. The packaged app embeds its runtime; end-user computers do not need Node.js for the installer build.

Before building, edit `desktop/desktop-config.json`:

```json
{"mode":"cloud","serverUrl":"https://YOUR-ACTUAL-SERVER-DOMAIN"}
```

For a standalone installation instead, use `{"mode":"local","serverUrl":""}`. Cloud mode is the default and intentionally refuses to start without your real HTTPS server URL. Do not ship a blank or example server URL.

```sh
npm --prefix desktop install
npm run desktop
npm --prefix desktop run dist:win
```

`Build-Windows-App.bat` runs the install/build steps. Expected output: `release/windows/Zentro-POS-Setup-0.2.0-x64.exe`. **That file is not present in this source ZIP.** Electron 45.2.1 and electron-builder 26.18.0 are pinned in the desktop package. A desktop dependency lockfile is not supplied because this build environment could not resolve/install that dependency tree; generate and retain it on the build machine, audit the resolved tree and use `npm ci` for subsequent builds.

Unsigned builds are for evaluation. For signed release, provision your own trusted Windows signing certificate through protected build environment variables and run `npm --prefix desktop run dist:win:signed`. The script requires a signing configuration and forces signing. Never commit the certificate/password or include it in this ZIP. See `docs/RELEASE_GATES.md`.

Local desktop databases live under Electron's per-user application data directory, inside `server/`. First launch offers **Create local Power Account** via a restricted native IPC bridge. This path is not an HTTP setup API. For operator CLI maintenance of local desktop data, close the desktop app and set `ZEN_DATA_DIR` to that exact `server/` directory. Cloud mode has no local database or offline checkout.

## Hosting, backups and recovery

Copy `.env.example` to `.env` and choose protected absolute data/backup directories. For public hosting use HTTPS, `NODE_ENV=production`, and the exact external `ZEN_PUBLIC_URL`. `deploy/` contains Caddy and systemd **templates**, not a deployed service. Read `deploy/README.md` before using them. The default server binds loopback only. The server does not support a URL path prefix.

```sh
npm run backup
npm run restore
npm run recover
# Physical server operator only, if authenticator AND recovery codes are lost:
npm run recover:mfa
```

Stop the app/server before manual operator maintenance. Backup asks for a new destination and a 14+ character passphrase; restore requires an empty destination and refuses overwrite. Password recovery revokes sessions and retains MFA; the explicitly confirmed MFA recovery mode forces new enrollment. Access to server data files grants operator control and must be protected.

Set `ZEN_BACKUP_PASSPHRASE`, `ZEN_BACKUP_DIR`, and `ZEN_BACKUP_INTERVAL_HOURS` to enable encrypted scheduled snapshots. Without a passphrase scheduling is **disabled**, and the server says so. A backup runs at startup and at the configured interval (1–168 hours). Failures are logged. Backups are not automatically uploaded offsite or pruned; monitor disk space, copy encrypted backups to separate storage, retain the passphrase separately and test restore. Snapshotting briefly blocks mutations with 503; safe retries must keep their original command key and payload.

## Data and scale boundaries

This implementation uses one platform SQLite database and one physically separate SQLite database per company. Each company holds a revisioned business document plus durable operation/audit tables. It does **not** implement PostgreSQL RLS, a normalized accounting database or horizontally scalable workers. Run one server process for a data directory on local persistent disk; do not put SQLite WAL files on a network share. Full-document writes and in-memory reports are for a small controlled deployment and need load testing/migration before large histories or large company counts. Database files are not encrypted at rest by SQLite; use OS/disk protection. MFA seeds and backup archives are encrypted separately.

Terminal registration uses a revocable HttpOnly device cookie in that browser/app profile. It is not hardware attestation or tamper-proof DRM. Device count limits enrolled profiles; cloning a compromised OS profile is outside that boundary.

## Tests and source

```sh
npm test
npm run check
npm run test:http
```

`npm test` includes real HTTP/SQLite backend tests and domain tests. `test:http` is the retained static-demo server suite; it is not the live backend suite. `npm run build` only regenerates the **separate demo** HTML from `src/app.mjs`, not the live app or Windows installer.

| Path | Purpose |
| --- | --- |
| `server/` | Authentication, licensing, storage, business commands, backups and operator CLI |
| `web/` | Connected application UI; no localStorage business adapter |
| `desktop/` | Electron wrapper, restricted preload and Windows installer configuration |
| `src/core.mjs` | Shared deterministic money/cart/barcode rules |
| `src/styles.css` | Shared responsive and print styling |
| `tests/` | Backend and domain regression tests |
| `deploy/` | Single-server HTTPS/service configuration templates |
| `docs/API_CONTRACT.json` | Actual v0.2 API inventory and payload notes |
| `docs/QA_REPORT.md`, `docs/SECURITY.md` | Verified results, controls and limitations |
| `docs/BACKEND_AI_PROMPT.md` | Copy-ready continuation/release engineering prompt |
| `Zentro-POS.html`, `src/app.mjs`, `src/seed.mjs` | Retained v0.1 browser-only demonstration; fictional accounts and role selector |

The one-file HTML demo is not the connected software. Do not use its role selector or localStorage for real authorization. Upload the **entire source ZIP** to your coding AI, not only the HTML. See `START_HERE_ROMAN_URDU.md` for a shorter walkthrough.

No software can be promised hack-proof. The targeted tests included here do not establish that there are zero vulnerabilities. Production use still needs the documented release gates.
