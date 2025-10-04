# ============================================================
# Script de despliegue automático TaxiA-CIMCO
# Autor: Carlos Mario Fuentes García
# ============================================================

$root = "C:\Users\Carlos Fuentes\ProyectosCIMCO"
$functionsPath = "$root\functions"
$frontendPath = "$root\frontend\public"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "INICIANDO DESPLIEGUE AUTOMATICO DE TAXIA-CIMCO" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Limpieza total antes de compilar
Write-Host ""
Write-Host "Limpieza de archivos temporales y compilados..." -ForegroundColor Yellow
if (Test-Path "$root\limpiar-proyecto.ps1") {
    & "$root\limpiar-proyecto.ps1"
} else {
    Write-Host "No se encontró limpiar-proyecto.ps1. Continuando sin limpieza." -ForegroundColor Red
}

# 2. Compilar backend (Firebase Functions)
if (Test-Path "$functionsPath\package.json") {
    Write-Host ""
    Write-Host "Compilando backend..." -ForegroundColor Cyan
    Set-Location $functionsPath
    npm run build
    Write-Host "Backend compilado correctamente." -ForegroundColor Green
}

# 3. Verificar autenticación con Firebase
Write-Host ""
Write-Host "Verificando sesión con Firebase CLI..." -ForegroundColor Yellow
firebase login:list | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "No hay sesión activa. Inicia sesión con: firebase login" -ForegroundColor Red
    exit
}

# 4. Desplegar funciones y hosting
Write-Host ""
Write-Host "Desplegando funciones y frontend a Firebase..." -ForegroundColor Yellow
Set-Location $root
powershell -ExecutionPolicy Bypass -File "./generar-version.ps1"
firebase deploy --only 'functions,hosting'

# 5. Verificación final
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DESPLIEGUE COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "Tu app ya está actualizada en Firebase Hosting." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
