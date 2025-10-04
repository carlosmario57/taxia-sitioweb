# ============================================================
# Script: actualizar-version-total.ps1
# Proyecto: TAXIA-CIMCO
# Descripción: Ejecuta todos los pasos de actualización y despliegue
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " INICIANDO PROCESO TOTAL DE ACTUALIZACION Y DESPLIEGUE..."
Write-Host "============================================================"

$base = "C:\Users\Carlos Fuentes\ProyectosCIMCO"

# Paso 1 - Generar nueva versión
Write-Host ""
Write-Host "[1] Generando nueva version (version.json)..."
if (Test-Path "$base\generar-version.ps1") {
    & "$base\generar-version.ps1"
} else {
    Write-Host "Archivo generar-version.ps1 no encontrado." -ForegroundColor Red
}

# Paso 2 - Insertar pie de versión
Write-Host ""
Write-Host "[2] Insertando pie de version en todas las paginas..."
if (Test-Path "$base\insertar-footer.ps1") {
    & "$base\insertar-footer.ps1"
} else {
    Write-Host "Archivo insertar-footer.ps1 no encontrado." -ForegroundColor Red
}

# Paso 3 - Insertar panel de versión (solo vistas administrativas)
Write-Host ""
Write-Host "[3] Insertando panel de version en las vistas administrativas..."
if (Test-Path "$base\insertar-version-panel.ps1") {
    & "$base\insertar-version-panel.ps1"
} else {
    Write-Host "Archivo insertar-version-panel.ps1 no encontrado. (Se omitió este paso)" -ForegroundColor Yellow
}

# Paso 4 - Despliegue profesional (Firebase + GitHub)
Write-Host ""
Write-Host "[4] Ejecutando despliegue profesional (Firebase + GitHub Sync)..."
if (Test-Path "$base\deploy-firebase-pro.ps1") {
    & "$base\deploy-firebase-pro.ps1"
} else {
    Write-Host "Archivo deploy-firebase-pro.ps1 no encontrado." -ForegroundColor Red
}

# Fin del proceso
Write-Host ""
Write-Host "============================================================"
Write-Host " PROCESO COMPLETO: TAXIA-CIMCO ACTUALIZADO Y PUBLICADO"
Write-Host "============================================================"
Write-Host "Fecha de despliegue: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Host "Carpeta base: $base"
Write-Host "============================================================"
