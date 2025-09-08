@echo off
echo Abriendo CIMCO en modo InPrivate...

REM Abre el frontend (React)
start msedge --inprivate http://localhost:3000

REM Abre el backend (Blazor Server)
start msedge --inprivate https://localhost:5001

exit
