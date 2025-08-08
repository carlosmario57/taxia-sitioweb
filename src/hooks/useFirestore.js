// =================================================================================================
// ARCHIVO: src/hooks/useFirestore.js
// FUNCIÓN: Hook personalizado para interactuar con Firestore de manera reactiva.
//          Proporciona datos en tiempo real, así como funciones para añadir,
//          actualizar y eliminar documentos.
// PROPIEDADES:
// - db: La instancia de la base de datos de Firestore.
// - userId: El ID del usuario actual, necesario para el path de la colección.
// - collectionName: El nombre de la colección a la que se desea acceder.
// =================================================================================================

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Hook personalizado para la gestión de datos en Firestore.
 *
 * @param {object} db - La instancia de Firestore.
 * @param {string} appId - El ID de la aplicación para el path del artefacto.
 * @param {string} userId - El ID del usuario actual.
 * @param {string} collectionName - El nombre de la colección a la que se desea acceder.
 * @returns {{
 * data: Array,
 * loading: boolean,
 * error: object|null,
 * addData: Function,
 * updateData: Function,
 * deleteData: Function
 * }} - Un objeto con los datos, estado de carga, errores y funciones de manipulación de datos.
 */
const useFirestore = (db, appId, userId, collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Efecto para escuchar los cambios en la colección en tiempo real.
  useEffect(() => {
    // Verificamos que los parámetros esenciales estén definidos.
    if (!db || !appId || !userId || !collectionName) {
      if (!db || !userId) {
        console.log("useFirestore: db o userId no están definidos, esperando la inicialización.");
      } else {
        setError(new Error("Parámetros de colección incompletos."));
        setLoading(false);
      }
      return;
    }

    // Construimos el path completo de la colección de Firestore.
    // Usamos la estructura de datos privada para este ejemplo.
    const collectionPath = `artifacts/${appId}/users/${userId}/${collectionName}`;
    const q = query(collection(db, collectionPath));

    // Configuramos el observador de onSnapshot para obtener actualizaciones en tiempo real.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Ordena los datos por fecha de creación si el campo `createdAt` existe.
        const sortedItems = items.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
          }
          return 0;
        });
        setData(sortedItems);
        setLoading(false);
        setError(null);
        console.log(`Datos de la colección '${collectionName}' actualizados.`);
      } catch (e) {
        console.error(`Error al procesar los datos de Firestore para '${collectionName}':`, e);
        setError(e);
        setLoading(false);
      }
    }, (e) => {
      // Manejo de errores de la suscripción de onSnapshot.
      console.error("Error en la suscripción de Firestore:", e);
      setError(e);
      setLoading(false);
    });

    // 2. Función de limpieza que se ejecuta cuando el componente se desmonta.
    return () => {
      console.log(`Suscripción a la colección '${collectionName}' cancelada.`);
      unsubscribe();
    };

  }, [db, appId, userId, collectionName]); // Dependencias del efecto.

  // 3. Funciones para manipular la base de datos.
  const addData = async (newItem) => {
    if (!db || !appId || !userId || !collectionName) {
      console.error("No se puede añadir datos: Conexión o usuario no definidos.");
      return;
    }
    setLoading(true);
    try {
      const collectionPath = `artifacts/${appId}/users/${userId}/${collectionName}`;
      await addDoc(collection(db, collectionPath), {
        ...newItem,
        createdAt: serverTimestamp(),
      });
      setError(null);
    } catch (e) {
      console.error("Error al añadir documento:", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const updateData = async (id, updatedItem) => {
    if (!db || !appId || !userId || !collectionName) {
      console.error("No se puede actualizar datos: Conexión o usuario no definidos.");
      return;
    }
    setLoading(true);
    try {
      const collectionPath = `artifacts/${appId}/users/${userId}/${collectionName}`;
      const docRef = doc(db, collectionPath, id);
      await updateDoc(docRef, { ...updatedItem, updatedAt: serverTimestamp() });
      setError(null);
    } catch (e) {
      console.error("Error al actualizar documento:", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteData = async (id) => {
    if (!db || !appId || !userId || !collectionName) {
      console.error("No se puede eliminar datos: Conexión o usuario no definidos.");
      return;
    }
    setLoading(true);
    try {
      const collectionPath = `artifacts/${appId}/users/${userId}/${collectionName}`;
      const docRef = doc(db, collectionPath, id);
      await deleteDoc(docRef);
      setError(null);
    } catch (e) {
      console.error("Error al eliminar documento:", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, addData, updateData, deleteData };
};

export default useFirestore;

// =================================================================================================
// EJEMPLO DE USO CON EL HOOK useAuth
// =================================================================================================

/*
import React from 'react';
import { getFirestore } from 'firebase/firestore';
import useAuth from './useAuth';
import useFirestore from './useFirestore';
import { initializeApp } from 'firebase/app';

const appId = 'app-id-ejemplo';
const firebaseConfig = {
  // ... tu configuración de firebase
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const ComponenteEjemplo = () => {
  // Obtenemos el userId y el estado de carga del hook de autenticación.
  const { user, loading: authLoading } = useAuth(firebaseApp);

  // Usamos el hook de Firestore una vez que la autenticación esté lista.
  const { data: viajes, loading: firestoreLoading, error, addData, deleteData } = useFirestore(
    db,
    appId,
    user?.uid, // Pasamos el uid si el usuario existe.
    'viajes'
  );

  const handleAddViaje = () => {
    if (!user) {
      alert("Debes estar autenticado para añadir un viaje.");
      return;
    }
    const nuevoViaje = {
      destino: 'Nueva York',
      fecha: new Date().toISOString(),
      notas: 'Viaje de ejemplo.',
    };
    addData(nuevoViaje);
  };

  const handleDeleteViaje = (id) => {
    deleteData(id);
  };

  if (authLoading || firestoreLoading) {
    return <div className="p-4 text-center">Cargando datos...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-800 rounded-lg">Error: {error.message}</div>;
  }

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-2">Mis Viajes</h3>
      <button onClick={handleAddViaje} className="bg-blue-500 text-white px-4 py-2 rounded-lg mb-4">Añadir Viaje</button>
      {viajes.length > 0 ? (
        <ul>
          {viajes.map(viaje => (
            <li key={viaje.id} className="border p-2 mb-2 flex justify-between items-center rounded-md">
              <span>{viaje.destino} - {new Date(viaje.fecha).toLocaleDateString()}</span>
              <button onClick={() => handleDeleteViaje(viaje.id)} className="bg-red-500 text-white px-2 py-1 rounded-md text-sm">Eliminar</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay viajes guardados.</p>
      )}
    </div>
  );
};
*/
