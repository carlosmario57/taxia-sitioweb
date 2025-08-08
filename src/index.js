// =================================================================================================
// ARCHIVO: src/index.js
// FUNCIÓN: Punto de entrada principal de la aplicación React.
//          Renderiza el componente App en el DOM.
// =================================================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

// -- Importaciones de Estilos y Librerías Externas --
// Estos son los estilos y librerías que tu aplicación utiliza.
// Se recomienda mantener estas importaciones al principio del archivo.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'sweetalert2/dist/sweetalert2.min.css';

// -- Importaciones del SDK de Firebase --
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// =================================================================================================
// CONFIGURACIÓN DE FIREBASE PARA EL CENTRO DE OPERACIONES CIMCO
// =================================================================================================
// Tu configuración de Firebase para tu proyecto.
const firebaseConfig = {
  apiKey: "AIzaSyCseKkOoHY8pbSnUWSEWyPR8et1BVccr7s",
  authDomain: "pelagic-chalice-467818-e1.firebaseapp.com",
  projectId: "pelagic-chalice-467818-e1",
  storageBucket: "pelagic-chalice-467818-e1.firebasestorage.app",
  messagingSenderId: "191106268804",
  appId: "1:191106268804:web:bffbd9aac41f5bf1880cd1",
  measurementId: "G-TGN734FDGT"
};

// Inicializamos Firebase con la configuración.
const app = initializeApp(firebaseConfig);
// Inicializamos Google Analytics.
const analytics = getAnalytics(app);

// =================================================================================================
// RENDERIZADO PRINCIPAL DE LA APLICACIÓN
// =================================================================================================
// Obtenemos el elemento 'root' del DOM (definido en public/index.html).
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderizamos el componente principal 'App' dentro de React.StrictMode.
// Pasamos la configuración de Firebase y la instancia de app como propiedades
// para que el componente App pueda acceder a ellas.
root.render(
  <React.StrictMode>
    <App firebaseConfig={firebaseConfig} app={app} />
  </React.StrictMode>
);

// Medición de rendimiento (opcional, puedes dejarlo o eliminarlo si no lo necesitas).
reportWebVitals();
