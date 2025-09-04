// =================================================================================================
// ARCHIVO: src/components/Footer.jsx
// FUNCIÓN: Componente del pie de página de la aplicación.
//          Contiene información de copyright y enlaces adicionales.
// =================================================================================================

import React from 'react';

const Footer = () => {
  return (
    // Contenedor principal del pie de página con estilos de Tailwind.
    // Se asegura de que siempre esté en la parte inferior del contenedor.
    <footer className="w-full max-w-7xl mx-auto mt-8 p-4 bg-white rounded-xl shadow-md text-center text-gray-500 text-sm">
      <p>
        &copy; {new Date().getFullYear()} Centro de Operaciones CIMCO. Todos los derechos reservados.
      </p>
    </footer>
  );
};

export default Footer;
