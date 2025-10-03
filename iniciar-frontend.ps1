Write-Host "🚀 Iniciando entorno de desarrollo TAXIA CIMCO..." -ForegroundColor Cyan

# 1) Entrar en frontend
Set-Location "C:\Users\Carlos Fuentes\ProyectosCIMCO\frontend"

# 2) Verificar que package.json existe
if (-not (Test-Path ".\package.json")) {
    Write-Host "❌ ERROR: No se encontró package.json en 'frontend'. Revisa tu proyecto." -ForegroundColor Red
    exit
}

# 3) Instalar dependencias si node_modules no existe
if (-not (Test-Path ".\node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# 4) Abrir watcher de Tailwind en una nueva terminal usando npx (para que siempre funcione)
Start-Process powershell -ArgumentList "cd 'C:\Users\Carlos Fuentes\ProyectosCIMCO\frontend'; npx tailwindcss -i ./src/styles/tailwind.css -o ./src/index.css --watch" -WindowStyle Normal

# 5) Iniciar servidor React en esta misma terminal
Write-Host "🌐 Iniciando servidor React..." -ForegroundColor Green
npm start
