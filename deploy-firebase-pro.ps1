# ============================================================
# Script: deploy-firebase-pro.ps1
# Descripción: Despliega automáticamente TAXIA-CIMCO a Firebase
# con sincronización GitHub y verificación de sesión.
# Autor: Carlos Mario Fuentes García
# ============================================================

$ErrorActionPreference = "Stop"

function Mostrar-Linea($texto, $color="White") {
    Write-Host $texto -ForegroundColor $color
}

function Verificar-Error($mensaje) {
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: $mensaje" -ForegroundColor Red
        exit 1
    }
}

$inicio = Get-Date
$base = "C:\Users\Carlos Fuentes\ProyectosCIMCO"

Write-Host ""
Mostrar-Linea "============================================================" Cyan
Mostrar-Linea " DESPLIEGUE PROFESIONAL TAXIA-CIMCO (GITHUB + FIREBASE)" Yellow
Mostrar-Linea "============================================================" Cyan
Write-Host ""

# 1️⃣ Verificar sesión Firebase
Mostrar-Linea "[1] Verificando sesión activa en Firebase CLI..." Yellow
$firebaseUser = firebase login:list 2>$null | Select-String "Logged in as"
if (-not $firebaseUser) {
    Mostrar-Linea "⚠️  No hay sesión activa en Firebase. Intentando iniciar..." DarkYellow
    firebase login
    Verificar-Error "No se pudo iniciar sesión en Firebase."
} else {
    Mostrar-Linea "✅ Sesión activa detectada: $firebaseUser" Green
}

# 2️⃣ Actualizar repositorio GitHub
Mostrar-Linea "" 
Mostrar-Linea "[2] Actualizando y sincronizando repositorio local..." Yellow

Set-Location $base
git add . | Out-Null
git commit -m "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" | Out-Null
git pull origin main --rebase
Verificar-Error "No se pudo hacer git pull."
git push origin main
Verificar-Error "No se pudo sincronizar con GitHub."

Mostrar-Linea "✅ Repositorio sincronizado correctamente." Green

# 3️⃣ Desplegar a Firebase Hosting + Functions
Mostrar-Linea ""
Mostrar-Linea "[3] Desplegando a Firebase (Hosting + Functions)..." Yellow

firebase deploy --only functions,hosting
Verificar-Error "El despliegue de Firebase falló."

Mostrar-Linea ""
Mostrar-Linea "✅ Despliegue a Firebase completado exitosamente." Green

# 4️⃣ Mostrar tiempo total del despliegue
$fin = Get-Date
$duracion = [math]::Round(($fin - $inicio).TotalMinutes, 2)

Mostrar-Linea ""
Mostrar-Linea "============================================================" Cyan
Mostrar-Linea " DESPLIEGUE FINALIZADO CORRECTAMENTE" Green
Mostrar-Linea "============================================================" Cyan
Mostrar-Linea "Duración total: $duracion minutos" White
Mostrar-Linea "Fecha: $($fin.ToString('yyyy-MM-dd HH:mm:ss'))" White
Mostrar-Linea "============================================================" Cyan
