# Cierra procesos antiguos (ngrok, node) para evitar conflictos.
Write-Host "🛑 Cerrando procesos antiguos (ngrok, node)..." -ForegroundColor Yellow
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Inicia el emulador de Firebase en una nueva ventana de PowerShell.
Write-Host "🚀 Iniciando Firebase Emulator..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "firebase emulators:start --only functions" -NoNewWindow

# Espera 8 segundos para que el emulador se inicie completamente.
Start-Sleep -Seconds 8

# Inicia ngrok en el puerto 5001.
Write-Host "🌍 Iniciando ngrok en puerto 5001..." -ForegroundColor Cyan
Start-Process ngrok -ArgumentList "http 5001" -NoNewWindow

# Espera 5 segundos para que ngrok publique la URL.
Start-Sleep -Seconds 5

Write-Host "🔎 Obteniendo URL pública de ngrok..." -ForegroundColor Cyan

# Intenta obtener la URL pública de la API de ngrok.
try {
    $response = Invoke-RestMethod http://127.0.0.1:4040/api/tunnels
    $publicUrl = $response.tunnels[0].public_url

    # Verifica si se obtuvo una URL pública.
    if ($publicUrl) {
        Write-Host "✅ URL pública lista: $publicUrl" -ForegroundColor Green
        Set-Clipboard -Value $publicUrl
        Write-Host "📋 Copiada al portapapeles automáticamente." -ForegroundColor Yellow

        # Ejecuta el script de configuración del webhook con la URL.
        $scriptPath = "C:\Users\Carlos Fuentes\ProyectosCIMCO\scripts\configurar-webhook.ps1"
        if (Test-Path $scriptPath) {
            Write-Host "⚙️ Ejecutando configurar-webhook.ps1 con la URL de ngrok..." -ForegroundColor Cyan
            & $scriptPath -NgrokUrl $publicUrl
        }
        else {
            Write-Host "⚠ No encontré configurar-webhook.ps1 en la carpeta scripts." -ForegroundColor Red
        }
    }
    else {
        Write-Host "⚠ No se pudo obtener la URL de ngrok." -ForegroundColor Red
    }
}
catch {
    # Muestra un mensaje de error si la conexión a la API de ngrok falló.
    Write-Host "❌ Error al consultar la API de ngrok." -ForegroundColor Red
    Write-Host "Asegúrate de que ngrok se ha iniciado correctamente." -ForegroundColor Red
}
