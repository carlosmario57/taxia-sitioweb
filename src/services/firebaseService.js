// =================================================================================================
// ARCHIVO: src/services/firebaseService.js
// FUNCIÓN: Centraliza la inicialización de Firebase y la gestión de autenticación inicial.
// =================================================================================================

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';

// Inicializamos las variables de servicio con 'null'
// para asegurarnos de que la inicialización se realice una única vez.
let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let initializationPromise = null;

/**
 * Función que inicializa Firebase y sus servicios.
 * Se asegura de que la inicialización solo ocurra una vez.
 */
const initializeFirebase = async () => {
  // Si ya tenemos una promesa de inicialización, la devolvemos para evitar duplicados.
  if (initializationPromise) {
    return initializationPromise;
  }

  // Creamos una nueva promesa para la inicialización.
  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      // Obtenemos la configuración de Firebase desde la variable global.
      // Si la variable no existe, usamos una configuración por defecto para evitar errores.
      const firebaseConfig = typeof __firebase_config !== 'undefined'
        ? JSON.parse(__firebase_config)
        : {};

      // Inicializamos la aplicación de Firebase.
      firebaseApp = initializeApp(firebaseConfig);

      // Obtenemos las instancias de Firestore y Auth.
      firestoreDb = getFirestore(firebaseApp);
      firebaseAuth = getAuth(firebaseApp);

      // Obtenemos el token de autenticación personalizado desde la variable global.
      const initialAuthToken = typeof __initial_auth_token !== 'undefined'
        ? __initial_auth_token
        : null;

      // Autenticación: Usamos el token si está disponible, de lo contrario,
      // iniciamos sesión de forma anónima.
      if (initialAuthToken) {
        await signInWithCustomToken(firebaseAuth, initialAuthToken);
      } else {
        await signInAnonymously(firebaseAuth);
      }

      console.log('Firebase inicializado y usuario autenticado.');
      resolve();
    } catch (error) {
      console.error('Error al inicializar Firebase o al autenticar:', error);
      reject(error);
    }
  });

  return initializationPromise;
};

/**
 * Función pública para obtener las instancias de los servicios de Firebase.
 * Llama a initializeFirebase() para garantizar que los servicios estén listos.
 *
 * @returns {{ app: object, db: object, auth: object }} - Un objeto con las instancias de Firebase.
 */
export const getFirebaseServices = async () => {
  if (!firebaseApp || !firestoreDb || !firebaseAuth) {
    await initializeFirebase();
  }
  return {
    app: firebaseApp,
    db: firestoreDb,
    auth: firebaseAuth,
  };
};

