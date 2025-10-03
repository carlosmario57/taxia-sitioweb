Write-Host "=============================="
Write-Host " Iniciando Backend TAXIA CIMCO "
Write-Host "=============================="

# 1) Ir a carpeta functions
Set-Location "C:\Users\Carlos Fuentes\ProyectosCIMCO\functions"

# 2) Verificar que package.json existe
if (-not (Test-Path ".\package.json")) {
    Write-Host "ERROR: No se encontró package.json en 'functions'"
    exit
}

# 3) Instalar dependencias si no existe node_modules
if (-not (Test-Path ".\node_modules")) {
    Write-Host "Instalando dependencias..."
    npm install
}

# 4) Levantar emuladores
Write-Host "Levantando emuladores de Firebase..."
firebase emulators:start --only "functions,firestore,auth,hosting"
