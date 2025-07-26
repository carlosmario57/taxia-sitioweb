from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_admin import exceptions as firebase_exceptions
import os
from datetime import datetime
import json

# --- Configuración de Firebase ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_KEY_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")

if not firebase_admin._apps:
    try:
        if not os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            raise FileNotFoundError(f"El archivo de clave de servicio no se encontró en: {SERVICE_ACCOUNT_KEY_PATH}")

        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK inicializado exitosamente.")
    except FileNotFoundError as e:
        print(f"ERROR FATAL: {e}")
        print(f"POR FAVOR, VERIFICA LA RUTA Y EL NOMBRE EXACTO DEL ARCHIVO: '{SERVICE_ACCOUNT_KEY_PATH}'")
        print("Asegúrate de que no tenga extensiones dobles como '.json.json' o caracteres invisibles.")
    except Exception as e:
        print(f"ERROR FATAL al inicializar Firebase Admin SDK: {e}")
        print("Verifica tu conexión a internet o la configuración de tu proyecto Firebase.")

try:
    db = firestore.client()
except NameError:
    print("Firestore client no pudo ser inicializado. Las operaciones de base de datos fallarán.")
    db = None

app = Flask(__name__)
CORS(app)

# --- Rutas de API para Conductores ---

@app.route('/drivers', methods=['GET'])
def get_drivers():
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        drivers_ref = db.collection('drivers') # Colección 'drivers'
        all_drivers = []
        for doc in drivers_ref.stream():
            driver_data = doc.to_dict()
            driver_data['id'] = doc.id
            all_drivers.append(driver_data)
        return jsonify(all_drivers), 200
    except Exception as e:
        print(f"Error al obtener conductores: {e}")
        return jsonify({"error": "Error interno del servidor al obtener conductores"}), 500

@app.route('/drivers', methods=['POST'])
def add_driver():
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400
        required_fields = ['nombre', 'telefono', 'tipoVehiculo']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Falta el campo obligatorio: '{field}' o está vacío"}), 400

        doc_ref = db.collection('drivers').add(data) # Colección 'drivers'
        return jsonify({"id": doc_ref[1].id, "message": "Conductor añadido exitosamente"}), 201
    except Exception as e:
        print(f"Error al añadir conductor: {e}")
        return jsonify({"error": "Error interno del servidor al añadir conductor"}), 500

@app.route('/drivers/<string:driver_id>', methods=['PUT'])
def update_driver(driver_id):
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400

        driver_ref = db.collection('drivers').document(driver_id) # Colección 'drivers'
        if not driver_ref.get().exists:
            return jsonify({"error": f"Conductor con ID '{driver_id}' no encontrado"}), 404

        driver_ref.update(data)
        return jsonify({"message": f"Conductor '{driver_id}' actualizado exitosamente"}), 200
    except Exception as e:
        print(f"Error al actualizar conductor '{driver_id}': {e}")
        return jsonify({"error": "Error interno del servidor al actualizar conductor"}), 500

@app.route('/drivers/<string:driver_id>', methods=['DELETE'])
def delete_driver(driver_id):
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        db.collection('drivers').document(driver_id).delete() # Colección 'drivers'
        return jsonify({"message": f"Conductor '{driver_id}' eliminado exitosamente"}), 200
    except Exception as e:
        print(f"Error al eliminar conductor '{driver_id}': {e}")
        return jsonify({"error": "Error interno del servidor al eliminar conductor"}), 500

# --- Rutas de API para Viajes (Travels) ---

@app.route('/viajes', methods=['GET'])
def get_viajes():
    """
    Obtiene todos los viajes de la colección 'viajes' en Firestore.
    Retorna una lista de diccionarios con los datos de los viajes, incluyendo su ID de documento.
    Maneja la conversión de Timestamps de Firestore a formato legible.
    """
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        viajes_ref = db.collection('viajes')
        all_viajes = []
        for doc in viajes_ref.stream():
            viaje_data = doc.to_dict()
            viaje_data['id'] = doc.id

            if 'fecha_solicitud' in viaje_data and hasattr(viaje_data['fecha_solicitud'], 'isoformat'):
                viaje_data['fecha_solicitud'] = viaje_data['fecha_solicitud'].isoformat()
            if 'fecha_asignacion' in viaje_data and hasattr(viaje_data['fecha_asignacion'], 'isoformat'):
                viaje_data['fecha_asignacion'] = viaje_data['fecha_asignacion'].isoformat()
            
            all_viajes.append(viaje_data)
        return jsonify(all_viajes), 200
    except Exception as e:
        print(f"Error al obtener viajes: {e}")
        return jsonify({"error": "Error interno del servidor al obtener viajes"}), 500

@app.route('/viajes', methods=['POST'])
def add_viaje():
    """
    Añade un nuevo viaje a la colección 'viajes' en Firestore.
    Requiere 'pasajero_nombre' y al menos una forma de ubicación de origen
    (ubicacion_origen_texto o ubicacion_origen_lat/lon).
    Retorna el ID del nuevo viaje creado.
    """
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400

        if not data.get('pasajero_nombre'):
            return jsonify({"error": "Falta el nombre del pasajero"}), 400
        
        if not (data.get('ubicacion_origen_texto') or 
                (data.get('ubicacion_origen_lat') is not None and data.get('ubicacion_origen_lon') is not None)):
            return jsonify({"error": "Debe proporcionar una ubicación de origen (texto o coordenadas GPS)"}), 400

        data['pasajero_telefono'] = data.get('pasajero_telefono', '')
        data['ubicacion_origen_texto'] = data.get('ubicacion_origen_texto', '')
        data['ubicacion_origen_lat'] = float(data.get('ubicacion_origen_lat')) if data.get('ubicacion_origen_lat') is not None else None
        data['ubicacion_origen_lon'] = float(data.get('ubicacion_origen_lon')) if data.get('ubicacion_origen_lon') is not None else None
        
        data['ubicacion_destino_texto'] = data.get('ubicacion_destino_texto', '')
        data['ubicacion_destino_lat'] = float(data.get('ubicacion_destino_lat')) if data.get('ubicacion_destino_lat') is not None else None
        data['ubicacion_destino_lon'] = float(data.get('ubicacion_destino_lon')) if data.get('ubicacion_destino_lon') is not None else None
        
        data['estado'] = data.get('estado', 'pendiente').lower()
        data['conductor_id'] = data.get('conductor_id', None)
        data['conductor_nombre'] = data.get('conductor_nombre', None)
        data['fecha_solicitud'] = firestore.SERVER_TIMESTAMP
        data['fecha_asignacion'] = data.get('fecha_asignacion', None)
        data['notas'] = data.get('notas', '')

        doc_ref = db.collection('viajes').add(data)
        return jsonify({"id": doc_ref[1].id, "message": "Viaje añadido exitosamente"}), 201
    except ValueError as e:
        print(f"Error de validación de datos al añadir viaje: {e}")
        return jsonify({"error": f"Datos de latitud/longitud inválidos: {e}"}), 400
    except Exception as e:
        print(f"Error al añadir viaje: {e}")
        return jsonify({"error": "Error interno del servidor al añadir viaje"}), 500

@app.route('/viajes/<string:viaje_id>', methods=['PUT'])
def update_viaje(viaje_id):
    """
    Actualiza la información de un viaje específico en Firestore.
    Requiere el ID del viaje en la URL y los datos a actualizar en el cuerpo de la petición JSON.
    Permite actualizar campos como estado, conductor, ubicaciones, etc.
    """
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400

        viaje_ref = db.collection('viajes').document(viaje_id)
        if not viaje_ref.get().exists:
            return jsonify({"error": f"Viaje con ID '{viaje_id}' no encontrado"}), 404

        # Convertir lat/lon a float si están presentes en la actualización
        if 'ubicacion_origen_lat' in data and data['ubicacion_origen_lat'] is not None:
            data['ubicacion_origen_lat'] = float(data['ubicacion_origen_lat'])
        if 'ubicacion_origen_lon' in data and data['ubicacion_origen_lon'] is not None:
            data['ubicacion_origen_lon'] = float(data['ubicacion_origen_lon'])
        if 'ubicacion_destino_lat' in data and data['ubicacion_destino_lat'] is not None:
            data['ubicacion_destino_lat'] = float(data['ubicacion_destino_lat'])
        if 'ubicacion_destino_lon' in data and data['ubicacion_destino_lon'] is not None:
            data['ubicacion_destino_lon'] = float(data['ubicacion_destino_lon'])
        
        # Si se asigna un conductor, actualizar la fecha de asignación si no existe
        if 'conductor_id' in data and data['conductor_id'] is not None:
            current_viaje = viaje_ref.get().to_dict()
            if not current_viaje.get('fecha_asignacion'):
                data['fecha_asignacion'] = firestore.SERVER_TIMESTAMP
            
        # Asegurarse de que el estado esté en minúsculas si se actualiza
        if 'estado' in data:
            data['estado'] = data['estado'].lower()

        viaje_ref.update(data)
        return jsonify({"message": f"Viaje '{viaje_id}' actualizado exitosamente"}), 200
    except ValueError as e:
        print(f"Error de validación de datos al actualizar viaje: {e}")
        return jsonify({"error": f"Datos de latitud/longitud inválidos en la actualización: {e}"}), 400
    except Exception as e:
        print(f"Error al actualizar viaje '{viaje_id}': {e}")
        return jsonify({"error": "Error interno del servidor al actualizar viaje"}), 500

@app.route('/viajes/<string:viaje_id>', methods=['DELETE'])
def delete_viaje(viaje_id):
    """
    Elimina un viaje específico de Firestore.
    Requiere el ID del viaje en la URL.
    """
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        viaje_ref = db.collection('viajes').document(viaje_id)
        if not viaje_ref.get().exists:
            return jsonify({"error": f"Viaje con ID '{viaje_id}' no encontrado"}), 404

        viaje_ref.delete()
        return jsonify({"message": f"Viaje '{viaje_id}' eliminado exitosamente"}), 200
    except Exception as e:
        print(f"Error al eliminar viaje '{viaje_id}': {e}")
        return jsonify({"error": "Error interno del servidor al eliminar viaje"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
