@echo off
echo ========================================================
echo   Launching PCRE 3D Digital Twin (Three.js WebGL)...
echo ========================================================
cd /d "%~dp0web_prototype"
start "" http://localhost:8000/index.html
python -m http.server 8000
pause
