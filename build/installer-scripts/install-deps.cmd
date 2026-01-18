@echo off
REM YSnag Dependency Installer Wrapper
REM This batch file handles ExecutionPolicy issues gracefully

setlocal EnableDelayedExpansion

echo.
echo ========================================
echo   YSnag Dependency Installer
echo ========================================
echo.

REM Get the directory of this script
set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%install-deps.ps1"

REM Check if PowerShell script exists
if not exist "%PS_SCRIPT%" (
    echo [ERROR] PowerShell script not found: %PS_SCRIPT%
    echo Please reinstall YSnag.
    goto :error_exit
)

REM Try running with default policy first
echo Checking dependencies...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -Silent 2>nul
if %ERRORLEVEL% EQU 0 (
    goto :success_exit
)

REM If that failed, try with explicit bypass
echo.
echo Retrying with elevated permissions...
echo.

powershell -NoProfile -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%PS_SCRIPT%\"' -Verb RunAs -Wait" 2>nul
if %ERRORLEVEL% EQU 0 (
    goto :success_exit
)

REM Show manual instructions if all else fails
echo.
echo ========================================
echo   Manual Installation Required
echo ========================================
echo.
echo The automatic installation could not be completed.
echo Please run the following commands manually in PowerShell (as Administrator):
echo.
echo   winget install yt-dlp.yt-dlp
echo   winget install Gyan.FFmpeg
echo.
echo Or download manually from:
echo   yt-dlp:  https://github.com/yt-dlp/yt-dlp/releases
echo   ffmpeg:  https://ffmpeg.org/download.html
echo.
goto :error_exit

:success_exit
echo.
echo Installation completed!
echo.
pause
exit /b 0

:error_exit
echo.
pause
exit /b 1
