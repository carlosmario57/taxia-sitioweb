// =================================================================================================
// ARCHIVO: src/main.jsx
// FUNCIÓN: Este archivo es el punto de entrada de JavaScript de la aplicación.
//          Aquí se configura la base de datos y se renderiza el componente principal `App`.
// =================================================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// =================================================================================================
// Importaciones de Firebase
// Asegúrate de que las bibliotecas de Firebase estén instaladas en tu proyecto (npm install firebase)
// =================================================================================================
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// =================================================================================================
// Configuración de Firebase
// Esta es tu configuración específica de Firebase que has proporcionado.
// =================================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAnIb66pu2dCgZyFSc2TERa5uVkQpLLVRM",
  authDomain: "taxia-cimco.firebaseapp.com",
  projectId: "taxia-cimco",
  storageBucket: "taxia-cimco.firebasestorage.app",
  messagingSenderId: "529767434961",
  appId: "1:529767434961:web:06e74d1c4f0113d4ff53f0",
  measurementId: "G-GRGT80HX63"
};

// =================================================================================================
// Inicializar Firebase
// =================================================================================================
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Obtenemos el elemento 'root' del DOM y renderizamos la aplicación.
// Le pasamos la configuración de Firebase como una prop.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// =================================================================================================
// Nota: La configuración de Firebase ahora está inicializada aquí y exportada.
// Los componentes de tu aplicación (`App.jsx`) pueden importar `db` y `auth`
// para interactuar con la base de datos y la autenticación.
// =================================================================================================
