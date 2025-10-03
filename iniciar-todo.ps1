Write-Host "🚀 Iniciando TODO el entorno TAXIA CIMCO (backend + frontend)..." -ForegroundColor Cyan

# 1) Entrar en la carpeta raíz del proyecto
Set-Location "C:\Users\Carlos Fuentes\ProyectosCIMCO"

# 2) Iniciar el emulador de Firebase (Backend) en una nueva terminal
Write-Host " Iniciando BACKEND (Firebase Emulators)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd 'C:\Users\Carlos Fuentes\ProyectosCIMCO\functions'; npm start" -WindowStyle Normal

# 3) Iniciar el watcher de Tailwind en otra terminal
Write-Host " Iniciando WATCHER CSS (Tailwind)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "cd 'C:\Users\Carlos Fuentes\ProyectosCIMCO\frontend'; npx tailwindcss -i ./src/styles/tailwind.css -o ./src/index.css --watch" -WindowStyle Normal

# 4) Iniciar el servidor Frontend (Vite) en esta misma terminal
Write-Host " Iniciando FRONTEND (Vite)..." -ForegroundColor Green
cd "C:\Users\Carlos Fuentes\ProyectosCIMCO\frontend"
npm start
