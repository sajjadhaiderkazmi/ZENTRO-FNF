# Windows and counter-device setup — v0.3.0

## Standalone Windows app

Use the supplied **unsigned evaluation** x64 installer on Windows 10/11 x64. Close any running Zentro instance first. Install into a dedicated Zentro folder, then open the desktop shortcut. This bundle embeds Electron, Node, the local server, SQLite and Argon2; the shop computer does not need Node.js separately.

On first launch choose **Create local Power Account**, choose your own username and 14–128 character password, then sign in and enroll an authenticator. There are no default accounts. Power creates a company and securely delivers the separate owner invitation and activation key. The owner accepts the invitation and completes MFA. Admin invites a cashier; the cashier uses the same company on its enrolled terminal.

Local data stays in Electron's per-user application-data directory under `Zentro - POS/server` (normally under `%APPDATA%`). Back it up before upgrades. Uninstall is designed to retain that data. An installer built on Linux is not evidence that installation, upgrade and uninstall have been exercised on a real Windows machine.

## Printer auto-detection

Open **Printer & scanner**. The desktop app reads installed operating-system printers and marks the Windows default. Select the printer if needed. The browser version uses the normal OS print dialog and cannot enumerate installed printers.

Paper defaults to **80 mm**; select **58 mm** or **A4** for your driver. Device preferences are local to this computer/profile. Driver installation, printer power, paper size and physical paper feed remain the operator's responsibility. The app does not infer paper width from a printer's name. Keep scale at 100% and disable browser headers/footers. Use the matching driver paper size; thermal layouts use 297 mm page height with pagination, not automatic cutter commands.

Choose **Print test receipt** and then **Print test**. It clearly says NOT A SALE. Check edges, long item names, numbers and the Code 39 barcode. A successful print callback means that the operating system accepted the job, not that the physical printer produced readable paper. This release uses the printer driver; it does not send raw ESC/POS cash-drawer/cutter commands.

## USB or Bluetooth scanner

Default is a keyboard/HID scanner, configured for **Enter/CR suffix**. Pair Bluetooth devices in Windows first. Click **Scan any barcode** on the hardware screen and scan the test receipt. The result must show `ZEN-TEST-001` and confirm the Enter suffix. This test does not create a sale. Leading zeroes are retained.

On checkout, press **F2**, scan into search, and Enter adds the matching product SKU/barcode or alias. Unknown barcodes do not add products. Stock and prices are verified by the backend. The app cannot reliably discover a keyboard-mode scanner's model or distinguish it from human typing; no USB permissions or invasive keyboard capture are used. Internal label printing produces Code 39; selling lookup accepts the existing product barcode values. This is not a claim of EAN/UPC label generation or industrial scanner certification.

## Build from source

```sh
npm ci
npm ci --prefix desktop
node desktop/build-windows.mjs --unsigned
# output: release/windows/local/
```

`Build-Windows-App.bat` provides the same reproducible path. Root `hash-wasm@4.12.0` provides Argon2id compatibility for Electron/BoringSSL. Node uses native Argon2; a regression test verifies identical output. Both root and desktop lockfiles are supplied. Build staging keeps source configuration and live databases untouched.

On Windows the standard electron-builder NSIS flow is used. Unsigned Linux cross-builds use the supplied custom NSIS template (shortcuts, uninstall registration, retained AppData), avoiding execution of a 32-bit uninstaller generator on the build host. The cross-build has not been installed on real Windows. Signed Windows builds require your protected signing certificate and omit `--unsigned`.

For an online/cloud installer, provide your real HTTPS backend origin through `ZENTRO_SERVER_URL` and add `--cloud`. This does not provision hosting. Never embed passwords, API tokens or company data in installer configuration. Local installations do not synchronize with an online server.

The GitHub Actions Windows workflow compiles an evaluation installer and publishes it as a build artifact; an artifact existing does not certify Windows install/upgrade behavior.

## Hardware acceptance on your actual counter

Record the Windows version, printer driver/model, paper width and scanner suffix. Install on a clean Windows account; create a Power account/company/admin/cashier; print the test at actual size; scan its barcode; create a product, complete a sale, reprint it, restart and verify stock/history. Then back up, upgrade, uninstall/reinstall and verify retained data. Record the actual result; do not mark these physical steps passed from PDFs or software tests.
