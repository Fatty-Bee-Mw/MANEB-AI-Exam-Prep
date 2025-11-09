@echo off
echo ========================================
echo Fixing Mobile Access - Windows Firewall
echo ========================================
echo.
echo Adding firewall rule for port 3000...
echo.

netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=3000

echo.
echo ========================================
echo Firewall rule added successfully!
echo ========================================
echo.
echo Now try accessing from your phone again:
echo http://192.168.1.187:3000
echo.
pause
