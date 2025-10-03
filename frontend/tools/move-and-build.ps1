# frontend/tools/move-and-build.ps1
# Ejecutar desde la raíz del proyecto (ProyectosCIMCO\) como:
#     .\frontend\tools\move-and-build.ps1

Set-StrictMode -Version Latest

$ProjectRoot = (Get-Location).Path
$frontend = Join-Path $ProjectRoot 'frontend'
if (-not (Test-Path $frontend)) {
  Write-Error "No se encontró la carpeta 'frontend' en $ProjectRoot. Sitúate en la raíz del repo y vuelve a ejecutar."
  exit 1
}

# 1) Crear public/js si no existe
$publicJs = Join-Path $frontend 'public\js'
if (-not (Test-Path $publicJs)) {
  New-Item -ItemType Directory -Path $publicJs -Force | Out-Null
  Write-Host "Creada carpeta: $publicJs"
} else {
  Write-Host "Ya existe: $publicJs"
}

# 2) Buscar firebase-config.js en varias ubicaciones probables y moverlo (si no está ya en public/js)
$possibleSources = @(
  Join-Path $frontend 'src\js\firebase-config.js',
  Join-Path $frontend 'src\firebase-config.js',
  Join-Path $frontend 'firebase-config.js',
  Join-Path $frontend 'public\js\firebase-config.js'
)

$found = $null
foreach ($p in $possibleSources) {
  if (Test-Path $p -PathType Leaf) { $found = $p; break }
}

if (-not $found) {
  Write-Warning "No se encontró ningún firebase-config.js en rutas probables. Crea o coloca tu archivo en frontend/src/js/firebase-config.js o frontend/firebase-config.js."
} else {
  $target = Join-Path $publicJs 'firebase-config.js'
  if ($found -eq $target) {
    Write-Host "firebase-config.js ya está en la ubicación correcta: $target"
  } else {
    Write-Host "Moviendo $found  ->  $target"
    Move-Item -Force -Path $found -Destination $target
    Write-Host "Movido."
  }
}

# 3) Hacer backup de src/pages antes de modificar
$pagesDir = Join-Path $frontend 'src\pages'
if (Test-Path $pagesDir) {
  $stamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
  $backupDir = Join-Path $frontend ("pages_backup_$stamp")
  Copy-Item -Recurse -Force -Path $pagesDir -Destination $backupDir
  Write-Host "Backup creado en: $backupDir"
} else {
  Write-Warning "No existe $pagesDir — nada que actualizar en páginas."
}

# 4) Reemplazar en todos los .html la referencia a firebase-config.js por /js/firebase-config.js
if (Test-Path $pagesDir) {
  $htmlFiles = Get-ChildItem -Path $pagesDir -Filter *.html -Recurse
  foreach ($f in $htmlFiles) {
    $content = Get-Content -Raw -Encoding UTF8 $f.FullName
    if ($content -match '/js/firebase-config\.js') {
      Write-Host "OK (ya correcto): $($f.FullName)"
      continue
    }
    if ($content -match 'firebase-config\.js') {
      $new = $content -replace 'firebase-config\.js','/js/firebase-config.js'
      Set-Content -Path $f.FullName -Value $new -Encoding UTF8
      Write-Host "Reemplazado en: $($f.FullName)"
    } else {
      Write-Host "No contiene firebase-config.js: $($f.FullName)"
    }
  }
}

# 5) Ejecutar build en frontend
Push-Location $frontend
Write-Host "Ejecutando: npm run build  (en $frontend)" -ForegroundColor Cyan
$exit = & npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Error "npm run build devolvió código $LASTEXITCODE. Revisa la salida anterior."
  Pop-Location
  exit $LASTEXITCODE
}
Pop-Location

Write-Host "Script finalizado. Verifica frontend/dist/ para los archivos generados." -ForegroundColor Green
