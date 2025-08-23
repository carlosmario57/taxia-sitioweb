/**
 * Este archivo contiene una Cloud Function que maneja las solicitudes de viaje.
 * Se encarga de recibir los datos del origen y destino, validar la información
 * y guardar la solicitud en la base de datos de Firestore.
 *
 * Utiliza el SDK de Firebase Admin para interactuar con Firestore.
 */

// Importa los módulos necesarios de Firebase Functions y Firebase Admin SDK.
import {setGlobalOptions} from "firebase-functions/v2";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

// Para el control de costos, se establece un límite global de 10 instancias.
// Esto ayuda a mitigar picos de tráfico inesperados.
setGlobalOptions({maxInstances: 10});

// Inicializa el SDK de Firebase Admin.
// Esto nos permite acceder a otros servicios de Firebase como Firestore.
initializeApp();

// Obtiene una referencia a la base de datos de Firestore.
const db = getFirestore();

/**
 * Función Cloud Function `onCall` para solicitar un viaje.
 *
 * Esta función es invocable desde tu aplicación cliente (frontend).
 * Es segura porque Firebase se encarga de la autenticación y la validación
 * del formato de los datos por ti.
 *
 * @param data Contiene los datos enviados por el cliente.
 * @param context Contiene el contexto de la llamada, como el UID del usuario.
 * @returns Un objeto con un mensaje de éxito o un error.
 */
export const requestRide = onCall(async (request) => {
  // Verifica si el usuario está autenticado. Si no, lanza un error.
  if (!request.auth) {
    throw new HttpsError("unauthenticated",
      "La función debe ser llamada por un usuario autenticado.");
  }

  // Desestructura los datos recibidos en la solicitud.
  const {origin, destination} = request.data;

  // Realiza una validación básica de los datos.
  // Es crucial validar los datos en el backend para evitar errores y
  // asegurar la integridad de la base de datos.
  if (!origin || !destination) {
    throw new HttpsError("invalid-argument",
      "Se requieren los campos \"origin\" y \"destination\".");
  }

  try {
    // Referencia a la colección "rides" en Firestore.
    const ridesCollection = db.collection("rides");

    // Crea un objeto con los datos del viaje.
    const rideData = {
      userId: request.auth.uid, // ID del usuario que solicita el viaje
      origin: origin,
      destination: destination,
      status: "pending", // Estado inicial del viaje (pendiente de asignación)
      createdAt: new Date(), // Fecha y hora de la solicitud
    };

    // Agrega un nuevo documento a la colección "rides" con los datos.
    // Firestore asigna automáticamente un ID único al documento.
    const docRef = await ridesCollection.add(rideData);

    // Registra la acción en los logs de Firebase para depuración.
    logger.info(`Nueva solicitud de viaje creada con ID: ${docRef.id}`,
      {structuredData: true});

    // Devuelve una respuesta de éxito al cliente.
    return {
      status: "success",
      message: "Solicitud de viaje enviada con éxito.",
      rideId: docRef.id,
    };
  } catch (error) {
    // Captura cualquier error que ocurra durante el proceso.
    logger.error("Error al procesar la solicitud de viaje:", error);

    // Lanza un error de HTTPS que el cliente puede entender.
    throw new HttpsError("internal",
      "Error al procesar la solicitud de viaje.");
  }
});
