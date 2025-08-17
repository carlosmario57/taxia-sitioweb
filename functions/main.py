# =========================================================
# Archivo: functions/main.py
# =========================================================

# Importa módulos estándar de Python
import os
import json
from datetime import datetime

# Importa bibliotecas de Firebase y Google
import firebase_admin
import google.generativeai as genai
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify

# Importa el módulo de Firebase Functions
from firebase_functions import https_fn

# =========================================================
# CONFIGURACIÓN GLOBAL
# =========================================================

# Crea una instancia de la aplicación Flask.
# Esto se ejecuta en el arranque del servidor.
app = Flask(__name__)

# Estas variables son para acceso global, pero los servicios
# se inicializarán más tarde.
gemini_api_key = os.environ.get("GEMINI_API_KEY")
db = None
model = None

# Obtiene el ID del proyecto de Google Cloud.
app_id = os.environ.get('GCLOUD_PROJECT') or 'default-app-id'

# =========================================================
# PUNTO DE ENTRADA Y SERVICIOS
# =========================================================

def initialize_services():
    """
    Inicializa los servicios de Firebase y Gemini de forma perezosa.
    """
    global db
    global model

    # Inicializa Firebase Admin SDK solo si no está inicializado.
    # Esta es una optimización crucial para evitar timeouts.
    if not firebase_admin._apps:
        try:
            firebase_admin.initialize_app()
            db = firestore.client()
            print("Firebase inicializado correctamente.")
        except Exception as e:
            print(f"Error al inicializar Firebase: {e}. Las operaciones de base de datos no funcionarán.")
            db = None
    else:
        # Si ya está inicializado, simplemente obtén la instancia.
        db = firestore.client()
    
    # Inicializa el modelo de Gemini solo si no está inicializado.
    if not model:
        if not gemini_api_key:
            print("WARNING: GEMINI_API_KEY no está configurada. La funcionalidad de IA estará deshabilitada.")
            genai.configure(api_key="placeholder_key")
        else:
            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')
            print("Modelo de IA inicializado.")

@app.route("/", methods=['POST'])
def process_message():
    """
    Esta función maneja las solicitudes POST entrantes del webhook.
    Extrae la información de un viaje y la guarda en Firestore.
    """
    # Llama a la función de inicialización al inicio de cada solicitud.
    initialize_services()
    
    # ... (el resto de tu código de la función process_message es el mismo) ...
    try:
        # Intenta obtener el cuerpo de la solicitud en formato JSON.
        data = request.get_json(silent=True)

        # Validación inicial de los datos de entrada
        if not data or 'text' not in data:
            print("Error: No se encontró el texto en la solicitud.")
            return jsonify({'error': 'No text provided in the request'}), 400

        user_message = data['text']
        user_id = data.get('userId', 'anonymous')

        # Si el modelo de IA no se pudo cargar, se devuelve un error.
        if not model:
            return jsonify({'error': 'El servicio de IA no está disponible en este momento.'}), 503

        # Define el esquema JSON para la respuesta de la IA.
        response_schema = {
            "type": "OBJECT",
            "properties": {
                "origin": {"type": "STRING"},
                "destination": {"type": "STRING"}
            },
            "required": ["origin", "destination"]
        }

        # Prepara el 'prompt' para la IA.
        prompt = (
            f"Analiza el siguiente mensaje y extrae la dirección de origen y la de destino para un viaje en taxi. "
            f"Si el mensaje no es una solicitud de viaje, devuelve un JSON vacío. "
            f"Mensaje del usuario: '{user_message}'"
        )

        # Llama a la API de Gemini para generar la respuesta.
        response = model.generate_content(
            contents=[{'role': 'user', 'parts': [{'text': prompt}]}],
            generation_config={"response_mime_type": "application/json", "response_schema": response_schema}
        )

        # Analiza la respuesta JSON de la IA.
        travel_data = response.candidates[0].content.parts[0].text
        travel_info = json.loads(travel_data)

        origin_address = travel_info.get('origin')
        destination_address = travel_info.get('destination')

        # Si el origen o el destino no se encontraron...
        if not origin_address or not destination_address:
            print("El mensaje no es una solicitud de viaje válida.")
            return jsonify({'message': 'El mensaje no parece ser una solicitud de taxi.'}), 200

        # Si la conexión a Firestore no está disponible...
        if not db:
            print("Error: No se pudo conectar a Firestore.")
            return jsonify({'error': 'No se pudo conectar a la base de datos.'}), 500

        # Crea un nuevo documento en la colección 'travels' de Firestore.
        travel_doc = {
            'originAddress': origin_address,
            'destinationAddress': destination_address,
            'status': 'pending',
            'createdAt': datetime.now(),
            'passengerId': user_id,
        }

        # Define la ruta del documento para ser pública dentro de la aplicación.
        doc_ref = db.collection(f'artifacts/{app_id}/public/data/travels').document()
        doc_ref.set(travel_doc)

        print(f"Viaje creado exitosamente con el ID: {doc_ref.id}")

        # Envía una respuesta de éxito al webhook.
        return jsonify({'message': 'Tu solicitud de taxi ha sido recibida y está siendo procesada.'}), 200

    except Exception as e:
        # Manejo de errores general para cualquier excepción inesperada.
        print(f"Ocurrió un error inesperado: {e}")
        return jsonify({'error': str(e)}), 500

# =========================================================
# PUNTO DE ENTRADA PARA FIREBASE FUNCTIONS
# =========================================================

# Esta es la función que Firebase invoca.
# Todo el tráfico HTTP se redirige a tu aplicación Flask.
@https_fn.on_request()
def app_as_function(req: https_fn.Request):
    """
    Función de entrada que sirve la aplicación Flask.
    """
    with app.request_context(req.environ):
        return app.full_dispatch_request()
