@echo off
echo Construyendo el instalador de Subtitulos Bold...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer\construir-instalador.ps1"
echo.
pause
