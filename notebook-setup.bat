@echo off
echo ========================================
echo   Moltbot Notebook Setup
echo ========================================
echo.

REM Check Node.js version
echo Checking Node.js version...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js v22 or higher
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo Found Node.js %NODE_VERSION%

REM Get installation directory
set /p INSTALL_DIR="Enter installation directory (default: C:\moltbot): "
if "%INSTALL_DIR%"=="" set INSTALL_DIR=C:\moltbot

echo.
echo Installing to: %INSTALL_DIR%
echo.

REM Create directory
if not exist "%INSTALL_DIR%" (
    echo Creating directory...
    mkdir "%INSTALL_DIR%"
)

REM Check if moltbot files exist
if not exist "%INSTALL_DIR%\moltbot.mjs" (
    echo ERROR: Moltbot files not found in %INSTALL_DIR%
    echo.
    echo Please copy the moltbot directory first:
    echo 1. Copy D:\workspace\moltbot to the notebook
    echo 2. Or extract the moltbot archive to %INSTALL_DIR%
    echo.
    pause
    exit /b 1
)

REM Create config directory
echo Creating config directory...
if not exist "%USERPROFILE%\.clawdbot" mkdir "%USERPROFILE%\.clawdbot"

REM Copy config file
echo Copying configuration...
copy /Y "%INSTALL_DIR%\notebook-setup.json" "%USERPROFILE%\.clawdbot\moltbot.json" >nul
if errorlevel 1 (
    echo ERROR: Failed to copy configuration
    pause
    exit /b 1
)

REM Create desktop shortcut
echo Creating desktop shortcut...
set DESKTOP=%USERPROFILE%\Desktop
(
  echo @echo off
  echo title Moltbot
  echo cd /d "%INSTALL_DIR%"
  echo set "NODE_PATH=C:\Users\%USERNAME%\AppData\Roaming\nvm\v22.12.0"
  echo set "PATH=%%NODE_PATH%%;%%PATH%%"
  echo.
  echo :menu
  echo cls
  echo echo ========================================
  echo echo   Moltbot AI Assistant
  echo echo ========================================
  echo echo [1] Chat mode
  echo echo [2] Start Gateway
  echo echo [3] Exit
  echo echo.
  echo set /p choice=Choose (1-3):
  echo.
  echo if "%%choice%%"=="1" goto chat
  echo if "%%choice%%"=="2" goto gateway
  echo if "%%choice%%"=="3" goto end
  echo goto menu
  echo.
  echo :chat
  echo cls
  echo echo Chat Mode - Type 'exit' to return
 170  echo echo.
  echo :chat_loop
  echo set /p msg="You: "
  echo if /i "%%msg%%"=="exit" goto menu
  echo if "%%msg%%"=="" goto chat_loop
 67  echo echo.
  echo "%%NODE_PATH%%\node.exe" scripts\run-node.mjs agent --session-id main --message "%%msg%%"
  echo echo.
  echo goto chat_loop
  echo.
  echo :gateway
  echo cls
  echo echo Starting Gateway...
  echo start /MIN cmd /c "cd /d "%INSTALL_DIR%" ^&^& set PATH=%%NODE_PATH%%;%%PATH%% ^&^& node moltbot.mjs gateway --bind lan"
  echo echo Gateway started. Wait 5-10 seconds before chatting.
 74  91  echo echo.
  echo pause
 92  echo goto menu
 93  echo.
 94  echo :end
 95  echo exit
) > "%DESKTOP%\Moltbot.bat"

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Configuration:
echo   - Config: %USERPROFILE%\.clawdbot\moltbot.json
echo   - Desktop: %DESKTOP%\Moltbot.bat
echo   - Install: %INSTALL_DIR%
echo.
echo Next steps:
echo   1. Double-click Moltbot.bat on desktop
echo   2. Choose [2] to start Gateway
echo   3. Choose [1] to start chatting
echo.
pause
