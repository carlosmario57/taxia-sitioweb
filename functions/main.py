# main.py

# Importar las bibliotecas necesarias
from flask import Flask, request, jsonify
import firebase_admin
import os
import json
import google.generativeai as genai
from firebase_admin import credentials, firestore
from datetime import datetime

# =========================================================
# CONFIGURACIÓN DE LA APLICACIÓN
# =========================================================

# Inicializar la aplicación Flask
app = Flask(__name__)

# Configurar la API de Gemini
try:
    # Intenta obtener la clave de API de Gemini de la variable de entorno
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    if not GEMINI_API_KEY:
        # Lanza un error si la clave no está configurada, lo cual detiene el despliegue
        raise ValueError("GEMINI_API_KEY no está configurada como variable de entorno.")
    genai.configure(api_key=GEMINI_API_KEY)
    # Inicializa el modelo de Gemini que usaremos para la generación de contenido
    generation_model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')
except Exception as e:
    # Manejo de errores si la configuración de Gemini falla
    print(f"Error al configurar la API de Gemini: {e}")
    generation_model = None

# Inicializar Firebase
try:
    # Usa las credenciales predeterminadas de la aplicación, que son las recomendadas
    # y más seguras para entornos de Cloud Functions.
    # Esto elimina la necesidad de manejar archivos JSON de credenciales.
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)
    # Crea un cliente de Firestore para interactuar con la base de datos
    db = firestore.client()
    print("Firebase inicializado correctamente con credenciales predeterminadas.")
except Exception as e:
    # Manejo de errores si la inicialización de Firebase falla
    print(f"Error al inicializar Firebase: {e}")
    db = None

# Obtener el ID de la aplicación para usar en las rutas de Firestore
# Esto es esencial para organizar los datos de manera segura y escalable
app_id = os.environ.get('GCLOUD_PROJECT') or 'default-app-id'

# =========================================================
# FUNCIÓN PRINCIPAL
# =========================================================

@app.route('/', methods=['POST'])
def process_message():
    """
    Procesa un mensaje entrante (desde un webhook) para solicitar un viaje.
    - Usa la IA de Gemini para extraer el origen y destino del mensaje.
    - Guarda los detalles del viaje en una base de datos de Firestore.
    """
    try:
        data = request.get_json(silent=True)
        if not data or 'text' not in data:
            print("Error: No se encontró el texto en la solicitud.")
            return jsonify({'error': 'No text provided in the request'}), 400

        user_message = data['text']
        user_id = data.get('userId', 'anonymous')

        # Define el esquema de respuesta para la IA. Esto asegura que la IA
        # nos devuelva los datos en el formato JSON que necesitamos.
        response_schema = {
            "type": "OBJECT",
            "properties": {
                "origin": {"type": "STRING"},
                "destination": {"type": "STRING"}
            },
            "required": ["origin", "destination"]
        }
        
        # Prepara el 'prompt' o instrucción para la IA de Gemini
        prompt = (
            f"Analiza la siguiente solicitud de taxi. Extrae la dirección de origen y la de destino. "
            f"Si el mensaje no es una solicitud de taxi, devuelve un JSON vacío. "
            f"El mensaje es: '{user_message}'"
        )

        # Llama a la API de Gemini para generar el contenido
        response = generation_model.generate_content(
            contents=[{'role': 'user', 'parts': [{'text': prompt}]}],
            generation_config={"response_mime_type": "application/json", "response_schema": response_schema}
        )

        # Analiza la respuesta JSON de la IA
        try:
            travel_data = response.candidates[0].content.parts[0].text
            travel_info = json.loads(travel_data)
        except (IndexError, json.JSONDecodeError):
            print("Error: La respuesta de Gemini no es un JSON válido.")
            return jsonify({'message': 'No pude entender la solicitud. Por favor, sé más específico.'}), 200

        origin_address = travel_info.get('origin')
        destination_address = travel_info.get('destination')

        # Si el origen o el destino no se encontraron, envía una respuesta al usuario
        if not origin_address or not destination_address:
            return jsonify({'message': 'El mensaje no parece ser una solicitud de taxi.'}), 200

        # Crea un nuevo documento en la colección 'travels' de Firestore
        # La ruta del documento utiliza el app_id para organizar los datos de forma segura
        # y pública (accesible para otros usuarios en la misma app).
        travel_doc = {
            'originAddress': origin_address,
            'destinationAddress': destination_address,
            'status': 'pending',
            'createdAt': datetime.now(),
            'passengerId': user_id,
        }
        
        doc_ref = db.collection(f'artifacts/{app_id}/public/data/travels').document()
        doc_ref.set(travel_doc)

        print(f"Viaje creado exitosamente con el ID: {doc_ref.id}")
        
        # Envía una respuesta de éxito al usuario
        return jsonify({'message': 'Tu solicitud de taxi ha sido recibida y está siendo procesada.'}), 200

    except Exception as e:
        print(f"Ocurrió un error inesperado: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Esto es solo para pruebas locales.
    app.run(host='127.0.0.1', port=8080)
