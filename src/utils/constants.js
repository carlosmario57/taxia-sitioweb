// =================================================================================================
// ARCHIVO: src/constants.js
// FUNCIÓN: Centraliza los valores constantes para toda la aplicación.
// Esto ayuda a evitar "cadenas mágicas" (magic strings) y a mantener la consistencia.
// =================================================================================================

/**
 * Constantes para los nombres de las colecciones de Firestore.
 * Utilizar estas constantes en lugar de cadenas de texto directas evita errores tipográficos
 * y facilita los cambios si los nombres de las colecciones necesitan ser modificados.
 */
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  CHAT_MESSAGES: 'chatMessages',
  // Puedes agregar más colecciones aquí según las necesidades de tu aplicación
};

/**
 * Constantes para roles de usuario, si se implementan.
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
};

/**
 * Rutas de la aplicación.
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PRODUCT_DETAILS: '/products/:id',
};

/**
 * Otros valores que pueden necesitar ser constantes.
 */
export const APP_NAME = 'Mi Aplicación';
export const API_BASE_URL = 'https://api.myapp.com';
