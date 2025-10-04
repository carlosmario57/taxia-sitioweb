# ============================================================
# Script: insertar-footer.ps1
# Proyecto: TAXIA-CIMCO
# Descripción: Inserta el script de versión en todas las páginas HTML
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " INSERTANDO PIE DE VERSION EN TODAS LAS PAGINAS HTML "
Write-Host "============================================================"

$base = "C:\Users\Carlos Fuentes\ProyectosCIMCO\frontend\public"
$footerScript = '<script src="/js/version-footer.js"></script>'

try {
    Get-ChildItem -Path $base -Recurse -Include *.html | ForEach-Object {
        Write-Host "Revisando: $($_.FullName)"
        $content = Get-Content $_.FullName -Raw

        if ($content -notmatch [regex]::Escape($footerScript)) {
            $content = $content -replace '</body>', "$footerScript`r`n</body>"
            Set-Content -Path $_.FullName -Value $content -Encoding UTF8
            Write-Host "Script insertado en: $($_.Name)"
        } else {
            Write-Host "Ya existía en: $($_.Name)"
        }
    }

    Write-Host ""
    Write-Host "Inserción completada correctamente."
    Write-Host "Puedes probar con: firebase emulators:start"
    Write-Host "============================================================"

} catch {
    Write-Host "Error al insertar el script: $_" -ForegroundColor Red
}
