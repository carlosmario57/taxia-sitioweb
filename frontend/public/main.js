/**
 * main.js
 *
 * Este script maneja la interactividad principal de la página, incluyendo:
 * - Envío de formulario de afiliación con validación y retroalimentación.
 * - Manejo del menú de navegación tipo hamburguesa para dispositivos móviles.
 * - Animaciones y mejoras de experiencia de usuario.
 */

document.addEventListener("DOMContentLoaded", function () {
    // ======================================================================
    // MANEJO DEL FORMULARIO DE AFILIACIÓN
    // ======================================================================
    const form = document.getElementById("my-form");
    const submitBtn = form.querySelector("button[type='submit']");
    const mensajeValidacion = document.getElementById("mensajeValidacion");

    /**
     * Muestra un mensaje al usuario con un estilo específico.
     * @param {string} message - El texto del mensaje a mostrar.
     * @param {string} type - El tipo de mensaje ('success', 'error', 'warning').
     */
    function displayMessage(message, type) {
        mensajeValidacion.textContent = message;
        mensajeValidacion.style.display = "block"; // Asegura que el mensaje sea visible

        // Eliminar clases de estilo anteriores y añadir la nueva
        mensajeValidacion.classList.remove("success-message", "error-message", "warning-message");
        mensajeValidacion.classList.add(`${type}-message`);
    }

    /**
     * Oculta el mensaje de validación.
     */
    function clearMessage() {
        mensajeValidacion.textContent = "";
        mensajeValidacion.style.display = "none"; // Oculta el mensaje
        mensajeValidacion.classList.remove("success-message", "error-message", "warning-message");
    }

    // Escucha el evento 'submit' del formulario
    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Previene el envío por defecto del formulario

        // Limpia cualquier mensaje anterior
        clearMessage();

        // ------------------------------------------------------------------
        // VALIDACIÓN DE CAMPOS DEL FORMULARIO
        // ------------------------------------------------------------------
        const nombre = document.getElementById("nombre").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const servicio = document.getElementById("servicio").value;
        // const mensaje = document.getElementById("mensaje").value.trim(); // Si necesitas validar el mensaje

        // Validación básica de campos vacíos
        if (!nombre || !telefono || !correo || !servicio) {
            displayMessage("⚠️ Por favor completa todos los campos obligatorios.", "warning");
            return; // Detiene la ejecución si hay campos vacíos
        }

        // Validación de formato de correo electrónico con expresión regular
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            displayMessage("📧 Por favor ingresa un formato de correo electrónico válido (ej. tu@ejemplo.com).", "warning");
            return;
        }

        // Validación de formato de número de teléfono (solo dígitos, entre 7 y 15 caracteres)
        // Ajusta la regex según el formato de teléfono esperado en Colombia si es diferente.
        const phoneRegex = /^\d{7,15}$/; // Generalmente 10 dígitos en Colombia, pero se permite un rango por flexibilidad
        if (!phoneRegex.test(telefono)) {
            displayMessage("📱 Por favor ingresa un número de teléfono válido (solo dígitos, entre 7 y 15).", "warning");
            return;
        }

        // ------------------------------------------------------------------
        // PREPARACIÓN Y ENVÍO DEL FORMULARIO
        // ------------------------------------------------------------------
        // Deshabilita el botón y cambia su texto para indicar que se está enviando
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";

        const data = new FormData(form);

        try {
            // Envío de datos al endpoint de Formspree (o similar)
            const response = await fetch(form.action, {
                method: form.method,
                body: data,
                headers: {
                    'Accept': 'application/json' // Indica que esperamos una respuesta JSON
                }
            });

            if (response.ok) {
                // Si la respuesta es exitosa (código 2xx)
                displayMessage("✅ ¡Tu solicitud fue enviada con éxito! Nos pondremos en contacto pronto.", "success");
                form.reset(); // Limpia todos los campos del formulario
            } else {
                // Si la respuesta no es exitosa (código 4xx, 5xx)
                const resData = await response.json(); // Intenta parsear la respuesta como JSON
                // Muestra un mensaje de error detallado si está disponible, o uno genérico
                displayMessage(`❌ Error al enviar la solicitud: ${resData.message || "Algo salió mal. Por favor, inténtalo de nuevo."}`, "error");
            }
        } catch (error) {
            // Captura errores de red u otros problemas durante el fetch
            console.error("Error en la solicitud de fetch:", error);
            displayMessage("❌ Hubo un problema de conexión. Por favor, verifica tu internet e inténtalo de nuevo.", "error");
        } finally {
            // Este bloque se ejecuta siempre, independientemente de si hubo éxito o error
            submitBtn.disabled = false; // Habilita el botón de nuevo
            submitBtn.textContent = "Enviar Solicitud"; // Restaura el texto original del botón
        }
    });

    // ======================================================================
    // MANEJO DEL MENÚ HAMBURGUESA PARA MÓVILES
    // ======================================================================
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu'); // El ID que le añadimos al <nav>

    if (menuToggle && navMenu) {
        // Al hacer clic en el botón de hamburguesa, alterna la clase 'active' en el menú de navegación
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Opcional: Cierra el menú automáticamente si se hace clic en un enlace de navegación
        // Esto mejora la experiencia de usuario en dispositivos móviles
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active'); // Remueve la clase 'active' para cerrar el menú
            });
        });
    }
});