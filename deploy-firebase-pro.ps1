# ============================================================
# Script: deploy-firebase-pro.ps1
# Proyecto: TAXIA-CIMCO
# Descripción: Despliegue profesional que sincroniza GitHub + Firebase
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " DESPLIEGUE PROFESIONAL TAXIA-CIMCO (GITHUB + FIREBASE) "
Write-Host "============================================================"

$base = "C:\Users\Carlos Fuentes\ProyectosCIMCO"

# 1. Confirmar sesión Firebase
Write-Host ""
Write-Host "Verificando sesión de Firebase..."
firebase login:list

# 2. Sincronizar Git
Write-Host ""
Write-Host "Actualizando repositorio local..."
git add .
git commit -m "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git pull origin main
git push origin main
Write-Host "Repositorio sincronizado correctamente."

# 3. Desplegar a Firebase
Write-Host ""
Write-Host "Iniciando despliegue a Firebase..."
firebase deploy --only "functions,hosting"

Write-Host ""
Write-Host "============================================================"
Write-Host " DESPLIEGUE COMPLETADO EXITOSAMENTE "
Write-Host "============================================================"
