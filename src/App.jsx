import React, { useState, useEffect } from 'react';
import './styles.css'; // Asumiendo que hay un archivo de estilos

// -----------------------------------------------------------------------------
// ANTES: CÓDIGO CON TODO EN UN SOLO ARCHIVO (App.jsx)
// -----------------------------------------------------------------------------
// En este ejemplo, el componente App maneja toda la lógica de estado,
// la llamada a la API y el renderizado de la UI.

// Esta es una función dummy para simular una llamada a la API
const fetchDummyData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]);
    }, 1000);
  });
};

const AppOld = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchDummyData();
        setItems(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, []);

  if (isLoading) {
    return <div className="loading">Cargando...</div>;
  }

  if (error) {
    return <div className="error">Ocurrió un error: {error.message}</div>;
  }

  return (
    <div className="container">
      <h1>Lista de Items</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};

// -----------------------------------------------------------------------------
// DESPUÉS: CÓDIGO REFACTORIZADO EN CARPETAS
// -----------------------------------------------------------------------------
// Aquí, la lógica se ha dividido en diferentes archivos para un proyecto más organizado.
// Los componentes ahora son más pequeños y se enfocan en una sola tarea.

// === ESTRUCTURA DE CARPETAS ===
//
// src/
// ├── components/
// │   └── ItemList.jsx
// ├── hooks/
// │   └── useFetchData.js
// ├── services/
// │   └── apiService.js
// └── App.jsx
//

// === src/services/apiService.js ===
// Contiene la lógica para las llamadas a la API.
const apiService = {
  fetchItems: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, name: 'Refactorizado Item 1' },
          { id: 2, name: 'Refactorizado Item 2' },
          { id: 3, name: 'Refactorizado Item 3' },
        ]);
      }, 1000);
    });
  },
};
// export default apiService;

// === src/hooks/useFetchData.js ===
// Un custom hook para manejar la lógica de estado de una llamada a la API.
// Este hook puede ser reutilizado por cualquier componente.
const useFetchData = (fetchFunction) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchFunction();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [fetchFunction]);

  return { data, isLoading, error };
};
// export default useFetchData;

// === src/components/ItemList.jsx ===
// Un componente simple que solo se encarga de renderizar una lista.
const ItemList = ({ items }) => {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};
// export default ItemList;

// === src/App.jsx (Version Refactorizada) ===
// El componente principal ahora es mucho más limpio y se enfoca solo
// en ensamblar los otros componentes.
const AppRefactored = () => {
  // Aquí usamos el custom hook 'useFetchData' para obtener los datos
  const { data: items, isLoading, error } = useFetchData(apiService.fetchItems);

  if (isLoading) {
    return <div className="loading">Cargando datos refactorizados...</div>;
  }

  if (error) {
    return <div className="error">Ocurrió un error en el fetch: {error.message}</div>;
  }

  return (
    <div className="container">
      <h1>Aplicación Refactorizada</h1>
      <ItemList items={items} />
    </div>
  );
};

export default AppRefactored;
