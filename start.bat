@echo off
REM ═══════════════════════════════════════════════════════════════
REM   ERP MMHIGHMETRIK · arranque automático Windows
REM   Abre 2 ventanas CMD: backend NAS + servidor web frontend
REM ═══════════════════════════════════════════════════════════════

echo.
echo ============================================================
echo   ERP MMHIGHMETRIK Engineers · Arrancando servicios
echo ============================================================
echo.

REM Verifica config.json del backend
if not exist "erp-nas-backend\config.json" (
    echo [ERROR] Falta archivo erp-nas-backend\config.json
    echo Copia erp-nas-backend\config.example.json a config.json
    echo y completa las credenciales del NAS.
    pause
    exit /b 1
)

REM Verifica node_modules backend
if not exist "erp-nas-backend\node_modules" (
    echo [INFO] Instalando dependencias del backend...
    cd erp-nas-backend
    call npm install
    cd ..
)

echo [1/2] Iniciando Backend NAS en http://localhost:3001 ...
start "ERP Backend NAS" cmd /k "cd erp-nas-backend && node server.js"

timeout /t 2 /nobreak > nul

echo [2/2] Iniciando Servidor Web en http://localhost:8000 ...
start "ERP Frontend Web" cmd /k "npx http-server -p 8000 -c-1 --cors"

timeout /t 3 /nobreak > nul

echo.
echo ============================================================
echo   ✓ ERP corriendo en: http://localhost:8000
echo   ✓ Backend NAS en:    http://localhost:3001
echo ============================================================
echo.
echo Abriendo browser...
start http://localhost:8000

echo.
echo Para detener todo, cierra las 2 ventanas CMD que se abrieron.
echo.
pause
