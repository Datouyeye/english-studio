@echo off
setlocal
cd /d "%~dp0"
set "DATABASE_URL=file:./dev.db"
set "NEXT_TELEMETRY_DISABLED=1"

where node >nul 2>nul
if %errorlevel%==0 (
  set "NODE_CMD=node"
) else (
  set "NODE_CMD=C:\Users\8210\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)

echo ============================================
echo  English Studio is starting...
echo  Please keep this window open.
echo  The website will open in your browser.
echo ============================================

start "" /b cmd /c "timeout /t 12 /nobreak >nul & start http://localhost:3000"

"%NODE_CMD%" "%~dp0node_modules\next\dist\bin\next" dev -p 3000
