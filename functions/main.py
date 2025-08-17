# =========================================================
# Archivo: functions/main.py
# =========================================================

# Importa módulos estándar de Python
import os
import json
from datetime import datetime
from functools import lru_cache

# Importa bibliotecas de Firebase y Google
import firebase_admin
import google.generativeai as genai
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify

# Importa el módulo de Firebase Functions
from firebase_functions import https_fn

# =========================================================
# CONFIGURACIÓN GLOBAL Y CACHÉ
# =========================================================

# Crea una instancia de la aplicación Flask.
# Esto se ejecuta en el arranque del servidor.
app = Flask(__name__)

# Estas variables globales se usarán después de la inicialización.
db = None
model = None

# Obtiene el ID del proyecto de Google Cloud.
app_id = os.environ.get('GCLOUD_PROJECT') or 'default-app-id'

# La clave de la API de Gemini. Se carga como variable de entorno.
gemini_api_key = os.environ.get("GEMINI_API_KEY")

@lru_cache(maxsize=1)
def get_db():
    """
    Inicializa y devuelve la instancia de Firestore,
    usando caché para asegurar que solo se inicialice una vez.
    """
    global db
    if db is None:
        try:
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            db = firestore.client()
            print("Firebase inicializado correctamente.")
        except Exception as e:
            print(f"Error al inicializar Firebase: {e}.")
            return None
    return db

@lru_cache(maxsize=1)
def get_model():
    """
    Inicializa y devuelve el modelo de Gemini,
    usando caché para asegurar que solo se inicialice una vez.
    """
    global model
    if model is None:
        if not gemini_api_key:
            print("WARNING: GEMINI_API_KEY no está configurada. La funcionalidad de IA estará deshabilitada.")
            return None
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')
        print("Modelo de IA inicializado.")
    return model

# =========================================================
# FUNCIÓN PRINCIPAL DEL WEBHOOK Y LA IA
# =========================================================

@app.route("/", methods=['POST'])
def process_message():
    """
    Esta función maneja las solicitudes POST entrantes del webhook.
    """
    db_client = get_db()
    gemini_model = get_model()

    try:
        data = request.get_json(silent=True)

        if not data or 'text' not in data:
            print("Error: No se encontró el texto en la solicitud.")
            return jsonify({'error': 'No text provided in the request'}), 400

        user_message = data['text']
        user_id = data.get('userId', 'anonymous')

        if not gemini_model:
            return jsonify({'error': 'El servicio de IA no está disponible en este momento.'}), 503

        response_schema = {
            "type": "OBJECT",
            "properties": {
                "origin": {"type": "STRING"},
                "destination": {"type": "STRING"}
            },
            "required": ["origin", "destination"]
        }

        prompt = (
            f"Analiza el siguiente mensaje y extrae la dirección de origen y la de destino para un viaje en taxi. "
            f"Si el mensaje no es una solicitud de viaje, devuelve un JSON vacío. "
            f"Mensaje del usuario: '{user_message}'"
        )

        response = gemini_model.generate_content(
            contents=[{'role': 'user', 'parts': [{'text': prompt}]}],
            generation_config={"response_mime_type": "application/json", "response_schema": response_schema}
        )

        travel_data = response.candidates[0].content.parts[0].text
        travel_info = json.loads(travel_data)

        origin_address = travel_info.get('origin')
        destination_address = travel_info.get('destination')

        if not origin_address or not destination_address:
            print("El mensaje no es una solicitud de viaje válida.")
            return jsonify({'message': 'El mensaje no parece ser una solicitud de taxi.'}), 200

        if not db_client:
            print("Error: No se pudo conectar a Firestore.")
            return jsonify({'error': 'No se pudo conectar a la base de datos.'}), 500

        travel_doc = {
            'originAddress': origin_address,
            'destinationAddress': destination_address,
            'status': 'pending',
            'createdAt': datetime.now(),
            'passengerId': user_id,
        }

        doc_ref = db_client.collection(f'artifacts/{app_id}/public/data/travels').document()
        doc_ref.set(travel_doc)

        print(f"Viaje creado exitosamente con el ID: {doc_ref.id}")

        return jsonify({'message': 'Tu solicitud de taxi ha sido recibida y está siendo procesada.'}), 200

    except Exception as e:
        print(f"Ocurrió un error inesperado: {e}")
        return jsonify({'error': str(e)}), 500

# =========================================================
# PUNTO DE ENTRADA PARA FIREBASE FUNCTIONS
# =========================================================

@https_fn.on_request()
def app_as_function(req: https_fn.Request):
    """
    Función de entrada que sirve la aplicación Flask.
    """
    with app.request_context(req.environ):
        return app.full_dispatch_request()
