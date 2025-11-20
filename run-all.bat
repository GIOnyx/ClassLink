@echo off
REM Batch script to start backend and frontend in separate command windows
REM Usage: double-click or run from repository root: run-all.bat

REM Resolve script directory and change to it when running commands
set SCRIPT_DIR=%~dp0

REM Start backend (Spring Boot via Maven wrapper)
start "Backend" cmd /k "cd /d "%SCRIPT_DIR%server" && mvnw.cmd spring-boot:run"

REM Start frontend (Vite / npm)
start "Frontend" cmd /k "cd /d "%SCRIPT_DIR%client" && npm run dev"

exit /B 0
