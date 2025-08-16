# Importa las bibliotecas necesarias de Firebase Functions y Flask
from firebase_functions import https_fn
from flask import Flask, jsonify, request
import google.generativeai as genai
import firebase_admin
from firebase_admin import firestore

# Inicializa la aplicación de Firebase
firebase_admin.initialize_app()
db = firestore.client()

# Inicializa la API de Google Gemini (sustituye tu clave si la tienes)
genai.configure(api_key="")

app = Flask(__name__)

# Define la ruta principal para la API
@app.route("/")
def hello_world():
    return "<p>¡Hola desde el backend de CIMCO!</p>"

# La función principal que Firebase ejecutará
# Esta función es un wrapper que maneja las solicitudes HTTP
# y las pasa a la aplicación Flask
@https_fn.on_request()
def api_server(req: https_fn.Request):
    with app.request_context(req.environ):
        # Manda la solicitud a la aplicación Flask
        # Esto permite que Flask maneje el routing a diferentes rutas
        return app.full_dispatch_request()
