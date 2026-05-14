@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\保存当前版本.ps1" -Message "checkpoint: manual save"
echo.
pause
