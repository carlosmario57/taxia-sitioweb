# main.py

# =========================================================
# CONFIGURACIÓN DE LA APLICACIÓN Y LIBRERÍAS
# =========================================================
# Importar las bibliotecas necesarias
from flask import Flask, request, jsonify
import firebase_admin
import os
import json
import google.generativeai as genai
from firebase_admin import credentials, firestore
from datetime import datetime

# =========================================================
# INICIALIZACIÓN Y CONFIGURACIÓN
# =========================================================

# Inicializar la aplicación Flask
# Flask es un marco de trabajo que nos permite crear una API web.
app = Flask(__name__)

# Configurar la API de Gemini
try:
    # Obtener la clave de API de Gemini de la variable de entorno.
    # TODO: Asegúrate de configurar la variable de entorno 'GEMINI_API_KEY' en Firebase.
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    if not GEMINI_API_KEY:
        # Esto es crucial. Si la clave no existe, la función no debe continuar.
        # En Cloud Functions, esto resultará en un error de despliegue.
        print("Error: La clave de la API de Gemini no está configurada.")
        # Se lanza un error para detener el despliegue si la clave falta.
        raise ValueError("GEMINI_API_KEY no está configurada como variable de entorno.")
    
    # Configurar la biblioteca de Gemini con la clave de API
    genai.configure(api_key=GEMINI_API_KEY)
    # Inicializar el modelo de Gemini. Usamos el modelo 'flash' para respuestas rápidas.
    generation_model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')
    print("API de Gemini configurada con éxito.")
except Exception as e:
    print(f"Error al configurar la API de Gemini: {e}")
    # Es una buena práctica tener un valor predeterminado si falla la configuración, aunque
    # en este caso, la excepción anterior detendrá el despliegue.
    generation_model = None

# Inicializar Firebase Admin SDK
try:
    # Firebase Cloud Functions provee credenciales predeterminadas, que son la
    # forma más segura de inicializar el SDK sin usar un archivo de credenciales.
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)
    # Obtener un cliente de Firestore para interactuar con la base de datos.
    db = firestore.client()
    print("Firebase inicializado correctamente.")
except Exception as e:
    print(f"Error al inicializar Firebase: {e}")
    db = None

# Obtener el ID de la aplicación. Esto es importante para seguir las reglas de seguridad de Firestore
# y organizar los datos de manera segura y escalable.
app_id = os.environ.get('GCLOUD_PROJECT') or 'default-app-id'

# =========================================================
# FUNCIÓN PRINCIPAL DE LA API
# =========================================================

@app.route('/', methods=['POST'])
def process_message():
    """
    Función de API que procesa una solicitud de viaje.
    - Extrae el origen y destino usando la IA de Gemini.
    - Guarda los detalles del viaje en Firestore.
    """
    # Usar un bloque try-except para manejar cualquier error inesperado
    try:
        data = request.get_json(silent=True)
        
        # Validar la entrada del usuario
        if not data or 'text' not in data:
            print("Error: No se encontró el texto en la solicitud.")
            return jsonify({'error': 'No se proporcionó texto en la solicitud.'}), 400

        user_message = data['text']
        user_id = data.get('userId', 'anonymous')

        # Si el modelo de generación no se inicializó correctamente,
        # devolver un error.
        if not generation_model:
            print("Error: El modelo de Gemini no está disponible.")
            return jsonify({'error': 'Servicio de IA no disponible en este momento.'}), 503

        # Definir el 'prompt' para la IA de Gemini
        # Se usa un esquema JSON para asegurar una respuesta estructurada.
        prompt = (
            f"Analiza la siguiente solicitud de viaje y extrae el origen y el destino. "
            f"Si el mensaje no contiene información de viaje, devuelve un JSON vacío. "
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
        
        # Llamar a la API de Gemini con el prompt y el esquema
        gemini_response = generation_model.generate_content(
            contents=[{'role': 'user', 'parts': [{'text': prompt}]}],
            generation_config={
                "response_mime_type": "application/json", 
                "response_schema": response_schema
            }
        )

        # Analizar la respuesta de la IA
        try:
            travel_data_str = gemini_response.candidates[0].content.parts[0].text
            travel_info = json.loads(travel_data_str)
        except (IndexError, json.JSONDecodeError):
            print("Error: La respuesta de Gemini no es un JSON válido o está vacía.")
            return jsonify({
                'message': 'No pude entender la solicitud. Por favor, sé más específico.'
            }), 200

        origin_address = travel_info.get('origin')
        destination_address = travel_info.get('destination')

        # Verificar si la IA extrajo la información necesaria
        if not origin_address or not destination_address:
            print("No se pudo extraer la información de viaje del mensaje.")
            return jsonify({
                'message': 'El mensaje no parece ser una solicitud de viaje.'
            }), 200

        # Crear un nuevo documento en Firestore
        # Se usa una ruta específica y el app_id para organizar los datos de manera segura.
        # Las reglas de seguridad de Firestore deben permitir la escritura en esta ruta.
        travel_doc = {
            'originAddress': origin_address,
            'destinationAddress': destination_address,
            'status': 'pending',
            'createdAt': firestore.SERVER_TIMESTAMP, # Usar un timestamp del servidor para mayor precisión
            'passengerId': user_id,
        }

        # La colección debe seguir las reglas de seguridad
        collection_path = f'artifacts/{app_id}/public/data/travels'
        doc_ref = db.collection(collection_path).document()
        doc_ref.set(travel_doc)

        print(f"Viaje creado exitosamente con el ID: {doc_ref.id}")
        
        return jsonify({'message': 'Tu solicitud de viaje ha sido recibida y está siendo procesada.'}), 200

    except Exception as e:
        # Captura y registra cualquier excepción para depuración
        print(f"Ocurrió un error inesperado: {e}")
        return jsonify({'error': str(e)}), 500

# NOTA: No se debe usar app.run() para el despliegue en Firebase Functions.
# La plataforma se encarga de servir la aplicación.
# El siguiente código es solo para pruebas locales.
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)
