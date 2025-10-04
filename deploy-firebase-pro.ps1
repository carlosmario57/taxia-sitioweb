# ============================================================
# Script: deploy-firebase-pro.ps1
# Descripción: Despliegue profesional CI/CD TAXIA-CIMCO
# Incluye commit automático con versión actual y despliegue Firebase
# Autor: Carlos Mario Fuentes García
# ============================================================

# -----------------------------
# 🎨 Colores para mensajes
# -----------------------------
$verde = "Green"
$amarillo = "Yellow"
$rojo = "Red"
$azul = "Cyan"

# -----------------------------
# 🧭 Configuración base
# -----------------------------
$base = "C:\Users\Carlos Fuentes\ProyectosCIMCO"
$versionFile = "$base\frontend\public\version.json"
$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$horaInicio = Get-Date

Write-Host ""
Write-Host "============================================================" -ForegroundColor $azul
Write-Host "   🚀 DESPLIEGUE PROFESIONAL TAXIA-CIMCO (GITHUB + FIREBASE)" -ForegroundColor $verde
Write-Host "============================================================" -ForegroundColor $azul
Write-Host ""

# -----------------------------
# 📖 Leer versión desde version.json
# -----------------------------
if (Test-Path $versionFile) {
    try {
        $versionData = Get-Content $versionFile | ConvertFrom-Json
        $version = $versionData.version
        Write-Host "✅ Versión detectada desde version.json:" $version -ForegroundColor $verde
    } catch {
        Write-Host "⚠ No se pudo leer version.json. Usando marca temporal." -ForegroundColor $amarillo
        $version = (Get-Date -Format "yyyy.MM.dd-HHmm")
    }
} else {
    Write-Host "⚠ No se encontró version.json. Se usará marca temporal." -ForegroundColor $amarillo
    $version = (Get-Date -Format "yyyy.MM.dd-HHmm")
}

# -----------------------------
# 🔐 Verificar sesión Firebase
# -----------------------------
Write-Host ""
Write-Host "[1] Verificando sesión activa en Firebase CLI..." -ForegroundColor $amarillo
$firebaseLogin = firebase login:list 2>$null
if ($firebaseLogin -match "Logged in as") {
    $correo = ($firebaseLogin -split "Logged in as ")[1]
    Write-Host "✅ Sesión activa detectada: $correo" -ForegroundColor $verde
} else {
    Write-Host "❌ No hay sesión activa en Firebase CLI. Inicia sesión con:" -ForegroundColor $rojo
    Write-Host "   firebase login" -ForegroundColor $amarillo
    exit
}

# -----------------------------
# 🧩 Actualizar y sincronizar GitHub
# -----------------------------
Write-Host ""
Write-Host "[2] Actualizando y sincronizando repositorio local..." -ForegroundColor $amarillo
Set-Location $base

git add . | Out-Null
git commit -m "deploy: versión $version publicada 🚀" 2>$null
git pull origin main
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Repositorio sincronizado correctamente." -ForegroundColor $verde
} else {
    Write-Host "⚠ Ocurrió un aviso durante la sincronización Git, revisa si hay conflictos." -ForegroundColor $amarillo
}

# -----------------------------
# 🔥 Despliegue a Firebase
# -----------------------------
Write-Host ""
Write-Host "[3] Desplegando a Firebase (Hosting + Functions)..." -ForegroundColor $amarillo
$deploy = firebase deploy --only "functions,hosting" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Despliegue completado correctamente." -ForegroundColor $verde
} else {
    Write-Host "❌ ERROR: El despliegue de Firebase falló." -ForegroundColor $rojo
    Write-Host $deploy
    exit 1
}

# -----------------------------
# 🧾 Resumen final
# -----------------------------
$horaFin = Get-Date
$duracion = ($horaFin - $horaInicio).TotalMinutes
Write-Host ""
Write-Host "============================================================" -ForegroundColor $azul
Write-Host " DEPLOY FINALIZADO CON ÉXITO 🚀" -ForegroundColor $verde
Write-Host "============================================================" -ForegroundColor $azul
Write-Host "Versión publicada: $version" -ForegroundColor $verde
Write-Host "Fecha: $fecha" -ForegroundColor $verde
Write-Host "Duración total: {0:N2} minutos" -f $duracion
Write-Host "Repositorio: https://github.com/carlosmario57/taxia-sitioweb" -ForegroundColor $azul
Write-Host "============================================================" -ForegroundColor $azul
Write-Host ""
