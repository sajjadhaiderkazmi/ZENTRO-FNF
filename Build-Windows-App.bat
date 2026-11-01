@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Install official Node.js 24.22.1 or later first. & pause & exit /b 1)
call npm ci --no-audit --no-fund
if errorlevel 1 exit /b 1
call npm ci --prefix desktop --no-audit --no-fund
if errorlevel 1 exit /b 1
node desktop/build-windows.mjs --unsigned
if errorlevel 1 exit /b 1
echo Evaluation installer: release\windows\local
pause
