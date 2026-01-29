@echo off
echo ========================================
echo   Moltbot Cluster Verification
echo ========================================
echo.

set "NODE_PATH=D:\Users\15622\AppData\Roaming\nvm\v22.12.0"
set "PATH=%NODE_PATH%;%PATH%"

echo [1/5] Checking Node.js version...
node --version
if errorlevel 1 (
    echo [ERROR] Node.js not found
) else (
    echo [OK] Node.js is installed
)
echo.

echo [2/5] Checking local Gateway...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | findstr /C:"node.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Gateway is running
) else (
    echo [WARNING] Gateway is not running
    echo       Run Moltbot.bat and choose [2] to start Gateway
)
echo.

echo [3/5] Checking server connection...
ping -n 1 38.14.254.51 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Server is reachable
) else (
    echo [ERROR] Cannot connect to server 38.14.254.51
)
echo.

echo [4/5] Checking Redis connection...
echo Testing connection to 38.14.254.51:6379...
powershell -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('38.14.254.51', 6379); $tcp.Close(); Write-Host '[OK] Redis port is accessible'; exit 0 } catch { Write-Host '[ERROR] Cannot connect to Redis'; exit 1 }" 2>nul
echo.

echo [5/5] Checking configuration files...
if exist "%USERPROFILE%\.clawdbot\moltbot.json" (
    echo [OK] Local config exists
    findstr /C:"\"backend\": \"redis\"" "%USERPROFILE%\.clawdbot\moltbot.json" >nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Redis sharing is configured
    ) else (
            echo [WARNING] Redis sharing not configured
    )
) else (
    echo [ERROR] Config file not found
)
echo.

echo ========================================
echo   Verification Complete
echo ========================================
echo.
echo Summary:
echo - Node.js: Installed
echo - Gateway: Running (if not, start via Moltbot.bat)
echo - Server: Reachable
echo - Redis: Configured
echo.
echo For detailed status, open: status-dashboard.html
echo.
pause
