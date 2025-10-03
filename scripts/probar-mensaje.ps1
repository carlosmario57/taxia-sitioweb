param (
    [string]$Mensaje = "Hola desde TAXIA CIMCO (mensaje de prueba)"
)

# ==============================
# Configuración
# ==============================
$ACCESS_TOKEN    = "EAALDHhT6fwUBPfxGSejHHrGnpTRJgqQwS4Fl3pSRpqMZCWSISXg8sDzMCbI96BQOyr8Jk6OuKMnnKdxlZCjZB1yCjaD4hHc6jvKZC4QfBYVCRZC8aiVK2kchIM3ZAZB6ZAl7UZA0E7dD9mXSgW0RZBr0ZA0TqIIaZC39YAXDeZC1coZCandvQ3xFZBGtF8OkNMUmn7YitiRLwZDZD"
$PHONE_NUMBER_ID = "787349791127922"
$TO_NUMBER       = "573104180514"  # <-- tu número en formato internacional

# ==============================
# Enviar mensaje
# ==============================
Write-Host "Enviando mensaje a WhatsApp: $Mensaje" -ForegroundColor Cyan

$body = @{
    messaging_product = "whatsapp"
    to = $TO_NUMBER
    type = "text"
    text = @{
        body = $Mensaje
    }
} | ConvertTo-Json -Depth 5 -Compress

try {
    $url = "https://graph.facebook.com/v19.0/$PHONE_NUMBER_ID/messages"

    $response = Invoke-RestMethod -Uri $url -Method Post `
        -Headers @{
            Authorization = "Bearer $ACCESS_TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $body

    Write-Host "Mensaje enviado correctamente:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5 | Write-Host
}
catch {
    Write-Host "Error al enviar mensaje:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
