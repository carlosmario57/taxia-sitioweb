# main.py

# =========================================================
# IMPORTS DE LIBRERÍAS
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

# Importa el módulo de Firebase Functions para convertir Flask en una función de la nube
from firebase_functions import https_fn

# =========================================================
# CONFIGURACIÓN DE LA APLICACIÓN Y SERVICIOS
# =========================================================

# Crea una instancia de la aplicación Flask
app = Flask(__name__)

# Configura la API de Gemini
try:
    # La clave de API se obtiene de forma segura desde las variables de entorno de Firebase.
    # Esto evita exponer la clave en el código.
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY no está configurada como variable de entorno.")
    genai.configure(api_key=gemini_api_key)
    # Define el modelo de IA a utilizar
    model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')
    print("API de Gemini configurada correctamente.")
except Exception as e:
    # Si la configuración falla, se registra el error y el modelo queda como None.
    print(f"Error al configurar la API de Gemini: {e}")
    model = None

# Inicializa el Admin SDK de Firebase
try:
    # Usa las credenciales predeterminadas de la aplicación, que son las más seguras
    # en entornos de Google Cloud Functions.
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase inicializado correctamente.")
except Exception as e:
    # Si la inicialización de Firebase falla, se registra el error.
    print(f"Error al inicializar Firebase: {e}")
    db = None

# Obtiene el ID del proyecto de Google Cloud, que se usa para las rutas de Firestore.
app_id = os.environ.get('GCLOUD_PROJECT') or 'default-app-id'

# =========================================================
# FUNCIÓN PRINCIPAL DEL WEBHOOK Y LA IA
# =========================================================

@app.route("/", methods=['POST'])
def process_message():
    """
    Esta función maneja las solicitudes POST entrantes (webhooks de Messenger).
    Extrae la información de un viaje de la solicitud y la guarda en Firestore.
    """
    try:
        # Intenta obtener el cuerpo de la solicitud en formato JSON.
        data = request.get_json(silent=True)
        
        # Validación inicial de los datos de entrada
        if not data or 'text' not in data:
            print("Error: No se encontró el texto en la solicitud.")
            return jsonify({'error': 'No text provided in the request'}), 400

        user_message = data['text']
        user_id = data.get('userId', 'anonymous')

        # Define el esquema JSON para la respuesta de la IA.
        # Esto asegura que la IA devuelva un formato de datos predecible.
        response_schema = {
            "type": "OBJECT",
            "properties": {
                "origin": {"type": "STRING"},
                "destination": {"type": "STRING"}
            },
            "required": ["origin", "destination"]
        }
        
        # Prepara el 'prompt' para la IA, instruyéndola a extraer los datos del mensaje.
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
        try:
            travel_data = response.candidates[0].content.parts[0].text
            travel_info = json.loads(travel_data)
        except (IndexError, json.JSONDecodeError):
            print("Error: La respuesta de Gemini no es un JSON válido o la estructura es incorrecta.")
            return jsonify({'message': 'No pude entender la solicitud. Por favor, sé más específico.'}), 200

        origin_address = travel_info.get('origin')
        destination_address = travel_info.get('destination')

        # Si el origen o el destino no se encontraron, se asume que el mensaje no era una solicitud de viaje.
        if not origin_address or not destination_address:
            print("El mensaje no es una solicitud de viaje válida.")
            return jsonify({'message': 'El mensaje no parece ser una solicitud de taxi.'}), 200

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
        print(f"Ocurrió un error inesperado: {e}")
        return jsonify({'error': str(e)}), 500

# =========================================================
# PUNTO DE ENTRADA PARA FIREBASE FUNCTIONS (2DA GEN)
# =========================================================

@https_fn.on_request()
def app_as_function(req: https_fn.Request) -> https_fn.Response:
    """
    Este es el punto de entrada principal para Firebase Functions.
    Convierte la solicitud de Firebase en un contexto que Flask puede manejar.
    """
    with app.test_request_context(
        path=req.path,
        method=req.method,
        headers=req.headers,
        data=req.data,
        query_string=req.query_string,
    ):
        return app.full_dispatch_request()
