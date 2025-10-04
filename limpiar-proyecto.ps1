# ============================================================
# 🧹 Script de limpieza total del proyecto TaxiA-CIMCO
# Autor: Carlos Mario Fuentes García
# ============================================================

$root = "C:\Users\Carlos Fuentes\ProyectosCIMCO"

Write-Host "🚖 Iniciando limpieza total del proyecto..." -ForegroundColor Cyan

# Carpetas que se eliminarán
$folders = @(
    "$root\frontend\dist",
    "$root\frontend\build",
    "$root\frontend\.cache",
    "$root\frontend\.vite",
    "$root\functions\lib",
    "$root\functions\dist",
    "$root\functions\.cache",
    "$root\functions\node_modules",
    "$root\.firebase",
    "$root\.cache"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Remove-Item -Recurse -Force -Path $folder
        Write-Host "🗑 Eliminado: $folder" -ForegroundColor Yellow
    } else {
        Write-Host "✅ No existe: $folder (saltado)" -ForegroundColor Green
    }
}

# Limpiar archivos temporales
$files = Get-ChildItem -Path $root -Recurse -Include "*.log","*.tmp","*.tsbuildinfo" -ErrorAction SilentlyContinue
foreach ($file in $files) {
    Remove-Item $file.FullName -Force
    Write-Host "🧽 Archivo temporal eliminado: $($file.FullName)" -ForegroundColor DarkGray
}

# Reconstruir backend si existe package.json
$functionsPath = "$root\functions"
if (Test-Path "$functionsPath\package.json") {
    Write-Host "`n⚙️ Reinstalando dependencias del backend..." -ForegroundColor Cyan
    Set-Location $functionsPath
    npm install
    Write-Host "✅ Backend recompilado correctamente." -ForegroundColor Green
}

# Reconstruir frontend si tiene package.json
$frontendPath = "$root\frontend"
if (Test-Path "$frontendPath\package.json") {
    Write-Host "`n⚙️ Reinstalando dependencias del frontend..." -ForegroundColor Cyan
    Set-Location $frontendPath
    npm install
    Write-Host "✅ Frontend listo y limpio." -ForegroundColor Green
}

Set-Location $root
Write-Host "`n🎯 Limpieza total completada con éxito." -ForegroundColor Magenta
Write-Host "🚀 Tu proyecto está listo para compilar o desplegar." -ForegroundColor Cyan
