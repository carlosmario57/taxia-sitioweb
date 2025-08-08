// =================================================================================================
// ARCHIVO: src/hooks/usefetchdata.js
// FUNCIÓN: Hook personalizado para obtener datos de una colección de Firestore en tiempo real.
//          Maneja los estados de carga, error y los datos obtenidos.
// PROPIEDADES:
// - db: La instancia de Firestore.
// - collectionPath: La ruta de la colección de la cual se obtendrán los datos.
// =================================================================================================

import { useState, useEffect } from 'react';
import { onSnapshot, collection, query } from 'firebase/firestore';

/**
 * Hook personalizado para obtener datos de una colección de Firestore.
 *
 * @param {object} db - La instancia de la base de datos de Firestore.
 * @param {string} collectionPath - La ruta de la colección a la que se desea escuchar.
 * @returns {{ data: array, loading: boolean, error: object|null }} - Un objeto con los datos, el estado de carga y el estado de error.
 */
const useFetchData = (db, collectionPath) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // El hook useEffect se encarga de configurar el listener de Firestore.
  useEffect(() => {
    // Verificamos si la instancia de la base de datos es válida.
    if (!db || !collectionPath) {
      console.error("Firestore DB o la ruta de la colección no están definidos.");
      setError(new Error("Faltan parámetros para la conexión a Firestore."));
      setLoading(false);
      return;
    }

    setLoading(true);
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef);

    // onSnapshot es la función de Firestore que escucha los cambios en tiempo real.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const fetchedData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(fetchedData);
        setLoading(false);
        setError(null); // Limpiamos cualquier error anterior si la carga es exitosa.
      } catch (e) {
        console.error("Error al procesar los datos de la colección:", e);
        setError(e);
        setLoading(false);
      }
    }, (e) => {
      // Manejo de errores directamente desde onSnapshot.
      console.error("Error en la suscripción a la colección de Firestore:", e);
      setError(e);
      setLoading(false);
    });

    // Esta función de limpieza se ejecuta cuando el componente se desmonta.
    // Es crucial para evitar pérdidas de memoria.
    return () => unsubscribe();
  }, [db, collectionPath]);

  return { data, loading, error };
};

export default useFetchData;
