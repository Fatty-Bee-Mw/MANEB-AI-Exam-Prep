@echo off
echo ============================================================
echo   TESTING SERVER CONNECTION
echo ============================================================
echo.

echo 1. Checking if port 3000 is open...
netstat -ano | findstr :3000
echo.

echo 2. Your computer's IP addresses:
echo.
ipconfig | findstr "IPv4"
echo.

echo 3. Testing localhost (computer browser)...
echo    Open this in your browser: http://localhost:3000
echo.

echo 4. Testing network IP (mobile browser)...
echo    Open this on your phone: http://192.168.1.187:3000
echo.

echo 5. Checking Windows Firewall status...
netsh advfirewall show currentprofile
echo.

echo ============================================================
echo   NEXT STEPS:
echo ============================================================
echo.
echo   ON YOUR COMPUTER:
echo   1. Open browser
echo   2. Go to: http://localhost:3000
echo   3. You should see the neon glass UI
echo.
echo   ON YOUR PHONE (Same WiFi):
echo   1. Open browser (Chrome/Safari)
echo   2. Go to: http://192.168.1.187:3000
echo   3. You should see the same neon glass UI
echo.
echo   IF PHONE DOESN'T WORK:
echo   1. Right-click "FIX-FIREWALL-RUN-AS-ADMIN.bat"
echo   2. Select "Run as administrator"
echo   3. This will allow port 3000 through firewall
echo.
echo ============================================================
pause
