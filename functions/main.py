# main.py

# =========================================================
# CONFIGURACIÓN Y LIBRERÍAS
# =========================================================
# Importar las bibliotecas necesarias.
# Flask y su método jsonify se siguen usando para manejar la solicitud HTTP.
from flask import jsonify
# Importa la función 'https_fn' de firebase_functions para crear la función HTTP.
from firebase_functions import https_fn
# Importa las bibliotecas de Firebase Admin SDK.
from firebase_admin import credentials, firestore
import firebase_admin
# Importa bibliotecas estándar de Python.
import json
import os
from datetime import datetime
# Importa la biblioteca de la API de Gemini.
import google.generativeai as genai

# =========================================================
# INICIALIZACIÓN Y CONFIGURACIÓN
# =========================================================

# Inicializa Firebase Admin SDK.
try:
    # Firebase Cloud Functions provee credenciales predeterminadas automáticamente.
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase inicializado correctamente.")
except Exception as e:
    print(f"Error al inicializar Firebase: {e}")
    db = None

# Configura la API de Gemini usando una variable de entorno.
try:
    # Lee la clave de la API desde las variables de entorno de la función.
    # El archivo .env.yaml es la forma recomendada de configurar esto.
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    if not GEMINI_API_KEY:
        print("Error: La clave de la API de Gemini no está configurada.")
        # Lanza un ValueError para detener la ejecución si la clave no está presente.
        raise ValueError("GEMINI_API_KEY no está configurada.")
    
    genai.configure(api_key=GEMINI_API_KEY)
    # Usa el modelo de Gemini. 'gemini-2.5-flash-preview-05-20' es ideal para respuestas rápidas.
    generation_model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')
    print("API de Gemini configurada con éxito.")
except Exception as e:
    print(f"Error al configurar la API de Gemini: {e}")
    generation_model = None

# Obtén el ID del proyecto de Firebase.
# Esto es esencial para adherirse a las reglas de seguridad de Firestore.
app_id = os.environ.get('GCLOUD_PROJECT') or 'default-app-id'

# =========================================================
# FUNCIÓN PRINCIPAL DE LA API
# =========================================================

# Usa el decorador de firebase_functions para definir el punto de entrada HTTP.
@https_fn.on_request()
def process_message(req):
    """
    Función de API que procesa una solicitud de viaje.
    - Extrae el origen y el destino usando la IA de Gemini.
    - Guarda los detalles del viaje en Firestore.
    - `req` es el objeto de solicitud HTTP proporcionado por Firebase.
    """
    try:
        # Intenta obtener los datos JSON del cuerpo de la solicitud.
        # `silent=True` evita que se lance una excepción si el cuerpo no es JSON.
        data = req.get_json(silent=True)
        
        # Validación inicial del JSON y del contenido.
        if not data or 'text' not in data:
            print("Error: Solicitud inválida. El campo 'text' es obligatorio.")
            return jsonify({'error': 'La solicitud debe ser un JSON con un campo "text".'}), 400

        user_message = data['text']
        user_id = data.get('userId', 'anonymous')

        # Verifica si el modelo de IA se inicializó correctamente.
        if not generation_model:
            print("Error: El modelo de Gemini no está disponible.")
            return jsonify({'error': 'Servicio de IA no disponible en este momento.'}), 503

        # Define el prompt y el esquema de respuesta para Gemini.
        # Esto asegura que la respuesta de la IA tenga el formato que esperamos.
        prompt_text = (
            f"Analiza la siguiente solicitud de viaje y extrae el origen y el destino. "
            f"Si el mensaje no contiene información de viaje relevante, devuelve un JSON vacío. "
            f"El mensaje es: '{user_message}'"
        )
        response_schema = {
            "type": "OBJECT",
            "properties": {
                "origin": {"type": "STRING"},
                "destination": {"type": "STRING"}
            },
            "required": ["origin", "destination"]
        }
        
        # Llama a la API de Gemini.
        gemini_response = generation_model.generate_content(
            contents=[{'role': 'user', 'parts': [{'text': prompt_text}]}],
            generation_config={
                "response_mime_type": "application/json", 
                "response_schema": response_schema
            }
        )

        # Procesa la respuesta de la IA.
        try:
            travel_data_str = gemini_response.candidates[0].content.parts[0].text
            travel_info = json.loads(travel_data_str)
        except (IndexError, json.JSONDecodeError):
            print("Error: La respuesta de Gemini no es un JSON válido o está incompleta.")
            # Devuelve un mensaje amigable si la IA no pudo procesar la solicitud.
            return jsonify({
                'message': 'No pude entender la solicitud. Por favor, sé más específico, por ejemplo: "Necesito un taxi de mi casa a la oficina".'
            }), 200

        origin_address = travel_info.get('origin')
        destination_address = travel_info.get('destination')

        # Verifica si los campos de origen y destino se extrajeron correctamente.
        if not origin_address or not destination_address:
            print("No se pudo extraer la información de viaje del mensaje.")
            return jsonify({
                'message': 'El mensaje no parece ser una solicitud de viaje.'
            }), 200

        # Prepara los datos para guardar en Firestore.
        travel_doc = {
            'originAddress': origin_address,
            'destinationAddress': destination_address,
            'status': 'pending',
            'createdAt': firestore.SERVER_TIMESTAMP,
            'passengerId': user_id,
        }

        # Guarda el documento en Firestore.
        # La ruta sigue las mejores prácticas de seguridad.
        collection_path = f'artifacts/{app_id}/public/data/travels'
        doc_ref = db.collection(collection_path).document()
        doc_ref.set(travel_doc)

        print(f"Viaje creado exitosamente con el ID: {doc_ref.id}")
        
        return jsonify({
            'message': '¡Tu solicitud de viaje ha sido recibida y está siendo procesada!', 
            'travel_id': doc_ref.id
        }), 200

    except Exception as e:
        # Manejo de errores genérico para depuración.
        print(f"Ocurrió un error inesperado: {e}")
        return jsonify({'error': str(e)}), 500
