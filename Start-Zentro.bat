@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24.22.1 or later is needed for the local server.
  echo You can also double-click Zentro-POS.html to preview the separate demo.
  pause
  exit /b 1
)
echo Zentro - POS local application server
echo Open http://127.0.0.1:4173 in your browser.
echo Keep this window open. Press Ctrl+C to stop.
node --env-file-if-exists=.env server/main.mjs
pause
