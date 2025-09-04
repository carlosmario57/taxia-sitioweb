// =================================================================================================
// ARCHIVO: src/components/Header.jsx
// FUNCIÓN: Componente de la cabecera principal de la aplicación.
//          Contiene el logo, el título y un área para la información del usuario o navegación.
// =================================================================================================

import React from 'react';

const Header = () => {
  return (
    // Contenedor principal de la cabecera con estilos de Tailwind
    <header className="bg-white shadow-md p-4 flex items-center justify-between rounded-xl mb-6">
      {/* Sección del logo y título de la aplicación */}
      <div className="flex items-center space-x-3">
        {/* Placeholder para el logo. Puedes reemplazarlo con una imagen. */}
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
          C
        </div>
        <h1 className="text-2xl font-bold text-blue-800">
          CIMCO Dashboard
        </h1>
      </div>

      {/* Sección de información del usuario o elementos de navegación */}
      <div className="flex items-center space-x-4">
        <p className="text-gray-600 font-medium hidden md:block">
          Bienvenido, Usuario
        </p>
        {/* Placeholder para el avatar o ícono de usuario */}
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
      </div>
    </header>
  );
};

export default Header;
