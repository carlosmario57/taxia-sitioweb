// =================================================================================================
// ARCHIVO: src/components/Card.jsx
// FUNCIÓN: Componente de tarjeta genérico para la interfaz de usuario.
//          Sirve como un contenedor estilizado para diversos tipos de contenido.
// PROPIEDADES:
// - children: El contenido que se mostrará dentro de la tarjeta.
// - className: Clases de Tailwind CSS adicionales para personalizar el estilo.
// - title: Un título opcional para la tarjeta.
// =================================================================================================

import React from 'react';

// El componente `Card` acepta `children` y un `title` como props.
const Card = ({ children, title, className = '' }) => {
  return (
    // Contenedor principal de la tarjeta con estilos de Tailwind CSS.
    // Los estilos básicos incluyen fondo blanco, esquinas redondeadas, sombra y padding.
    // La prop `className` permite añadir o sobrescribir estilos desde el componente padre.
    <div className={`p-6 bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-2xl ${className}`}>
      {/* Título opcional de la tarjeta */}
      {title && (
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          {title}
        </h2>
      )}
      {/* El contenido de la tarjeta se renderiza aquí */}
      {children}
    </div>
  );
};

export default Card;
