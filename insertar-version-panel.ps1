# ============================================================
# Script: insertar-version-panel.ps1
# Descripción: Inserta el panel de versión con modal informativo
# Autor: Carlos Mario Fuentes García
# ============================================================

$base = "C:\Users\Carlos Fuentes\ProyectosCIMCO\frontend\public\admin"
$archivos = Get-ChildItem -Path $base -Filter "ceo-*.html" -Recurse

Write-Host "============================================================"
Write-Host " INSERTANDO PANEL DE VERSION EN LAS VISTAS ADMINISTRATIVAS"
Write-Host "============================================================"

foreach ($archivo in $archivos) {
    $contenido = Get-Content $archivo.FullName -Raw

    if ($contenido -notmatch 'id="version-panel"') {

        # Bloque HTML que se insertará antes del cierre </body>
        $panelHtml = @'
<!-- Panel de versión -->
<div id="version-panel" style="position:fixed; bottom:10px; right:10px; background:#222; color:#fff; font-size:12px; padding:8px 14px; border-radius:8px; opacity:0.85; cursor:pointer; z-index:9999;" onclick="mostrarInfoVersion()">
  <strong>TAXIA-CIMCO</strong> - <span id="version-info">Versión actual</span>
</div>

<!-- Modal informativo -->
<div id="version-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:10000; align-items:center; justify-content:center;">
  <div style="background:white; padding:20px; border-radius:10px; max-width:400px; text-align:center;">
    <h3>Información de despliegue</h3>
    <p id="modal-version"></p>
    <p id="modal-fecha"></p>
    <p id="modal-entorno"></p>
    <p id="modal-notas"></p>
    <button onclick="cerrarInfoVersion()">Cerrar</button>
  </div>
</div>

<script>
async function mostrarInfoVersion() {
  const modal = document.getElementById("version-modal");
  const versionData = await fetch("/version.json").then(r => r.json());
  document.getElementById("modal-version").innerText = "Versión: " + versionData.version;
  document.getElementById("modal-fecha").innerText = "Fecha: " + versionData.fecha;
  document.getElementById("modal-entorno").innerText = "Entorno: Producción";
  document.getElementById("modal-notas").innerText = "Último despliegue automático.";
  modal.style.display = "flex";
}
function cerrarInfoVersion() {
  document.getElementById("version-modal").style.display = "none";
}
</script>
'@

        # Inserta antes del cierre </body>
        $nuevoContenido = $contenido -replace "(?i)</body>", "$panelHtml`r`n</body>"

        # Guarda los cambios
        Set-Content -Path $archivo.FullName -Value $nuevoContenido -Encoding UTF8
        Write-Host "Panel insertado en: $($archivo.Name)"
    }
    else {
        Write-Host "Ya existía en: $($archivo.Name)"
    }
}

Write-Host "============================================================"
Write-Host " INSERCION DE PANEL COMPLETADA CORRECTAMENTE"
Write-Host "============================================================"