# ============================================================
# 🚀 Script: verificar-entorno.ps1
# Proyecto: TaxiA-CIMCO
# Descripción: Verifica que el entorno esté correctamente configurado
# antes de ejecutar despliegues o pruebas.
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " 🔍 VERIFICACION AUTOMATICA DEL ENTORNO TAXIA-CIMCO "
Write-Host "============================================================"

$base = "C:\Users\Carlos Fuentes\ProyectosCIMCO"
$frontend = "$base\frontend"
$functions = "$base\functions"
$envFile = "$functions\.env"

# -----------------------------------------
# 1️⃣ Verificar Firebase CLI
# -----------------------------------------
Write-Host ""
Write-Host "[1] Verificando Firebase CLI..." -ForegroundColor Cyan
$firebase = Get-Command firebase -ErrorAction SilentlyContinue
if ($firebase) {
    $version = firebase --version
    Write-Host "✅ Firebase CLI detectado. Versión: $version" -ForegroundColor Green
} else {
    Write-Host "❌ Firebase CLI no encontrado. Instálalo con: npm install -g firebase-tools" -ForegroundColor Red
}

# -----------------------------------------
# 2️⃣ Verificar sesión activa en Firebase
# -----------------------------------------
Write-Host ""
Write-Host "[2] Verificando sesión activa..." -ForegroundColor Cyan
try {
    $loginStatus = firebase login:list
    if ($loginStatus -match "Logged in as") {
        Write-Host "✅ Sesión activa detectada." -ForegroundColor Green
    } else {
        Write-Host "⚠️ No se detectó sesión. Ejecuta: firebase login" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error al comprobar la sesión de Firebase CLI." -ForegroundColor Red
}

# -----------------------------------------
# 3️⃣ Verificar carpetas clave
# -----------------------------------------
Write-Host ""
Write-Host "[3] Verificando estructura de carpetas..." -ForegroundColor Cyan

if (Test-Path $frontend) {
    Write-Host "✅ Carpeta FRONTEND detectada: $frontend" -ForegroundColor Green
} else {
    Write-Host "❌ Carpeta FRONTEND no encontrada." -ForegroundColor Red
}

if (Test-Path $functions) {
    Write-Host "✅ Carpeta FUNCTIONS detectada: $functions" -ForegroundColor Green
} else {
    Write-Host "❌ Carpeta FUNCTIONS no encontrada." -ForegroundColor Red
}

# -----------------------------------------
# 4️⃣ Verificar archivo .env
# -----------------------------------------
Write-Host ""
Write-Host "[4] Verificando archivo .env..." -ForegroundColor Cyan
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    Write-Host "✅ Archivo .env encontrado." -ForegroundColor Green
    if ($envContent -match "GCLOUD_PROJECT" -and $envContent -match "FIREBASE_PROJECT_ID") {
        Write-Host "✅ Variables principales configuradas correctamente." -ForegroundColor Green
    } else {
        Write-Host "⚠️ Faltan variables principales en .env." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ No se encontró el archivo .env en: $envFile" -ForegroundColor Red
}

# -----------------------------------------
# 5️⃣ Verificar archivos de despliegue
# -----------------------------------------
Write-Host ""
Write-Host "[5] Verificando scripts de despliegue..." -ForegroundColor Cyan
$deployFiles = @(
    "$base\generar-version.ps1",
    "$base\insertar-footer.ps1",
    "$base\insertar-version-panel.ps1",
    "$base\deploy-firebase-pro.ps1",
    "$base\actualizar-version-total.ps1"
)

foreach ($file in $deployFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $([System.IO.Path]::GetFileName($file)) detectado." -ForegroundColor Green
    } else {
        Write-Host "⚠️ Falta $([System.IO.Path]::GetFileName($file))." -ForegroundColor Yellow
    }
}

# -----------------------------------------
# 6️⃣ Verificar puertos de emuladores
# -----------------------------------------
Write-Host ""
Write-Host "[6] Verificando puertos de emuladores..." -ForegroundColor Cyan
$ports = @(5000, 5001, 8080)
foreach ($p in $ports) {
    $used = (Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $p })
    if ($used) {
        Write-Host "⚠️ Puerto $p en uso (posible emulador activo)." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Puerto $p libre." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host " 🔧 VERIFICACION FINALIZADA "
Write-Host "============================================================"
