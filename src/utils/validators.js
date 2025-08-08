// =================================================================================================
// ARCHIVO: src/utils/validators.js
// FUNCIÓN: Centraliza la lógica de validación de datos comunes para la aplicación.
// =================================================================================================

/**
 * Valida si una cadena de texto es un email con un formato válido.
 * Utiliza una expresión regular simple para la validación.
 *
 * @param {string} email - La cadena de texto a validar.
 * @returns {boolean} - True si el email es válido, de lo contrario, false.
 */
export const isEmail = (email) => {
  if (typeof email !== 'string') return false;
  // Expresión regular para validar el formato de un email.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida si una cadena de texto no está vacía o solo contiene espacios en blanco.
 *
 * @param {string} text - La cadena de texto a validar.
 * @returns {boolean} - True si la cadena no está vacía, de lo contrario, false.
 */
export const isNotEmpty = (text) => {
  if (typeof text !== 'string') return false;
  return text.trim().length > 0;
};

/**
 * Valida si una cadena de texto contiene solo caracteres numéricos.
 *
 * @param {string} text - La cadena de texto a validar.
 * @returns {boolean} - True si la cadena es numérica, de lo contrario, false.
 */
export const isNumeric = (text) => {
  if (typeof text !== 'string') return false;
  // Expresión regular para validar que la cadena contenga solo dígitos.
  const numericRegex = /^\d+$/;
  return numericRegex.test(text);
};

/**
 * Valida si una cadena de texto tiene al menos una longitud mínima.
 *
 * @param {string} text - La cadena de texto a validar.
 * @param {number} minLength - La longitud mínima requerida.
 * @returns {boolean} - True si la longitud es mayor o igual a minLength, de lo contrario, false.
 */
export const isMinLength = (text, minLength) => {
  if (typeof text !== 'string') return false;
  return text.trim().length >= minLength;
};

/**
 * Valida si una cadena de texto tiene como máximo una longitud máxima.
 *
 * @param {string} text - La cadena de texto a validar.
 * @param {number} maxLength - La longitud máxima permitida.
 * @returns {boolean} - True si la longitud es menor o igual a maxLength, de lo contrario, false.
 */
export const isMaxLength = (text, maxLength) => {
  if (typeof text !== 'string') return false;
  return text.trim().length <= maxLength;
};
