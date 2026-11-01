# v0.3.0 desktop and hardware validation

Date: 1 November 2026. This is a tested local/evaluation handoff, not a statement that all production or physical-hardware gates are closed.

## What changed

- Added a counter-device screen for every role: printer enumeration in Electron, default-printer indication, 80 mm default / 58 mm / A4 choices, a non-sale print-alignment receipt, and a keyboard-scanner suffix test.
- Printer IPC verifies the originating main frame, constrains paper sizes, accepts only installed printer names, and always uses an OS print dialog. Queue acceptance is not presented as physical print success.
- Browser receipt styles are served as same-origin stylesheets under the existing CSP. PDFs were checked for actual paper widths, not just screen appearance.
- Added a Windows counter-configuration PowerShell report; actual print/scan remains a manual acceptance step.
- Added a desktop lockfile, a dedicated Windows build script, local/cloud staging without rewriting source config, per-user installer shortcuts/uninstall registration, SHA-256 output and a Windows CI build workflow.
- Fixed native Electron startup readiness and Argon2 compatibility. Electron exposes the Node Argon2 function but its BoringSSL runtime rejects execution. A pinned `hash-wasm@4.12.0` implementation now handles Electron password hashes and encrypted backup keys using the same Argon2id parameters/formats. Node keeps native Argon2. A byte-for-byte interoperability regression check protects existing passwords. Backup encryption strength and formats are unchanged.

## Checks executed

| Check | Result |
| --- | --- |
| Unsigned Windows x64 payload NSIS build | Passed on Linux using the supported custom NSIS script; actual Windows installation remains untested |
| Node `npm test` | 95 passed, no failures/skips/cancellations |
| Electron embedded runtime, original backend/domain suites | 90 passed, no failures/skips/cancellations; includes encrypted backup/restore and scheduler |
| Static checks | 44/44 passed |
| Static-demo HTTP regression | 17/17 passed |
| Real Chromium integration | 15/15 groups passed |
| Actual Electron desktop integration on Linux/Xvfb | 3/3 groups passed: local bootstrap/login/MFA/isolation, native enumeration, invalid-printer rejection |
| Frozen root dependency install | `npm ci` passed |
| Runtime dependency audit | npm reported 0 advisories for production dependency tree |
| Desktop build-tool audit | 15 moderate transitive reports, all stemming from the minimatch advisory; no high/critical reports in this audit. Tooling is not bundled in the app. A safe supported upstream dependency resolution is still needed; no forced incompatible downgrade/override was applied |
| Receipt PDF layouts | One page each: 80 mm (227.04 pt), 58 mm (163.92 pt), A4 (594.96 pt); widths allow normal PDF rounding |
| Independent software barcode decode | ZXing decoded `ZEN-TEST-001` from both 58 mm and 80 mm PDF rasters at 203 dpi; physical scanner acceptance remains untested |
| Packaged Windows ASAR inspection | Local mode, portable Argon2 fix and pinned runtime dependency present |

The browser suite uses a real isolated HTTP/SQLite backend and disposable accounts, including Power MFA, company owner invitations, all original admin routes, manager/inventory/cashier routes, product creation, scanner Enter behavior, a durable sale/receipt/stock deduction, saved-sale refresh failure/recovery, duplicate form submission, mobile navigation, role visibility and malformed gateway responses. It also opens the hardware screen and verifies a non-sale test receipt. Normal browser requests use the real backend; deliberate connection failures use interception.

The native desktop suite runs the actual Linux Electron binary against its embedded local server. Node integration is unavailable in the renderer; the restricted preload bridge supplies printer operations. Enumeration returned zero printers, which is correct for this machine. It did not queue a physical print job.

## Views delivered

Power/company console, Admin overview, Admin inventory, Admin reports, shopkeeper/cashier checkout and mobile checkout are screenshots of the real connected app with synthetic disposable store data. The hardware screenshot labeled `native-electron-hardware.png` comes from actual Electron on Linux. Other desktop-size captures use Chromium. No image is represented as a clean Windows installation screenshot.

## Remaining external acceptance

The Windows EXE is unsigned. Successful compilation/package inspection is separate from installation, upgrade, uninstallation and launch on a clean Windows 10/11 computer. Physical 58/80 mm printers, Bluetooth/USB scanners, driver behavior, cutter/cash-drawer commands, barcode-decoder performance and paper readability were not available to test. Use the hardware guide and counter report on the actual shop PC.

A signing certificate, a real HTTPS hosting/domain configuration, offsite backup destination/restore drill, independent penetration testing and production-scale capacity/power-loss validation remain external work. Cloud offline synchronization, fiscal/payment integrations, auto-update delivery and advanced retail features remain unimplemented as documented. No production service, signed publisher identity or complete accessibility/security certification is claimed.

## Installer artifact

`Zentro-POS-local-Setup-0.3.0-x64.exe` was built successfully and its packaged local-mode configuration and cryptography dependencies inspected. The NSIS bootstrap is PE32 (normal for NSIS); it checks for a 64-bit OS and embeds the x64 Electron application. It is unsigned and has not been installed on a clean Windows machine.

SHA-256: `53c4eb2991e8d8dd6fa30f1199c550da3d7e96362217523ced9504e12786c46d`. The source archive is separate from the 151 MiB installer. Native Windows CI is configured but its remote run is not claimed as verified here.
