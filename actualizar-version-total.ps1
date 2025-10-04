# ============================================================
# Script: actualizar-version-total.ps1
# Proyecto: TaxiA-CIMCO
# Autor: Carlos Mario Fuentes García
# Descripción: Ejecuta todos los pasos de actualización y despliegue.
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " INICIANDO PROCESO TOTAL DE ACTUALIZACION Y DESPLIEGUE... "
Write-Host "============================================================"

# Ruta base del proyecto
$base = "C:\Users\Carlos Fuentes\ProyectosCIMCO"

# Paso 1: Generar versión
Write-Host ""
Write-Host "[1] Generando nueva version (version.json)..."
& "$base\generar-version.ps1"

# Paso 2: Insertar footer
Write-Host ""
Write-Host "[2] Insertando pie de version en todas las paginas..."
& "$base\insertar-footer.ps1"

# Paso 3: Insertar panel de version en vistas del CEO
Write-Host ""
Write-Host "[3] Insertando panel de version en las vistas administrativas..."
& "$base\insertar-version-panel.ps1"

# Paso 4: Desplegar proyecto (Firebase + GitHub)
Write-Host ""
Write-Host "[4] Ejecutando despliegue profesional (Firebase + GitHub Sync)..."
& "$base\deploy-firebase-pro.ps1"

# Confirmación final
Write-Host ""
Write-Host "============================================================"
Write-Host " PROCESO COMPLETO: TAXIA-CIMCO ACTUALIZADO Y PUBLICADO "
Write-Host "============================================================"
Write-Host ("Fecha de despliegue: " + (Get-Date -Format "yyyy-MM-dd HH:mm"))
Write-Host ("Carpeta base: " + $base)
Write-Host "============================================================"
