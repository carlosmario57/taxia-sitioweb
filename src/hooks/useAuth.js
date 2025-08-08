// =================================================================================================
// ARCHIVO: src/hooks/useAuth.js
// FUNCIÓN: Hook personalizado para gestionar el estado de autenticación de Firebase en tiempo real.
//          Maneja el inicio de sesión con token personalizado o de forma anónima, y el
//          estado de carga y los errores.
// PROPIEDADES:
// - firebaseApp: La instancia de la aplicación de Firebase.
// - __initial_auth_token: Token de autenticación personalizado del entorno, opcional.
// =================================================================================================

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';

/**
 * Hook personalizado para gestionar el estado de autenticación de Firebase.
 *
 * @param {object} firebaseApp - La instancia de la aplicación Firebase.
 * @returns {{ user: object|null, token: string|null, loading: boolean, error: object|null }} - Un objeto con el usuario, el token de acceso, el estado de carga y el estado de error.
 */
const useAuth = (firebaseApp) => {
  const [state, setState] = useState({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // 1. Verificamos si la aplicación Firebase está disponible.
    if (!firebaseApp) {
      console.error("Firebase App no está definida.");
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: new Error("La instancia de Firebase no está disponible.")
      }));
      return;
    }

    const auth = getAuth(firebaseApp);

    // 2. Intentamos iniciar sesión con un token personalizado del entorno o de forma anónima.
    const initializeAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Error al iniciar sesión en Firebase:", e);
        setState(prevState => ({
          ...prevState,
          loading: false,
          error: e
        }));
      }
    };

    // 3. Configurar el observador del estado de autenticación de Firebase.
    // Este observador se activa cuando el usuario inicia o cierra sesión, o cuando el token expira.
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Si hay un usuario, obtenemos su token de acceso.
        const token = await currentUser.getIdToken();
        setState({
          user: currentUser,
          token: token,
          loading: false,
          error: null,
        });
      } else {
        // No hay un usuario autenticado.
        setState({
          user: null,
          token: null,
          loading: false,
          error: null,
        });
      }
    });

    // 4. Ejecutamos la función de inicialización de la autenticación.
    initializeAuth();

    // 5. Función de limpieza para detener el observador cuando el componente se desmonte.
    return () => unsubscribe();
  }, [firebaseApp]); // El efecto se volverá a ejecutar si la instancia de la app de Firebase cambia.

  return state;
};

export default useAuth;

// =================================================================================================
// EJEMPLO DE USO DEL HOOK EN UN COMPONENTE
// =================================================================================================

/*
import React from 'react';
import useAuth from '../hooks/useAuth';

const AuthStatus = ({ firebaseApp }) => {
  const { user, token, loading, error } = useAuth(firebaseApp);

  if (loading) {
    return <div className="p-4 text-center">Cargando estado de autenticación...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-800 rounded-lg">Error: {error.message}</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-2">Estado de Autenticación</h3>
      {user ? (
        <>
          <p className="text-green-600 font-semibold">Usuario autenticado ✅</p>
          <div className="mt-4">
            <h4 className="font-medium text-gray-700">Información del Usuario:</h4>
            <pre className="bg-gray-100 p-2 rounded text-sm font-mono mt-1 break-all">
              ID: {user.uid}
            </pre>
            <h4 className="font-medium text-gray-700 mt-2">Token de Acceso:</h4>
            <pre className="bg-gray-100 p-2 rounded text-sm font-mono mt-1 break-all">
              {token}
            </pre>
          </div>
        </>
      ) : (
        <p className="text-red-600 font-semibold">Usuario no autenticado ❌</p>
      )}
    </div>
  );
};
*/
