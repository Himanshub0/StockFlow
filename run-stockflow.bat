@echo off
setlocal

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

echo Checking StockFlow backend...
powershell -NoProfile -Command "try { $response=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:5000/api/health' -TimeoutSec 1; if($response.StatusCode -eq 200){exit 0}else{exit 1} } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
  echo Starting StockFlow backend...
  start "StockFlow Backend" /D "%PROJECT_DIR%" cmd /k python -m backend.app
) else (
  echo Backend is already running.
)

echo Waiting for Flask on port 5000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready=$false; for($i=0; $i -lt 20; $i++){try{$response=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:5000/api/health' -TimeoutSec 1;if($response.StatusCode -eq 200){$ready=$true;break}}catch{};Start-Sleep -Milliseconds 500}; if(-not $ready){Write-Host 'Backend is still starting; opening the app anyway.'}"

echo Opening StockFlow...
start "" "http://127.0.0.1:5000/login.html"

endlocal
