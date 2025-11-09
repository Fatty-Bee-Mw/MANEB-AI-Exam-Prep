@echo off
cls
echo ============================================================
echo   Starting MANEB Exam Prep AI Server
echo ============================================================
echo.

REM Kill any existing node processes
taskkill /F /IM node.exe >nul 2>&1

REM Wait a second
timeout /t 2 /nobreak >nul

echo Starting server on port 3000...
echo.
echo ============================================================
echo   Your Mobile Testing URLs:
echo ============================================================
echo.
echo   On Computer:
echo   http://localhost:3000
echo.
echo   On Mobile (Same WiFi):
echo   http://192.168.1.187:3000
echo.
echo   Admin Panel:
echo   http://192.168.1.187:3000/admin
echo   Password: Fatty@Likagwa
echo.
echo ============================================================
echo   Server Starting... Please Wait...
echo ============================================================
echo.

npm run dev
