// =================================================================================================
// ARCHIVO: src/utils/formatDate.js
// FUNCIÓN: Proporciona funciones para formatear objetos de fecha en cadenas de texto legibles.
// =================================================================================================

/**
 * Formatea un objeto Date en una cadena de texto legible con hora y fecha.
 * Ejemplo: "08/08/2025, 3:44 PM"
 *
 * @param {Date} date - El objeto Date a formatear.
 * @param {string} locale - El código de idioma para el formato (por defecto 'es-ES').
 * @returns {string} La cadena de fecha y hora formateada.
 */
export const formatDate = (date, locale = 'es-ES') => {
  // Verificamos si la entrada es un objeto Date válido
  if (!(date instanceof Date) || isNaN(date)) {
    return 'Fecha inválida';
  }

  // Opciones de formato, incluyendo fecha y hora.
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true // Para usar formato AM/PM
  };

  return new Intl.DateTimeFormat(locale, options).format(date);
};

/**
 * Formatea un objeto Timestamp de Firestore.
 * Esto es útil porque los Timestamps de Firestore no son objetos Date nativos.
 *
 * @param {import("firebase/firestore").Timestamp} timestamp - El objeto Timestamp de Firestore.
 * @param {string} locale - El código de idioma para el formato (por defecto 'es-ES').
 * @returns {string} La cadena de fecha y hora formateada.
 */
export const formatTimestamp = (timestamp, locale = 'es-ES') => {
  // Verificamos si el objeto es un Timestamp válido.
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return 'Timestamp inválido';
  }

  // Convertimos el Timestamp a un objeto Date nativo de JavaScript.
  const date = timestamp.toDate();
  return formatDate(date, locale);
};
