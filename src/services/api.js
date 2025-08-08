import axios from 'axios';

// Define la URL base de tu backend
const API_URL = 'http://localhost:5000/api'; // Asegúrate de que este sea el puerto correcto

// Crea una instancia de Axios (opcional pero recomendado)
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Funciones para interactuar con los endpoints del backend
export const getTrips = () => api.get('/trips');
export const getDrivers = () => api.get('/drivers');
export const createTravel = (travelData) => api.post('/travels', travelData);
// y así con todos los endpoints que tengas