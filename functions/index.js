// --- Servidor Backend de CIMCO (Adaptado para Firebase Cloud Functions) ---
// Este archivo gestiona la lógica de tu negocio como una función HTTP de Firebase.
const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
// --- Inicialización de Firebase Admin SDK ---
// Importante: Asegúrate de que tu archivo 'serviceAccountKey.json' esté en la misma carpeta.
// Este archivo contiene las credenciales para que tu servidor pueda acceder a Firestore.
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
// --- Tus credenciales de la API de WhatsApp ---
const WHATSAPP_TOKEN = 'EAALDHhT6fwUBPQYMizZBMYD0coDR3bP7nzcI7wjolA2YH5G3zZCSFWTNmCZAOXyRSkBbIhuCgTJeZBdQOkslmHq7e82diD09Gm11ZB4bgAViXS5b95gqTGrH050Xcq5OTv8tLux81YAaJwNZBAoweCu3P0prPNo0E6x0xxcaLfSyR9hZC2k1Yx9wiAX805PBxqIjgZDZD';
const WHATSAPP_PHONE_NUMBER_ID = '787349791127922';
const WHATSAPP_API_URL = `https://graph.facebook.com/v15.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
// --- Función para enviar una notificación de servicio a un conductor ---
async function enviarNotificacionWhatsApp(conductor, pasajero, servicio) {
  try {
    const data = {
      messaging_product: 'whatsapp',
      to: conductor.telefono,
      type: 'text',
      text: {
        body: `¡Tienes un nuevo servicio!\n\nDe: ${pasajero.ubicacion_actual}\nPara: ${servicio.destino}\n\nResponde "ACEPTAR" en la app para tomarlo.`
      }
    };
    await axios.post(WHATSAPP_API_URL, data, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`
      }
    });
    console.log(` ✅  Notificación enviada a ${conductor.nombre}`);
  } catch (error) {
    console.error(' ❌  Error al enviar notificación por WhatsApp:', error);
  }
}
// --- Lógica para buscar el conductor más cercano ---
// Aquí es donde llamarías a tu script de Python para hacer el cálculo.
// Por ahora, devolvemos un conductor de ejemplo.
async function buscarConductorCercano(ubicacion, tipoServicio) {
  // Puedes usar tu módulo de Python aquí, por ejemplo:
  // const { spawn } = require('child_process');
  // const pyProg = spawn('python', ['app.py', ubicacion.lat, ubicacion.lng, tipoServicio]);
  // ...
  return {
    nombre: 'Conductor de Prueba',
    telefono: '573105555555', // Teléfono del conductor
    tipo: 'Mototaxi'
  };
}
// --- Endpoint para solicitar un servicio (ahora como una Cloud Function) ---
const app = express();
app.use(express.json());
app.post('/solicitar-servicio', async (req, res) => {
  const { pasajero, servicio } = req.body;
  try {
    const TIEMPO_EXPIRACION_MINUTOS = 5;
    const horaActual = admin.firestore.Timestamp.now();
    const horaExpiracion = new Date(horaActual.toDate().getTime() + TIEMPO_EXPIRACION_MINUTOS * 60000);
    const nuevaSolicitud = {
      pasajero,
      servicio,
      estado: 'pendiente',
      fechaCreacion: horaActual,
      expiraEn: admin.firestore.Timestamp.fromDate(horaExpiracion)
    };
    const docRef = await db.collection('solicitudes_viaje').add(nuevaSolicitud);
    console.log("Nueva solicitud creada en Firestore con ID:", docRef.id);
    const conductorMasCercano = await buscarConductorCercano(pasajero.ubicacion_actual, servicio.tipo);
    if (conductorMasCercano) {
      await enviarNotificacionWhatsApp(conductorMasCercano, pasajero, servicio);
      res.status(200).send('Servicio solicitado. Esperando confirmación del conductor.');
    } else {
      res.status(404).send('No se encontraron conductores disponibles.');
    }
  } catch (error) {
    console.error(' ❌  Error en el proceso de solicitud:', error);
    res.status(500).send('Ocurrió un error en el servidor.');
  }
});
// ¡Exportamos la aplicación Express como una Cloud Function!
// Nota: 'solicitarServicio' será el nombre de tu función en Firebase.
exports.solicitarServicio = functions.https.onRequest(app);