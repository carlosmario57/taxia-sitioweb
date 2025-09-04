// =================================================================================================
// ARCHIVO: src/main.jsx
// FUNCIÓN: Punto de entrada principal de la aplicación React.
//          Ahora renderiza el componente 'AppLayout' que maneja el estado de la aplicación.
// =================================================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import AppLayout from './components/AppLayout'; // Importamos el nuevo componente

// El resto de la lógica de inicialización se ha movido a AppLayout.jsx,
// haciendo que este archivo sea más simple.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppLayout />
  </React.StrictMode>
);

