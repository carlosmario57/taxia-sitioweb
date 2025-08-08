// =================================================================================================
// ARCHIVO: src/components/AppLayout.jsx
// FUNCIÓN: Componente principal que maneja la inicialización de Firebase, la autenticación
//          y el estado de la aplicación. Es el contenedor de toda la UI.
// =================================================================================================

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const AppLayout = () => {
  // Estado para la inicialización de Firebase y autenticación
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Variables globales proporcionadas por el entorno del Canvas
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

  // Efecto para la inicialización de Firebase y la autenticación
  useEffect(() => {
    if (isAuthReady) return;

    try {
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestoreDb);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          console.log('Usuario autenticado:', user.uid);
          setUserId(user.uid);
        } else {
          try {
            console.log('No hay usuario autenticado. Intentando iniciar sesión...');
            if (initialAuthToken) {
              await signInWithCustomToken(firebaseAuth, initialAuthToken);
            } else {
              await signInAnonymously(firebaseAuth);
            }
          } catch (error) {
            console.error("Error al iniciar sesión:", error);
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error al inicializar Firebase:', error);
    }
  }, [firebaseConfig, initialAuthToken, isAuthReady]);

  // Si la autenticación no está lista, muestra un mensaje de carga.
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-8 font-inter text-gray-800">
        <p className="text-xl font-medium animate-pulse">Cargando aplicación...</p>
      </div>
    );
  }

  // TODO: Aquí es donde se renderizará el resto de tu aplicación (por ejemplo, el dashboard).
  // Puedes pasar 'db', 'auth' y 'userId' como props a tus otros componentes.
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-inter text-gray-800">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-blue-800 mb-6 text-center drop-shadow-md">
          Dashboard CIMCO
        </h1>
        {userId && (
          <div className="bg-blue-100 text-blue-800 p-3 rounded-xl mb-6 text-sm font-mono break-all w-full text-center shadow-inner">
            <span>ID de Usuario:</span>
            <pre>{userId}</pre>
          </div>
        )}
        <p className="text-center text-lg text-gray-600">
          La aplicación se ha inicializado y el usuario ha sido autenticado.
        </p>
        <p className="text-center text-lg text-gray-600 mt-2">
          Ahora puedes empezar a construir tus componentes aquí.
        </p>
      </div>
    </div>
  );
};

export default AppLayout;
