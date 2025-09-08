@echo off
setlocal

REM CONFIGURA LOS PUERTOS
set BACKEND_PORT=7190
set FRONTEND_PORT=5173

REM RUTAS A TUS PROYECTOS
set BACKEND_DIR="C:\Users\Carlos Fuentes\ProyectosCIMCO\CIMCO_CentralOperations"
set FRONTEND_DIR="C:\Users\Carlos Fuentes\ProyectosCIMCO\cimco-frontend"

REM FUNCIÓN PARA VERIFICAR SI EL PUERTO ESTÁ EN USO
call :check_port %BACKEND_PORT% backend
call :check_port %FRONTEND_PORT% frontend

REM INICIAR SERVIDORES EN NUEVAS CONSOLAS
start "Backend" cmd /k "cd /d %BACKEND_DIR% && dotnet run"
start "Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm start"

REM ABRIR EDGE EN MODO INCOGNITO
timeout /t 8 >nul
start msedge --inprivate http://localhost:%FRONTEND_PORT%

exit /b

:check_port
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%1') do (
    tasklist /fi "PID eq %%a" | findstr /i "imagename"
    echo El puerto %1 ya está en uso. Proceso: %%a
    echo Cierra el proceso o cambia el puerto antes de continuar.
    pause
    exit /b
)
goto :eof
