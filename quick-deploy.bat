@echo off
echo ========================================
echo   Quick Deploy to Notebook
echo ========================================
echo.

REM Check if in moltbot directory
if not exist "moltbot.mjs" (
    echo ERROR: Please run this script from the moltbot directory
    pause
    exit /b 1
)

REM Check if deployment package exists
if not exist "moltbot-notebook-deploy.tar.gz" (
    echo ERROR: Deployment package not found
    echo Please run: git pull origin main
    pause
    exit /b 1
)

echo Deployment package found!
echo.
echo To deploy to a notebook:
echo.
echo 1. Copy this entire directory to the notebook
echo    (via USB drive, network share, or cloud storage)
echo.
echo 2. On the notebook, run:
echo    notebook-setup.bat
echo.
echo Or copy just the deployment package:
echo   - moltbot-notebook-deploy.tar.gz
echo   - notebook-setup.bat
echo.
echo Then on the notebook:
echo   tar -xzf moltbot-notebook-deploy.tar.gz -C C:\moltbot
echo   cd C:\moltbot
echo   notebook-setup.bat
echo.
pause
