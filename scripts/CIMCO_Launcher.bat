@echo off
setlocal enabledelayedexpansion

:: CONFIGURACIÓN
set FRONTEND_DIR=C:\Users\Carlos Fuentes\ProyectosCIMCO\cimco-frontend
set BACKEND_DIR=C:\Users\Carlos Fuentes\ProyectosCIMCO\CIMCO_CentralOperations
set EDGE_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

:: PUERTOS
set FRONTEND_PORT=3000
set BACKEND_PORT=5000

echo ================================
echo      INICIANDO CIMCO APP
echo ================================
echo.

:: FUNCIÓN PARA VERIFICAR PUERTO
call :check_port %FRONTEND_PORT%
set FE_BUSY=%ERRORLEVEL%
call :check_port %BACKEND_PORT%
set BE_BUSY=%ERRORLEVEL%

:: DECISIÓN SI PUERTOS OCUPADOS
if %FE_BUSY% NEQ 0 (
    echo ? El puerto %FRONTEND_PORT% (frontend) ya está en uso.
)
if %BE_BUSY% NEQ 0 (
    echo ? El puerto %BACKEND_PORT% (backend) ya está en uso.
)

if %FE_BUSY% NEQ 0 (
    if %BE_BUSY% NEQ 0 (
        echo.
        set /p CONTINUE=¿Deseas continuar de todas formas? (s/n): 
        if /i not "!CONTINUE!"=="s" (
            echo Cancelado por el usuario.
            exit /b
        )
    )
)

:: ABRIR SERVIDORES EN NUEVAS VENTANAS
echo ?? Iniciando backend (.NET)...
start "CIMCO Backend" cmd /k "cd /d %BACKEND_DIR% && dotnet run"

echo ?? Iniciando frontend (React)...
start "CIMCO Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm start"

:: ABRIR EDGE EN MODO INCOGNITO
timeout /t 10 >nul
echo ?? Abriendo Edge en modo incógnito...
start "" %EDGE_PATH% --inprivate http://localhost:%FRONTEND_PORT%
start "" %EDGE_PATH% --inprivate http://localhost:%BACKEND_PORT%

exit /b

:check_port
:: Función: regresa 1 si puerto está en uso, 0 si está libre
set PORT_TO_CHECK=%1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT_TO_CHECK%') do (
    exit /b 1
)
exit /b 0
