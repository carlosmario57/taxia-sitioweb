#
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
from firebase_functions import https_fn

# =========================================================
# CONFIGURACIÓN GLOBAL Y CACHÉ
# =========================================================

# Estas variables globales se usarán después de la inicialización.
db = None
model = None

# Obtiene el ID del proyecto de Google Cloud.
# Ahora la variable se lee directamente del entorno, de forma más robusta.
app_id = os.environ.get('GCLOUD_PROJECT') or 'default-app-id'

# La clave de la API de Gemini. Se lee del Secret Manager de Google Cloud.
# Esta es la forma más segura y profesional.
gemini_api_key = os.environ.get('GEMINI_API_KEY')

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
def get_model(model_name: str):
    """
    Inicializa y devuelve un modelo de Gemini, usando caché para asegurar
    que solo se inicialice una vez por cada nombre de modelo.
    """
    if not gemini_api_key:
        print("ADVERTENCIA: GEMINI_API_KEY no está configurada. La funcionalidad de IA estará deshabilitada.")
        return None
    genai.configure(api_key=gemini_api_key)
    try:
        model = genai.GenerativeModel(model_name)
        print(f"Modelo de IA '{model_name}' inicializado.")
        return model
    except Exception as e:
        print(f"Error al inicializar el modelo '{model_name}': {e}")
        return None

# =========================================================
# FUNCIONES DE MANEJO DE RUTAS
# =========================================================

def add_simple_data_from_post(req: https_fn.Request):
    """
    Maneja una solicitud POST simple para agregar datos a Firestore.
    Esta función espera datos con claves 'nombre' y 'ciudad'.
    """
    db_client = get_db()
    
    try:
        data = req.get_json(silent=True)
        
        # Verifica si el objeto de datos es None o si no contiene las claves esperadas.
        if not data or 'nombre' not in data or 'ciudad' not in data:
            print("Error: Los datos JSON no son válidos para esta ruta.")
            return https_fn.Response(json.dumps({"error": "No se proporcionaron los campos 'nombre' o 'ciudad'"}), status=400, mimetype='application/json')
            
        doc_ref = db_client.collection("test_collection").add(data)
        
        print(f"Documento creado exitosamente con el ID: {doc_ref[1].id}")
        
        return https_fn.Response(json.dumps({"success": True, "doc_id": doc_ref[1].id}), status=200, mimetype='application/json')
    except Exception as e:
        print(f"Ocurrió un error inesperado al procesar los datos: {e}")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

def handle_travel_request(req: https_fn.Request):
    """
    Maneja la solicitud de viaje que utiliza el modelo Gemini.
    Ahora incluye un mecanismo de respaldo.
    """
    db_client = get_db()
    
    # Intenta usar el modelo principal
    model_name = 'gemini-2.5-flash-preview-05-20'
    gemini_model = get_model(model_name)
    
    # Si el modelo principal falla, intenta con el de respaldo
    if not gemini_model:
        print(f"El modelo principal '{model_name}' falló. Intentando con el modelo de respaldo...")
        model_name = 'gemini-1.5-pro'
        gemini_model = get_model(model_name)

    try:
        data = req.get_json(silent=True)

        if not data or 'text' not in data:
            print("Error: No se encontró el texto en la solicitud.")
            return https_fn.Response(json.dumps({'error': 'No text provided in the request'}), status=400, mimetype='application/json')

        user_message = data['text']
        user_id = data.get('userId', 'anonymous')

        if not gemini_model:
            return https_fn.Response(json.dumps({'error': 'El servicio de IA no está disponible en este momento.'}), status=503, mimetype='application/json')

        # Es importante pasar el esquema como un objeto JSON
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
            return https_fn.Response(json.dumps({'message': 'El mensaje no parece ser una solicitud de taxi.'}), status=200, mimetype='application/json')

        if not db_client:
            print("Error: No se pudo conectar a Firestore.")
            return https_fn.Response(json.dumps({'error': 'No se pudo conectar a la base de datos.'}), status=500, mimetype='application/json')

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

        return https_fn.Response(json.dumps({'message': 'Tu solicitud de taxi ha sido recibida y está siendo procesada.'}), status=200, mimetype='application/json')

    except Exception as e:
        print(f"Ocurrió un error inesperado: {e}")
        return https_fn.Response(json.dumps({'error': str(e)}), status=500, mimetype='application/json')

# =========================================================
# FUNCIÓN DE ENTRADA PRINCIPAL PARA FIREBASE FUNCTIONS
# =========================================================

@https_fn.on_request()
def app_as_function(req: https_fn.Request):
    """
    Esta función maneja las solicitudes HTTP entrantes y las enruta
    a las funciones de manejo adecuadas según la ruta de la solicitud.
    """
    path = req.path
    if path == '/api/data':
        return add_simple_data_from_post(req)
    else:
        # Por defecto, maneja las solicitudes de viaje
        return handle_travel_request(req)
