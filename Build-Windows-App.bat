@echo off
cd /d "%~dp0"
echo Configure desktop\desktop-config.json first:
echo mode=cloud with your HTTPS server URL, or mode=local for a standalone database.
echo This creates an evaluation installer. Use a signing certificate for commercial distribution.
call npm --prefix desktop install
if errorlevel 1 goto failed
call npm --prefix desktop run dist:win
if errorlevel 1 goto failed
echo Build finished. Check release\windows.
pause
exit /b 0
:failed
echo Build failed. Read the error above; no completed installer is claimed.
pause
exit /b 1
