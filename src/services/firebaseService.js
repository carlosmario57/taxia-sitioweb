// =================================================================================================
// ARCHIVO: src/services/firebaseService.js
// FUNCIÓN: Servicio central para la inicialización de Firebase.
//          Inicializa y exporta las instancias de las librerías principales (App, Auth, Firestore).
//          Este enfoque garantiza que Firebase se inicialice una sola vez en toda la aplicación.
// =================================================================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// =================================================================================================
// NOTA IMPORTANTE:
// Las variables globales como __app_id, __firebase_config y __initial_auth_token
// se proporcionan automáticamente en el entorno de Canvas. NO necesitas definirlas aquí.
// Las usamos para inicializar de forma segura la conexión a Firebase.
// =================================================================================================

// 1. Verificamos la existencia de la configuración de Firebase proporcionada por el entorno.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;

// 2. Inicializamos la aplicación de Firebase si la configuración es válida.
//    Esto se hace una sola vez para evitar múltiples inicializaciones.
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;

// 3. Obtenemos las instancias de los servicios de Firebase para que puedan ser utilizadas
//    en cualquier parte de la aplicación sin necesidad de inicializarlas de nuevo.
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

/**
 * Función que proporciona una interfaz para obtener las instancias de Firebase.
 *
 * @returns {{
 * app: object|null,
 * auth: object|null,
 * db: object|null
 * }} - Un objeto con las instancias inicializadas de Firebase.
 */
export const getFirebaseServices = () => {
  if (!app) {
    console.error("Firebase no está inicializado. Verifique la configuración.");
  }
  return { app, auth, db };
};

// =================================================================================================
// EJEMPLO DE USO EN OTRO ARCHIVO, como useAuth o useFirestore
// =================================================================================================

/*
import { getFirebaseServices } from './firebaseService';

const { db, auth } = getFirebaseServices();

// Ahora puedes usar 'db' y 'auth' en tu lógica.
// Por ejemplo, para obtener una referencia a una colección:
// const myCollection = collection(db, 'mi-coleccion');
*/

// =================================================================================================
// NOTA FINAL:
// Este servicio centralizado asegura que la inicialización y configuración de Firebase
// se maneje de forma consistente y en un único lugar en toda la aplicación.
// =================================================================================================
