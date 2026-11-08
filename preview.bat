@echo off
setlocal
cd /d "%~dp0"

rem Run "preview.bat 8080" to use another port.
set "PORT=8000"
if not "%~1"=="" set "PORT=%~1"

where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERROR] Python 3 not found in PATH.
  echo         Install from https://www.python.org/downloads/
  echo         and tick "Add python.exe to PATH" during setup.
  echo.
  pause
  exit /b 1
)

title Academic Preview Server - port %PORT%

echo.
echo   Preview URL : http://127.0.0.1:%PORT%/
echo   Edit content.json and save - the page refreshes automatically.
echo   Keep this window open; press Ctrl+C or close it to stop the server.
echo.

rem Open the default browser only after the server answers (up to ~10s).
start "" /min powershell -NoProfile -Command "$u='http://127.0.0.1:%PORT%/index.html'; for($i=0;$i -lt 30;$i++){ try { $null=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 1; Start-Process 'http://127.0.0.1:%PORT%/'; exit 0 } catch {}; Start-Sleep -Milliseconds 300 }"

python -m http.server %PORT% --bind 127.0.0.1
