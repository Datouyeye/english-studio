@echo off
cd /d "%~dp0"
set npm_config_registry=https://registry.npmmirror.com

where node >nul 2>&1
if errorlevel 1 (
  echo [English Studio] Node.js not found. Install from https://nodejs.org (LTS) first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies, this takes a few minutes...
  call npx pnpm@10 install
  if not exist "node_modules" (
    echo Install failed. Please check network and try again.
    pause
    exit /b 1
  )
)

if not exist "generated\prisma" (
  call npx pnpm@10 db:generate
)

if not exist "dev.db" (
  call npx pnpm@10 db:migrate
)

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
  start "" "http://localhost:3000"
  exit /b 0
)

start "" /min cmd /c "node node_modules\next\dist\bin\next dev -p 3000"
start "" /min cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:3000"
exit /b 0
