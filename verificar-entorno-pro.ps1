# ============================================================
# Script: verificar-entorno-pro.ps1
# Descripción: Verifica entorno antes del despliegue
# Autor: Carlos Mario Fuentes García
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " VERIFICANDO ENTORNO DE DESPLIEGUE TAXIA-CIMCO"
Write-Host "============================================================"

function Comprobar($nombre, $comando, $requerido = $true) {
    try {
        $salida = & $comando 2>$null
        if ($salida) {
            Write-Host "✅ $nombre detectado correctamente."
        } else {
            if ($requerido) {
                Write-Host "❌ $nombre no encontrado. Instálalo antes de continuar." -ForegroundColor Red
            } else {
                Write-Host "⚠️  $nombre no encontrado (opcional)." -ForegroundColor Yellow
            }
        }
    } catch {
        if ($requerido) {
            Write-Host "❌ $nombre no disponible. Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 🔹 Comprobaciones principales
Comprobar "Node.js" { node -v }
Comprobar "Git" { git --version }
Comprobar "Firebase CLI" { firebase --version }

# 🔹 Comprobación de archivos .env
$envDir = "C:\Users\Carlos Fuentes\ProyectosCIMCO\functions"
$envFile = "$envDir\.env"

if (Test-Path $envFile) {
    Write-Host "✅ Archivo .env encontrado en $envDir"
} else {
    Write-Host "⚠️  Archivo .env no encontrado en $envDir" -ForegroundColor Yellow
    Write-Host "   Crea uno a partir de .env.example antes de desplegar."
}

Write-Host ""
Write-Host "============================================================"
Write-Host " VERIFICACIÓN COMPLETADA"
Write-Host "============================================================"
Write-Host "Si todos los ítems aparecen con ✅ puedes ejecutar:"
Write-Host "   ./actualizar-version-total.ps1"
Write-Host "============================================================"
