@echo off
title Push PCRE Digital Twin to GitHub
color 0b
echo ======================================================================
echo    PUSHING PCRE DIGITAL TWIN TO GITHUB
echo    Target: https://github.com/nuruato/pcre-digital-twin.git
echo ======================================================================
echo.
cd /d "C:\Users\manis\.gemini\antigravity\scratch\PCRE_DigitalTwin"
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    color 0a
    echo ======================================================================
    echo    SUCCESS! Repository successfully pushed to GitHub!
    echo    View it live at: https://github.com/nuruato/pcre-digital-twin
    echo ======================================================================
) else (
    color 0c
    echo ======================================================================
    echo    Push encountered an error. Please verify GitHub authentication above.
    echo ======================================================================
)
echo.
pause
