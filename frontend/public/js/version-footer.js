// ============================================================
// 🚖 Panel de versión con modal de historial (estilo neón)
// ============================================================

async function mostrarVersionFooter() {
  try {
    const res = await fetch("/version.json", { cache: "no-store" });
    const data = await res.json();

    // Panel flotante
    const footer = document.createElement("div");
    footer.className = "version-panel";
    footer.innerHTML = `
      🚖 <strong>TAXIA CIMCO</strong>
      <span class="version">Versión: ${data.version}</span>
      <span class="fecha">• ${data.deployed}</span>
    `;
    footer.onclick = mostrarModalVersion;

    // Modal oculto inicialmente
    const modal = document.createElement("div");
    modal.id = "modal-version";
    modal.className = "modal-version hidden";
    modal.innerHTML = `
      <div class="modal-bg"></div>
      <div class="modal-content">
        <h3>Historial de Despliegues</h3>
        <p><b>Versión actual:</b> ${data.version}</p>
        <p><b>Fecha:</b> ${data.deployed}</p>
        <p><b>Responsable:</b> Carlos Mario Fuentes García</p>
        <p><b>Entorno:</b> Producción Firebase Hosting</p>
        <p><b>Notas:</b> Optimización visual + despliegue automático integrado.</p>
        <button id="cerrar-modal">Cerrar</button>
      </div>
    `;

    // Estilos embebidos
    const style = document.createElement("style");
    style.textContent = `
      .version-panel {
        position: fixed;
        bottom: 12px;
        right: 12px;
        padding: 8px 16px;
        font-size: 0.85rem;
        border-radius: 10px;
        color: #00f0ff;
        background: rgba(0,0,0,0.55);
        box-shadow: 0 0 10px #00f0ff, inset 0 0 6px #b300f2;
        border: 1px solid rgba(0,240,255,0.6);
        font-family: 'Inter', sans-serif;
        z-index: 9999;
        cursor: pointer;
        backdrop-filter: blur(4px);
        animation: glowCycle 3s infinite alternate;
      }
      @keyframes glowCycle {
        0% { box-shadow: 0 0 8px #b300f2, inset 0 0 5px #00f0ff; }
        100% { box-shadow: 0 0 15px #00f0ff, inset 0 0 8px #b300f2; }
      }
      .version-panel strong { color: #b300f2; }
      .version-panel .version { margin-left: 5px; }
      .version-panel .fecha { margin-left: 8px; color: #ccc; }

      /* Modal */
      .modal-version {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      .modal-version.hidden { display: none; }
      .modal-bg {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(6px);
      }
      .modal-content {
        position: relative;
        background: #0f172a;
        color: #fff;
        padding: 20px 30px;
        border-radius: 12px;
        border: 1px solid #00f0ff;
        box-shadow: 0 0 25px #00f0ff;
        max-width: 400px;
        z-index: 10001;
        animation: popIn 0.4s ease;
      }
      @keyframes popIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .modal-content h3 {
        font-size: 1.3rem;
        color: #00f0ff;
        margin-bottom: 10px;
      }
      .modal-content p { margin-bottom: 8px; }
      .modal-content button {
        margin-top: 10px;
        background: linear-gradient(90deg, #b300f2, #00f0ff);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        transition: transform 0.2s;
      }
      .modal-content button:hover {
        transform: scale(1.05);
      }
    `;

    // Insertar elementos
    document.head.appendChild(style);
    document.body.appendChild(footer);
    document.body.appendChild(modal);

    // Función para abrir/cerrar modal
    function mostrarModalVersion() {
      modal.classList.remove("hidden");
    }
    document.getElementById("cerrar-modal").onclick = () => {
      modal.classList.add("hidden");
    };
    modal.querySelector(".modal-bg").onclick = () => {
      modal.classList.add("hidden");
    };
  } catch (error) {
    console.error("⚠️ No se pudo cargar la versión:", error);
  }
}

window.addEventListener("DOMContentLoaded", mostrarVersionFooter);
