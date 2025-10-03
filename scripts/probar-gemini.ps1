param(
    [string]$Mensaje = "Hola, soy Carlos y quiero probar Gemini"
)

# ==============================
# Configuración de WhatsApp API
# ==============================
$ACCESS_TOKEN    = "EAALDHhT6fwUBPfxGSejHHrGnpTRJgqQwS4Fl3pSRpqMZCWSISXg8sDzMCbI96BQOyr8Jk6OuKMnnKdxlZCjZB1yCjaD4hHc6jvKZC4QfBYVCRZC8aiVK2kchIM3ZAZB6ZAl7UZA0E7dD9mXSgW0RZBr0ZA0TqIIaZC39YAXDeZC1coZCandvQ3xFZBGtF8OkNMUmn7YitiRLwZDZD"
$PHONE_NUMBER_ID = "787349791127922"   # ID que corresponde al 3003503249
$DESTINO         = "573104180514"      # Tu número personal en formato internacional

# ==============================
# 1) Preparar y enviar mensaje
# ==============================
Write-Host "Enviando mensaje de prueba a $DESTINO ..." -ForegroundColor Cyan

$body = @{
    messaging_product = "whatsapp"
    to                = $DESTINO
    type              = "text"
    text              = @{ body = $Mensaje }
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod `
        -Uri "https://graph.facebook.com/v19.0/$PHONE_NUMBER_ID/messages" `
        -Method Post `
        -Headers @{ Authorization = "Bearer $ACCESS_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body

    Write-Host "Mensaje enviado correctamente:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5 | Write-Host

    Write-Host "`nAhora revisa tu WhatsApp personal ($DESTINO). El bot TAXIA CIMCO debería contestarte automáticamente con una respuesta de Gemini." -ForegroundColor Yellow
}
catch {
    Write-Host "Error al enviar el mensaje:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
