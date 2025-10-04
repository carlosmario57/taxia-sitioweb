# ============================================================
# Script: actualizar-version-total.ps1
# Descripción: Automatiza la actualización completa del proyecto TAXIA-CIMCO
# Incluye verificación del entorno, generación de versión, inserción del panel moderno,
# limpieza de archivos antiguos y despliegue profesional.
# Autor: Carlos Mario Fuentes García
# ============================================================

$base = "C:\Users\Carlos Fuentes\ProyectosCIMCO"
$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$version = (Get-Date -Format "yyyy.MM.dd-HHmm")

Write-Host ""
Write-Host "============================================================"
Write-Host " INICIANDO PROCESO TOTAL DE ACTUALIZACIÓN Y DESPLIEGUE"
Write-Host "============================================================"

# ============================================================
# 0️⃣ VERIFICACIÓN DE ENTORNO
# ============================================================

Write-Host ""
Write-Host "[0] Verificando entorno de despliegue..."
Write-Host "------------------------------------------------------------"

function Comprobar($nombre, $comando, $requerido = $true) {
    try {
        $salida = & $comando 2>$null
        if ($salida) {
            Write-Host "✅ $nombre detectado correctamente."
        } else {
            if ($requerido) {
                Write-Host "❌ $nombre no encontrado. Instálalo antes de continuar." -ForegroundColor Red
                exit 1
            } else {
                Write-Host "⚠️  $nombre no encontrado (opcional)." -ForegroundColor Yellow
            }
        }
    } catch {
        if ($requerido) {
            Write-Host "❌ $nombre no disponible. Error: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
}

Comprobar "Node.js" { node -v }
Comprobar "Git" { git --version }
Comprobar "Firebase CLI" { firebase --version }

# Comprobación de archivo .env
$envDir = "$base\functions"
$envFile = "$envDir\.env"
if (Test-Path $envFile) {
    Write-Host "✅ Archivo .env encontrado en $envDir"
} else {
    Write-Host "⚠️  Archivo .env no encontrado en $envDir" -ForegroundColor Yellow
    Write-Host "   Crea uno a partir de .env.example antes de desplegar."
}

Write-Host "------------------------------------------------------------"
Write-Host "Verificación del entorno completada correctamente."
Write-Host "------------------------------------------------------------"

# ============================================================
# 1️⃣ GENERAR VERSION.JSON
# ============================================================

Write-Host ""
Write-Host "[1] Generando nueva versión..."
$versionFile = "$base\frontend\public\version.json"
$versionData = @{
    version  = $version
    fecha    = $fecha
    deployed = $fecha
    entorno  = "Producción"
    notas    = "Despliegue automático con panel moderno y limpieza"
} | ConvertTo-Json -Depth 3
$versionData | Out-File -Encoding UTF8 -FilePath $versionFile
Write-Host "Archivo version.json generado correctamente en:"
Write-Host "  $versionFile"
Write-Host "Versión: $version"

# ============================================================
# 2️⃣ INSERTAR FOOTER
# ============================================================

Write-Host ""
Write-Host "[2] Insertando pie de versión en todas las páginas..."
$footerScript = "$base\insertar-footer.ps1"
if (Test-Path $footerScript) {
    & $footerScript
} else {
    Write-Host "Script insertar-footer.ps1 no encontrado. (Se omitió este paso)"
}

# ============================================================
# 3️⃣ INSERTAR PANEL MODERNO
# ============================================================

Write-Host ""
Write-Host "[3] Insertando panel moderno de versión (animado y con modal)..."
$panelProScript = "$base\insertar-version-panel-pro.ps1"
if (Test-Path $panelProScript) {
    & $panelProScript
} else {
    Write-Host "Script insertar-version-panel-pro.ps1 no encontrado. (Se omitió este paso)"
}

# ============================================================
# 4️⃣ LIMPIEZA DE ARCHIVOS ANTIGUOS
# ============================================================

Write-Host ""
Write-Host "[4] Limpiando versiones anteriores..."
$antiguos = @(
    "$base\frontend\public\js\version-footer.js",
    "$base\frontend\public\js\panel-version-antiguo.js"
)
foreach ($file in $antiguos) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Eliminado: $file"
    }
}
Write-Host "Limpieza completada."

# ============================================================
# 5️⃣ DESPLIEGUE PROFESIONAL
# ============================================================

Write-Host ""
Write-Host "[5] Despliegue profesional (Firebase + GitHub Sync)..."
$deployScript = "$base\deploy-firebase-pro.ps1"
if (Test-Path $deployScript) {
    & $deployScript
} else {
    Write-Host "Script deploy-firebase-pro.ps1 no encontrado. (Se omitió este paso)"
}

# ============================================================
# ✅ FINAL
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " PROCESO COMPLETO: TAXIA-CIMCO ACTUALIZADO Y PUBLICADO"
Write-Host "============================================================"
Write-Host "Versión: $version"
Write-Host "Fecha de despliegue: $fecha"
Write-Host "Carpeta base: $base"
Write-Host "============================================================"
