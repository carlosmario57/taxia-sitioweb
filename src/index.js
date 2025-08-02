// =================================================================================================
// ARCHIVO: src/index.js
// FUNCIÓN: Punto de entrada principal de la aplicación React.
//          Renderiza el componente App en el DOM e inyecta la configuración de Firebase.
// =================================================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

// -- Importaciones de Estilos y Librerías Externas --
// Estos son los estilos y librerías que tu aplicación utiliza.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'sweetalert2/dist/sweetalert2.min.css';

// =================================================================================================
// CONFIGURACIÓN DE FIREBASE PARA EL CENTRO DE OPERACIONES CIMCO
// =================================================================================================
// **¡IMPORTANTE!** Se han corregido los valores de messagingSenderId y measurementId.
// Ahora la configuración coincide con la estructura recomendada por Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyAnIb66pu2dCgZyFSc2TERa5uVkQpLLVRM",
  authDomain: "taxia-cimco.firebaseapp.com",
  projectId: "taxia-cimco",
  storageBucket: "taxia-cimco.firebasestorage.app",
  messagingSenderId: "529767434961", // Valor numérico para el servicio de mensajería
  appId: "1:529767434961:web:06e74d1c4f0113d4ff53f0",
  measurementId: "G-GRGT80HX63" // Valor para Google Analytics
};

// =================================================================================================
// RENDERIZADO PRINCIPAL DE LA APLICACIÓN
// =================================================================================================
// Obtenemos el elemento 'root' del DOM (definido en public/index.html).
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderizamos el componente principal 'App' dentro de React.StrictMode.
// Pasamos la configuración de Firebase como una "prop" (propiedad)
// para que el componente App pueda acceder a ella.
root.render(
  <React.StrictMode>
    <App firebaseConfig={firebaseConfig} />
  </React.StrictMode>
);

// Medición de rendimiento (opcional, puedes dejarlo o eliminarlo)
reportWebVitals();
