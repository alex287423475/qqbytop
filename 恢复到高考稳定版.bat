@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo This will restore tracked files to stable-gaokao-rollback-20260515.
echo Untracked files will NOT be deleted.
echo.
set /p CONFIRM=Type YES to continue: 
if /I not "%CONFIRM%"=="YES" (
  echo Restore cancelled.
  pause
  exit /b 0
)
powershell -NoProfile -ExecutionPolicy Bypass -File ".\查看或恢复版本.ps1" -Ref "stable-gaokao-rollback-20260515" -ConfirmRestore
echo.
pause
