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
import {getFirestore, FieldValue} from "firebase-admin/firestore";

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
 * @param data Contiene los datos enviados por el cliente,
 * con `origin` y `destination`.
 * @returns Un objeto con un mensaje de éxito o un error.
 */
export const requestRide = onCall(async (request) => {
  // 1. Verificación de autenticación:
  //    Es el primer y más importante paso de seguridad.
  if (!request.auth) {
    logger.warn("Petición no autenticada.");
    throw new HttpsError("unauthenticated",
      "La función debe ser llamada por un usuario autenticado.");
  }

  // 2. Extracción y validación de datos:
  //    Se utiliza desestructuración para un código más limpio.
  //    Se valida que los datos existan para evitar errores de tipo.
  const {origin, destination} = request.data;
  if (!origin || !destination) {
    logger.error("Argumentos inválidos. Faltan `origin` o `destination`.");
    throw new HttpsError("invalid-argument",
      "Se requieren los campos \"origin\" y \"destination\".");
  }

  try {
    // 3. Referencia a la colección "rides" en Firestore.
    //    Usar `FieldValue.serverTimestamp()` es una mejor práctica para
    //    registrar la hora, ya que se sincroniza con el reloj del servidor de Firestore.
    const rideData = {
      userId: request.auth.uid,
      origin: origin,
      destination: destination,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    };

    // 4. Agregar un nuevo documento a Firestore:
    //    El método `add()` es ideal para crear nuevos documentos con un ID automático.
    const docRef = await db.collection("rides").add(rideData);

    // 5. Registro de la operación:
    //    Se registra información detallada para facilitar la depuración.
    logger.info(`Nueva solicitud de viaje creada con ID: ${docRef.id}`, {
      userId: request.auth.uid,
      rideId: docRef.id,
    });

    // 6. Devolución de la respuesta al cliente:
    //    Se envía una respuesta clara y concisa.
    return {
      status: "success",
      message: "Solicitud de viaje enviada con éxito.",
      rideId: docRef.id,
    };
  } catch (error) {
    // 7. Manejo de errores:
    //    Se capturan y registran errores internos para un mejor seguimiento.
    logger.error("Error al procesar la solicitud de viaje:", error);
    throw new HttpsError("internal",
      "Ocurrió un error inesperado al procesar la solicitud de viaje.");
  }
});
