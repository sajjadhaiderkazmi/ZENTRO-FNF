# Run on the actual Windows counter: powershell -File .\scripts\windows\Counter-Check.ps1
# This report detects configuration only. It does not certify paper output or scanner decoding.
param([string]$OutputPath = "$env:USERPROFILE\Desktop\Zentro-Counter-Report.txt")
$ErrorActionPreference = 'Stop'
$report = [System.Collections.Generic.List[string]]::new()
$report.Add('Zentro Counter Configuration Report — ' + (Get-Date -Format o))
$report.Add('Physical print/scan result: NOT TESTED BY THIS SCRIPT')
$os = Get-CimInstance Win32_OperatingSystem
$report.Add('Windows: ' + $os.Caption + ' ' + $os.Version + ' ' + $os.OSArchitecture)
$report.Add('Installed printers:')
try {
    $printers = @(Get-CimInstance Win32_Printer)
    if ($printers.Count -eq 0) { $report.Add('  None found. Install the printer driver and connect the device.') }
    foreach ($printer in $printers) { $report.Add(('  {0} | Driver: {1} | Default: {2} | Offline: {3}' -f $printer.Name, $printer.DriverName, $printer.Default, $printer.WorkOffline)) }
} catch { $report.Add('  Printer enumeration failed: ' + $_.Exception.Message) }
$report.Add('Scanner: HID keyboard-mode devices require a scan test in the app; model identity cannot be inferred reliably.')
$report.Add('Default paper: 80mm. Confirm actual driver paper width before printing.')
$report.Add('Manual checks still required: clean install; own Power/admin/cashier setup; test receipt; ZEN-TEST-001 scan; sale/reprint; restart; backup; upgrade/uninstall/reinstall with retained data.')
$parent = Split-Path -Parent $OutputPath
if ($parent -and !(Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
$report | Set-Content -LiteralPath $OutputPath -Encoding UTF8
$report | ForEach-Object { Write-Host $_ }
Write-Host ('Report saved: ' + $OutputPath)
