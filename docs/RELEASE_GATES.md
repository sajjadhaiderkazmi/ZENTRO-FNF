# Release gates — v0.3.0 evidence update

Current validation is recorded in [V03_VALIDATION.md](V03_VALIDATION.md). Native Electron local setup/MFA/printer IPC and 90 embedded-runtime backend/domain tests now pass on Linux. An unsigned Windows x64 installer build is part of this handoff; it has not been installed on real Windows. Printer detection, 58/80 mm/A4 layouts, scanner test and configuration reporting are implemented. Physical hardware acceptance remains pending.

The earlier matrix below remains a list of external/commercial release gates, rather than a claim that all have passed. Windows installation/upgrade, code signing, hosting, physical counter devices, independent security review, production capacity, offline cloud sync and advanced integrations still require the evidence described. The dated v0.2 observations below are historical; prefer the v0.3 validation report for present software capabilities.

# Historical v0.2 gate matrix

The connected backend and desktop sources are included. The following are concrete work still required before calling this a released commercial Windows POS. Do not mark these complete without evidence.

| Gate | Current evidence | Completion required |
| --- | --- | --- |
| Windows runtime and installer | Electron sources/configuration syntax checked; no compiled binary | Install pinned desktop tools on Windows x64, retain lockfile, build, install on clean Windows, exercise local/cloud modes, upgrade/uninstall/reinstall and retained data |
| Signed distribution | Signing script/configuration exists | Owner supplies protected certificate; produce and verify Authenticode-signed installer, publisher identity and SHA-256 checksum |
| Online backend | Local HTTP/SQLite integration tests pass | Actual domain, VPS/disk, HTTPS, service account, monitoring, edge limits, backups and restore drill; use deploy templates and prove behavior from a second computer/network |
| Authenticated browser/native UI QA | Live login inspected; auth and business verified over real HTTP | Manual secure account setup and role-by-role browser/desktop end-to-end flows, keyboard/accessibility/responsive checks and no application errors |
| Hardware | Code 39 geometry tests and print UI source | Actual USB/Bluetooth scanner suffix/decoding, intended barcode formats, 58/80mm printer/A4 scaling, cash drawer where needed |
| Vulnerability review | Targeted negative/API tests and source checks | Independent penetration test of deployed app and installer; dependency/OS/runtime CVE review with dates; remediate/retest findings |
| Capacity and durability | Two-company isolated test fixture and last-unit concurrency test | Measured load/restart/crash/power-loss/storage-full tests with expected tenant count, product count and history size; normalize/migrate storage when measured limits require it |
| Offline cloud operation | Not implemented; disconnected checkout does not succeed | Native local database/secure credential storage, permission-limited cached catalog, signed bounded lease, durable queue, authoritative conflict/stock/payment handling, replay-safe sync and disconnect/reconnect/crash tests |
| Advanced retail features | Core scope implemented as documented | Only if required: supplier directory, import, variable/weighted quantities, multi-currency, card gateway, fiscal/e-invoicing, statutory tax rules, approvals, richer dashboards |
| Update operations | Manual backed-up upgrade path described | Signed update channel or controlled installer updates, reviewed migrations and recovery/rollback plan |

The Windows runtime, build services, signing certificate, hosting account and actual scanner/printer were unavailable in this work environment. No `.exe`, signed certificate, public live backend or successful cloud-sync claim is included. This release is a source handoff that can run locally now, not a guarantee that these external release gates have passed.
