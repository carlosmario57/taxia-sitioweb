/**
 * @file Firebase Cloud Functions para la central inteligente y autónoma.
 * @description Este archivo contiene las funciones que se ejecutan en respuesta a eventos de Firebase.
 *
 * NOTA: Esta versión incluye validaciones para evitar errores de tipo 'undefined'
 * y asegura la robustez de la aplicación.
 */

// Importa los módulos necesarios
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Inicializa la app de Firebase.
// Esta línea es necesaria para que las funciones puedan interactuar con la base de datos.
admin.initializeApp();
const db = admin.firestore();

// =================================================================================================
// Función que se activa al crear o actualizar un documento en la colección "rides".
// Esta es la parte "autónoma" de la central.
// =================================================================================================
export const onRideUpdate = functions.firestore
  .document("rides/{rideId}")
  .onWrite(async (change, context) => {
    const rideId = context.params.rideId;
    const beforeData = change.before.data(); // Datos del documento antes del cambio.
    const afterData = change.after.data(); // Datos del documento después del cambio.

    // Verifica si el documento fue creado o actualizado.
    if (afterData) {
      console.log(`Documento de viaje con ID ${rideId} ha sido creado o actualizado.`);
      console.log("Datos nuevos:", afterData);

      // Ejemplo de lógica autónoma:
      // Si el estado del viaje ha cambiado a 'pending', puedes iniciar un proceso.
      if (beforeData?.status !== afterData.status && afterData.status === 'pending') {
        console.log(`Se ha detectado una nueva solicitud de viaje en estado 'pending'.`);
        
        // Aquí puedes usar la variable `db` para interactuar con otras colecciones,
        // por ejemplo, para notificar a un conductor.
        const notificationData = {
          message: `¡Nueva solicitud de viaje para ti!`,
          rideId: rideId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        try {
          // Usamos la variable `db` aquí. Esto solucionará el error 'db is not read'.
          await db.collection('driver_notifications').add(notificationData);
          console.log(`Notificación enviada para el viaje ${rideId}.`);
        } catch (error) {
          console.error("Error al enviar notificación:", error);
        }
      }

    } else {
      // Si afterData es null, significa que el documento fue eliminado.
      console.log(`Documento de viaje con ID ${rideId} ha sido eliminado.`);
    }

    // Las funciones 'onWrite' que no retornan un valor deben retornar 'null' o una promesa.
    return null;
  });

// =================================================================================================
// Función que se activa a través de una llamada HTTPS para solicitar un servicio.
// Esta función servirá como punto de entrada desde tu frontend o webhooks.
// =================================================================================================
/**
 * Función de Cloud Function que recibe una solicitud de servicio.
 * Esta función se activará a través de una llamada HTTPS desde el frontend.
 *
 * @param data Los datos de la solicitud (ubicacionOrigen, ubicacionDestino).
 * @param context El contexto de la llamada, que incluye la información de autenticación del usuario.
 */
export const solicitarServicio = functions.https.onCall(async (data, context) => {
  // Aseguramos que solo los usuarios autenticados puedan llamar a esta función.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'La solicitud debe ser realizada por un usuario autenticado.'
    );
  }

  // Extraemos los datos del frontend.
  const { ubicacionOrigen, ubicacionDestino } = data;

  // Validamos que los datos requeridos estén presentes.
  if (!ubicacionOrigen || !ubicacionDestino) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan los parámetros de ubicacionOrigen o ubicacionDestino.'
    );
  }

  // Definimos la información del servicio a guardar en Firestore.
  const servicioData = {
    usuarioId: context.auth.uid, // ID del usuario que solicitó el servicio.
    ubicacionOrigen: ubicacionOrigen,
    ubicacionDestino: ubicacionDestino,
    estado: 'pendiente', // Estado inicial del servicio.
    fechaSolicitud: admin.firestore.FieldValue.serverTimestamp() // Fecha de la solicitud.
  };

  try {
    // Añadimos el nuevo servicio a la colección 'servicios' en Firestore.
    const servicioRef = await db.collection('servicios').add(servicioData);

    // Devolvemos el ID del servicio creado para que el frontend pueda rastrearlo.
    console.log(`Nuevo servicio creado con ID: ${servicioRef.id}`);
    return { id: servicioRef.id, mensaje: 'Servicio solicitado con éxito.' };

  } catch (error) {
    console.error("Error al crear el servicio: ", error);
    throw new functions.https.HttpsError(
      'unknown',
      'Ocurrió un error al procesar la solicitud del servicio.'
    );
  }
});
