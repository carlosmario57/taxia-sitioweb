param()

# ==============================
# Configuración de tu cuenta
# ==============================
$ACCESS_TOKEN    = "EAALDHhT6fwUBPfxGSejHHrGnpTRJgqQwS4Fl3pSRpqMZCWSISXg8sDzMCbI96BQOyr8Jk6OuKMnnKdxlZCjZB1yCjaD4hHc6jvKZC4QfBYVCRZC8aiVK2kchIM3ZAZB6ZAl7UZA0E7dD9mXSgW0RZBr0ZA0TqIIaZC39YAXDeZC1coZCandvQ3xFZBGtF8OkNMUmn7YitiRLwZDZD"
$PHONE_NUMBER_ID = "787349791127922"

# ==============================
# Asociar el número de teléfono
# ==============================
$subscribePhoneUrl = "https://graph.facebook.com/v19.0/$PHONE_NUMBER_ID/subscribed_apps"

Write-Host "Asociando número de teléfono con la app..." -ForegroundColor Cyan

try {
    $responsePhone = Invoke-RestMethod -Uri $subscribePhoneUrl -Method Post `
        -Headers @{
            Authorization = "Bearer $ACCESS_TOKEN"
            "Content-Type" = "application/json"
        }

    Write-Host "Número de teléfono asociado a la app:" -ForegroundColor Green
    $responsePhone | ConvertTo-Json -Depth 5 | Write-Host
}
catch {
    Write-Host "Error al asociar número de teléfono:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "Configuración terminada. Ahora revisa el Dashboard de Meta > Webhooks para verificar que la URL quedó configurada." -ForegroundColor Cyan
