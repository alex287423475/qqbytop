@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$tag='stable-manual-'+(Get-Date -Format 'yyyyMMdd-HHmmss'); & '.\保存当前版本.ps1' -Message ('checkpoint: '+$tag) -TagStable -TagName $tag"
echo.
pause
