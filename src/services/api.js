// =================================================================================================
// ARCHIVO: src/services/api.js
// FUNCIÓN: Hook personalizado para centralizar todas las operaciones de la API de la aplicación.
//          Utiliza los hooks de Firebase para gestionar la autenticación y el acceso a Firestore.
// =================================================================================================

import { useEffect, useState } from 'react';
import { getFirebaseServices } from './firebaseService';
import useAuth from '../hooks/useAuth';
import useFirestore from '../hooks/useFirestore';

/**
 * Hook personalizado para unificar el acceso a los servicios de la aplicación (Auth y Firestore).
 * Este hook encapsula toda la lógica de backend para los componentes de React,
 * haciéndolos más limpios y fáciles de entender.
 *
 * @param {string} collectionName - El nombre de la colección de Firestore con la que interactuar.
 * @returns {{
 * user: object|null,
 * userId: string|null,
 * authLoading: boolean,
 * firestoreData: Array,
 * firestoreLoading: boolean,
 * firestoreError: object|null,
 * addFirestoreData: Function,
 * updateFirestoreData: Function,
 * deleteFirestoreData: Function
 * }} - Un objeto con todas las herramientas y estados para interactuar con la API.
 */
export const useApiService = (collectionName) => {
  // Obtenemos las instancias de Firebase de manera centralizada.
  const { app, db, auth } = getFirebaseServices();

  // Obtenemos el estado de autenticación usando nuestro hook personalizado.
  const { user, userId, loading: authLoading } = useAuth(auth);

  // Verificamos si las variables de entorno están disponibles para Firestore.
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  // Obtenemos los datos de la colección usando nuestro hook de Firestore.
  const {
    data: firestoreData,
    loading: firestoreLoading,
    error: firestoreError,
    addData: addFirestoreData,
    updateData: updateFirestoreData,
    deleteData: deleteFirestoreData,
  } = useFirestore(db, appId, userId, collectionName);

  // Devolvemos un objeto con todas las herramientas de la API para su uso.
  return {
    user,
    userId,
    authLoading,
    firestoreData,
    firestoreLoading,
    firestoreError,
    addFirestoreData,
    updateFirestoreData,
    deleteFirestoreData,
  };
};

/*
// =================================================================================================
// EJEMPLO DE USO EN UN COMPONENTE DE REACT
// =================================================================================================
import React, { useState } from 'react';
import { useApiService } from '../services/api';

const TodoList = () => {
  // Usamos el hook useApiService para obtener los datos de la colección 'todos'.
  const {
    userId,
    firestoreData: todos,
    firestoreLoading,
    firestoreError,
    addFirestoreData,
    deleteFirestoreData,
  } = useApiService('todos');

  const [newTodoText, setNewTodoText] = useState('');

  // Maneja la adición de una nueva tarea.
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (newTodoText.trim() === '') return;
    const newTodo = {
      text: newTodoText,
      isCompleted: false,
    };
    addFirestoreData(newTodo);
    setNewTodoText('');
  };

  // Maneja la eliminación de una tarea.
  const handleDeleteTodo = (id) => {
    deleteFirestoreData(id);
  };

  if (firestoreLoading) {
    return <div className="p-4 text-center">Cargando tareas...</div>;
  }

  if (firestoreError) {
    return <div className="p-4 bg-red-100 text-red-800 rounded-lg">Error: {firestoreError.message}</div>;
  }

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-2">Lista de Tareas (userId: {userId})</h3>
      <form onSubmit={handleAddTodo} className="flex mb-4">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Añadir nueva tarea..."
          className="flex-1 border p-2 rounded-lg"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 ml-2 rounded-lg">Añadir</button>
      </form>
      {todos.length > 0 ? (
        <ul>
          {todos.map(todo => (
            <li key={todo.id} className="border p-2 mb-2 flex justify-between items-center rounded-md">
              <span>{todo.text}</span>
              <button onClick={() => handleDeleteTodo(todo.id)} className="bg-red-500 text-white px-2 py-1 rounded-md text-sm">Eliminar</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay tareas pendientes.</p>
      )}
    </div>
  );
};
*/
