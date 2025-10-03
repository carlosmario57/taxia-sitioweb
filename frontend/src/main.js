// frontend/src/main.js
document.addEventListener("DOMContentLoaded", () => {
  // Menú hamburguesa
  const menuBtn = document.querySelector("#menu-btn");
  const navMenu = document.querySelector("#nav-menu");

  if (menuBtn && navMenu) {
    menuBtn.addEventListener("click", () => {
      navMenu.classList.toggle("hidden");
    });
  }

  // Botón flotante WhatsApp
  const whatsappBtn = document.querySelector("#whatsapp-btn");
  const whatsappMenu = document.querySelector("#whatsapp-menu");

  if (whatsappBtn && whatsappMenu) {
    whatsappBtn.addEventListener("click", () => {
      whatsappMenu.classList.toggle("hidden");
    });
  }
});
