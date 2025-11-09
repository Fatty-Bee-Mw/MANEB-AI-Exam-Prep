@echo off
echo ============================================================
echo   FIXING WINDOWS FIREWALL FOR MOBILE ACCESS
echo ============================================================
echo.
echo   This will allow port 3000 through Windows Firewall
echo   so you can access the app on your mobile device.
echo.
echo ============================================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with Administrator privileges... OK
    echo.
) else (
    echo ERROR: This script needs to run as Administrator!
    echo.
    echo Please:
    echo 1. Right-click this file
    echo 2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo Adding firewall rules...
echo.

REM Add firewall rule for port 3000
netsh advfirewall firewall delete rule name="Next.js Port 3000" >nul 2>&1
netsh advfirewall firewall add rule name="Next.js Port 3000" dir=in action=allow protocol=TCP localport=3000

echo.
echo ============================================================
echo   SUCCESS! Firewall configured.
echo ============================================================
echo.
echo   Port 3000 is now allowed through Windows Firewall.
echo.
echo   You can now access the app on your mobile:
echo   http://192.168.1.187:3000
echo.
echo   Make sure:
echo   1. Your phone is on the SAME WiFi
echo   2. The server is running (use START-SERVER.bat)
echo.
echo ============================================================
echo.
pause
