from flask import Flask, request, jsonify, g
from flask_cors import CORS
import firebase_admin
from firebase_admin import exceptions as firebase_exceptions
import os
from functools import wraps
from google.cloud.firestore import SERVER_TIMESTAMP
from google.cloud.firestore import FieldFilter
import re

from firebase_admin import credentials, firestore, auth # ¡Importante! Añade 'auth'
# Importamos la clase FieldFilter para usar la sintaxis moderna

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
    except Exception as e:
        print(f"ERROR FATAL al inicializar Firebase Admin SDK: {e}")

try:
    db = firestore.client()
    print("Firestore client inicializado.")
except NameError:
    print("Firestore client no pudo ser inicializado. Las operaciones de base de datos fallarán.")
    db = None

app = Flask(__name__)
CORS(app) 

# --- Constantes y Utilidades ---
ALLOWED_VEHICLE_TYPES = ['Mototaxi', 'Bicitaxi', 'Taxi (particular)', 'Motocarga']
PHONE_REGEX = r'^\d{7,15}$'

def _validate_phone(phone_number):
    return re.match(PHONE_REGEX, str(phone_number))

def _handle_timestamp(data, field_name):
    """
    Convierte un objeto Timestamp de Firestore a una cadena de texto ISO 8601 si el campo existe
    y es un objeto Timestamp.
    """
    if field_name in data and hasattr(data[field_name], 'isoformat'):
        data[field_name] = data[field_name].isoformat()
    return data

# --- Decorador para Autenticación de Firebase (Middleware) ---
def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if db is None:
            return jsonify({"error": "Base de datos no disponible. El servidor no pudo inicializar Firebase."}), 503
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Acceso denegado: Token de autenticación no proporcionado o formato inválido."}), 401
        id_token = auth_header.split('Bearer ')[1]
        try:
            claims = auth.verify_id_token(id_token)
            g.user_claims = claims
            g.uid = claims['uid']
        except firebase_exceptions.AuthError as e:
            print(f"Error de autenticación de Firebase: {e}")
            return jsonify({"error": f"Acceso denegado: Token inválido o expirado. Código: {e.code}"}), 401
        except Exception as e:
            print(f"Error inesperado en la verificación del token: {e}")
            return jsonify({"error": "Error interno del servidor al verificar la autenticación."}), 500
        return f(*args, **kwargs)
    return decorated_function

# --- Rutas de API para Conductores (Drivers) ---
@app.route('/drivers', methods=['GET'])
# @auth_required
def get_drivers():
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        drivers_ref = db.collection('drivers')
        query = drivers_ref.limit(100)
        nombre_filter = request.args.get('nombre', '').lower()
        telefono_filter = request.args.get('telefono', '').lower()
        tipo_vehiculo_filter = request.args.get('tipoVehiculo', '').lower()
        activo_filter = request.args.get('activo')
        all_drivers = []
        for doc in query.stream():
            driver_data = doc.to_dict()
            driver_data['id'] = doc.id
            driver_data['activo'] = driver_data.get('activo', True)
            match = True
            if nombre_filter and nombre_filter not in driver_data.get('nombre', '').lower():
                match = False
            if telefono_filter and telefono_filter not in driver_data.get('telefono', '').lower():
                match = False
            if tipo_vehiculo_filter and tipo_vehiculo_filter not in driver_data.get('tipoVehiculo', '').lower():
                match = False
            if activo_filter is not None:
                expected_active = activo_filter.lower() == 'true'
                if driver_data.get('activo') != expected_active:
                    match = False
            if match:
                driver_data = _handle_timestamp(driver_data, 'fecha_creacion')
                driver_data = _handle_timestamp(driver_data, 'fecha_actualizacion')
                all_drivers.append(driver_data)
        return jsonify(all_drivers), 200
    except Exception as e:
        print(f"Error al obtener conductores: {e}")
        return jsonify({"error": "Error interno del servidor al obtener conductores"}), 500

@app.route('/drivers', methods=['POST'])
@auth_required
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
                return jsonify({"error": f"Falta el campo obligatorio: '{field}' o está vacío."}), 400
        if not _validate_phone(data['telefono']):
            return jsonify({"error": "El teléfono debe contener solo números (7-15 dígitos)."}), 400
        if data['tipoVehiculo'] not in ALLOWED_VEHICLE_TYPES:
            return jsonify({"error": f"Tipo de vehículo no válido. Opciones permitidas: {', '.join(ALLOWED_VEHICLE_TYPES)}"}), 400
        driver_to_add = {
            'nombre': data['nombre'],
            'telefono': data['telefono'],
            'tipoVehiculo': data['tipoVehiculo'],
            'activo': data.get('activo', True),
            'fecha_creacion': SERVER_TIMESTAMP,
            'fecha_actualizacion': SERVER_TIMESTAMP
        }
        doc_ref = db.collection('drivers').add(driver_to_add)
        
        driver_to_add['id'] = doc_ref[1].id
        
        # Convierte Timestamps a ISO para la respuesta
        driver_to_add = _handle_timestamp(driver_to_add, 'fecha_creacion')
        driver_to_add = _handle_timestamp(driver_to_add, 'fecha_actualizacion')
        
        return jsonify({"id": doc_ref[1].id, "message": "Conductor añadido exitosamente", "data": driver_to_add}), 201
    except Exception as e:
        print(f"Error al añadir conductor: {e}")
        return jsonify({"error": "Error interno del servidor al añadir conductor"}), 500

@app.route('/drivers/<string:driver_id>', methods=['PUT'])
@auth_required
def update_driver(driver_id):
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400
        driver_ref = db.collection('drivers').document(driver_id)
        if not driver_ref.get().exists:
            return jsonify({"error": f"Conductor con ID '{driver_id}' no encontrado"}), 404
        update_data = {}
        if 'nombre' in data and data['nombre']:
            update_data['nombre'] = data['nombre']
        if 'telefono' in data and data['telefono']:
            if not _validate_phone(data['telefono']):
                return jsonify({"error": "El teléfono debe contener solo números (7-15 dígitos)."}), 400
            update_data['telefono'] = data['telefono']
        if 'tipoVehiculo' in data and data['tipoVehiculo']:
            if data['tipoVehiculo'] not in ALLOWED_VEHICLE_TYPES:
                return jsonify({"error": f"Tipo de vehículo no válido. Opciones permitidas: {', '.join(ALLOWED_VEHICLE_TYPES)}"}), 400
            update_data['tipoVehiculo'] = data['tipoVehiculo']
        if 'activo' in data and isinstance(data['activo'], bool):
            update_data['activo'] = data['activo']
        update_data['fecha_actualizacion'] = SERVER_TIMESTAMP
        if not update_data:
            return jsonify({"message": "No hay datos válidos para actualizar."}), 200
        driver_ref.update(update_data)
        updated_driver_doc = driver_ref.get().to_dict()
        updated_driver_doc['id'] = driver_id
        updated_driver_doc = _handle_timestamp(updated_driver_doc, 'fecha_creacion')
        updated_driver_doc = _handle_timestamp(updated_driver_doc, 'fecha_actualizacion')
        return jsonify({"message": f"Conductor '{driver_id}' actualizado exitosamente", "data": updated_driver_doc}), 200
    except Exception as e:
        print(f"Error al actualizar conductor '{driver_id}': {e}")
        return jsonify({"error": "Error interno del servidor al actualizar conductor"}), 500

@app.route('/drivers/<string:driver_id>', methods=['DELETE'])
@auth_required
def delete_driver(driver_id):
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        driver_ref = db.collection('drivers').document(driver_id)
        if not driver_ref.get().exists:
            return jsonify({"error": f"Conductor con ID '{driver_id}' no encontrado"}), 404
        driver_ref.delete()
        return jsonify({"message": f"Conductor '{driver_id}' eliminado exitosamente."}), 200
    except Exception as e:
        print(f"Error al eliminar conductor '{driver_id}': {e}")
        return jsonify({"error": "Error interno del servidor al eliminar conductor"}), 500

# --- Rutas de API para Viajes (Travels) ---
@app.route('/viajes', methods=['GET'])
# @auth_required
def get_viajes():
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        viajes_ref = db.collection('viajes')
        query = viajes_ref.limit(100)
        pasajero_nombre_filter = request.args.get('pasajero_nombre', '').lower()
        estado_filter = request.args.get('estado', '').lower()
        conductor_nombre_filter = request.args.get('conductor_nombre', '').lower()
        if estado_filter:
            # FIX: Se actualiza la sintaxis de `where` para usar FieldFilter y evitar el UserWarning
            query = query.where(FieldFilter('estado', '==', estado_filter))
        all_viajes = []
        for doc in query.stream():
            viaje_data = doc.to_dict()
            viaje_data['id'] = doc.id
            viaje_data = _handle_timestamp(viaje_data, 'fecha_solicitud')
            viaje_data = _handle_timestamp(viaje_data, 'fecha_asignacion')
            viaje_data = _handle_timestamp(viaje_data, 'fecha_actualizacion')
            viaje_data = _handle_timestamp(viaje_data, 'fecha_finalizacion')
            match = True
            if pasajero_nombre_filter and pasajero_nombre_filter not in viaje_data.get('pasajero_nombre', '').lower():
                match = False
            if conductor_nombre_filter and conductor_nombre_filter not in viaje_data.get('conductor_nombre', '').lower():
                match = False
            if match:
                all_viajes.append(viaje_data)
        return jsonify(all_viajes), 200
    except Exception as e:
        print(f"Error al obtener viajes: {e}")
        return jsonify({"error": "Error interno del servidor al obtener viajes"}), 500

@app.route('/viajes', methods=['POST'])
@auth_required
def add_viaje():
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400
        if not data.get('pasajero_nombre'):
            return jsonify({"error": "Falta el nombre del pasajero."}), 400
        if not (data.get('ubicacion_origen_texto') or 
                (data.get('ubicacion_origen_lat') is not None and data.get('ubicacion_origen_lon') is not None)):
            return jsonify({"error": "Debe proporcionar una ubicación de origen (texto o coordenadas GPS)."}), 400
        if 'pasajero_telefono' in data and not _validate_phone(data['pasajero_telefono']):
            return jsonify({"error": "El teléfono del pasajero debe contener solo números (7-15 dígitos)."}), 400
        data['ubicacion_origen_lat'] = float(data['ubicacion_origen_lat']) if data.get('ubicacion_origen_lat') not in [None, ''] else None
        data['ubicacion_origen_lon'] = float(data['ubicacion_origen_lon']) if data.get('ubicacion_origen_lon') not in [None, ''] else None
        data['ubicacion_destino_lat'] = float(data['ubicacion_destino_lat']) if data.get('ubicacion_destino_lat') not in [None, ''] else None
        data['ubicacion_destino_lon'] = float(data['ubicacion_destino_lon']) if data.get('ubicacion_destino_lon') not in [None, ''] else None
        data['estado'] = data.get('estado', 'pendiente').lower()
        conductor_id_from_data = str(data['conductor_id']) if data.get('conductor_id') not in [None, ''] else None
        conductor_nombre_from_data = data.get('conductor_nombre', None)
        if data['estado'] != 'pendiente' and not conductor_id_from_data:
            return jsonify({"error": 'Si el estado no es "pendiente", debes asignar un conductor (conductor_id).'}), 400
        if conductor_id_from_data:
            conductor_doc = db.collection('drivers').document(conductor_id_from_data).get()
            if not conductor_doc.exists:
                return jsonify({"error": f"El conductor con ID '{conductor_id_from_data}' no existe."}), 400
            conductor_nombre_from_data = conductor_doc.to_dict().get('nombre')
        travel_to_add = {
            'pasajero_nombre': data['pasajero_nombre'],
            'pasajero_telefono': data.get('pasajero_telefono'),
            'ubicacion_origen_texto': data.get('ubicacion_origen_texto'),
            'ubicacion_origen_lat': data['ubicacion_origen_lat'],
            'ubicacion_origen_lon': data['ubicacion_origen_lon'],
            'ubicacion_destino_texto': data.get('ubicacion_destino_texto'),
            'ubicacion_destino_lat': data['ubicacion_destino_lat'],
            'ubicacion_destino_lon': data['ubicacion_destino_lon'],
            'estado': data['estado'],
            'conductor_id': conductor_id_from_data,
            'conductor_nombre': conductor_nombre_from_data,
            'notas': data.get('notas', ''),
            'fecha_solicitud': SERVER_TIMESTAMP,
            'fecha_asignacion': SERVER_TIMESTAMP if conductor_id_from_data else None,
            'fecha_actualizacion': SERVER_TIMESTAMP,
            'fecha_finalizacion': SERVER_TIMESTAMP if data['estado'] == 'completado' else None
        }
        doc_ref = db.collection('viajes').add(travel_to_add)
        travel_to_add['id'] = doc_ref[1].id 
        
        travel_to_add = _handle_timestamp(travel_to_add, 'fecha_solicitud')
        travel_to_add = _handle_timestamp(travel_to_add, 'fecha_asignacion')
        travel_to_add = _handle_timestamp(travel_to_add, 'fecha_actualizacion')
        travel_to_add = _handle_timestamp(travel_to_add, 'fecha_finalizacion')
        
        return jsonify({"message": "Viaje añadido exitosamente", "data": travel_to_add}), 201
    except ValueError as e:
        print(f"Error de validación de datos al añadir viaje: {e}")
        return jsonify({"error": f"Datos numéricos inválidos (latitud/longitud): {e}"}), 400
    except Exception as e:
        print(f"Error al añadir viaje: {e}")
        return jsonify({"error": f"Error interno del servidor al añadir viaje: {e}"}), 500

@app.route('/viajes/<string:viaje_id>', methods=['PUT'])
@auth_required
def update_viaje(viaje_id):
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400
        viaje_ref = db.collection('viajes').document(viaje_id)
        current_viaje = viaje_ref.get()
        if not current_viaje.exists:
            return jsonify({"error": f"Viaje con ID '{viaje_id}' no encontrado"}), 404
        current_viaje_data = current_viaje.to_dict()
        update_data = {}
        fields_to_update = [
            'pasajero_nombre', 'pasajero_telefono', 'ubicacion_origen_texto', 
            'ubicacion_destino_texto', 'notas', 'estado', 'conductor_id', 'conductor_nombre',
            'ubicacion_origen_lat', 'ubicacion_origen_lon', 'ubicacion_destino_lat', 'ubicacion_destino_lon'
        ]
        for field in fields_to_update:
            if field in data:
                value = data[field]
                if 'lat' in field or 'lon' in field:
                    if value is None or value == '' or value == 'null':
                        update_data[field] = None
                    else:
                        try:
                            update_data[field] = float(value)
                        except (ValueError, TypeError):
                            return jsonify({"error": f"Coordenada '{field}' inválida. Debe ser un número."}), 400
                elif value == '' or value == 'null':
                    update_data[field] = None
                elif field == 'pasajero_telefono':
                    if not _validate_phone(value):
                        return jsonify({"error": "El teléfono del pasajero debe contener solo números (7-15 dígitos)."}), 400
                    update_data[field] = value
                elif field == 'estado':
                    update_data[field] = value.lower()
                elif field == 'conductor_id':
                    update_data[field] = str(value) if value is not None else None
                else:
                    update_data[field] = value
        old_conductor_id = current_viaje_data.get('conductor_id')
        new_conductor_id = update_data.get('conductor_id', old_conductor_id)
        if new_conductor_id and new_conductor_id != old_conductor_id:
            conductor_doc = db.collection('drivers').document(new_conductor_id).get()
            if not conductor_doc.exists:
                return jsonify({"error": f"El conductor con ID '{new_conductor_id}' no existe."}), 400
            update_data['conductor_nombre'] = conductor_doc.to_dict().get('nombre')
            update_data['fecha_asignacion'] = SERVER_TIMESTAMP
        elif not new_conductor_id and old_conductor_id:
            update_data['conductor_nombre'] = None
            update_data['fecha_asignacion'] = None
        current_estado = current_viaje_data.get('estado')
        new_estado = update_data.get('estado', current_estado)
        if new_estado != 'pendiente' and not new_conductor_id:
            return jsonify({"error": 'Si el estado no es "pendiente", debes asignar un conductor (conductor_id).'}), 400
        old_estado = current_viaje_data.get('estado')
        if new_estado == 'completado' and old_estado != 'completado':
            update_data['fecha_finalizacion'] = SERVER_TIMESTAMP
        elif new_estado != 'completado' and old_estado == 'completado':
            update_data['fecha_finalizacion'] = None
        update_data['fecha_actualizacion'] = SERVER_TIMESTAMP
        if not update_data:
            return jsonify({"message": "No hay datos válidos para actualizar."}), 200
        viaje_ref.update(update_data)
        updated_travel = viaje_ref.get().to_dict()
        updated_travel['id'] = viaje_id
        updated_travel = _handle_timestamp(updated_travel, 'fecha_solicitud')
        updated_travel = _handle_timestamp(updated_travel, 'fecha_asignacion')
        updated_travel = _handle_timestamp(updated_travel, 'fecha_actualizacion')
        updated_travel = _handle_timestamp(updated_travel, 'fecha_finalizacion')
        return jsonify({"message": f"Viaje '{viaje_id}' actualizado exitosamente", "data": updated_travel}), 200
    except ValueError as e:
        print(f"Error de validación de datos al actualizar viaje: {e}")
        return jsonify({"error": f"Datos inválidos en la actualización: {e}"}), 400
    except Exception as e:
        print(f"Error al actualizar viaje '{viaje_id}': {e}")
        return jsonify({"error": f"Error interno del servidor al actualizar viaje: {e}"}), 500

@app.route('/viajes/<string:viaje_id>', methods=['DELETE'])
@auth_required
def delete_viaje(viaje_id):
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        viaje_ref = db.collection('viajes').document(viaje_id)
        if not viaje_ref.get().exists:
            return jsonify({"error": f"Viaje con ID '{viaje_id}' no encontrado"}), 404
        viaje_ref.delete()
        return jsonify({"message": f"Viaje '{viaje_id}' eliminado exitosamente."}), 200
    except Exception as e:
        print(f"Error al eliminar viaje '{viaje_id}': {e}")
        return jsonify({"error": "Error interno del servidor al eliminar viaje"}), 500

@app.route('/users/set_role', methods=['POST'])
@auth_required
def set_user_role():
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    if not g.user_claims.get('role') == 'admin':
        return jsonify({"error": "Acceso denegado: Solo los administradores pueden asignar roles."}), 403
    try:
        data = request.json
        uid = data.get('uid')
        role = data.get('role')
        if not uid or not role:
            return jsonify({"error": "Se requieren 'uid' y 'role'."}), 400
        allowed_roles = ['admin', 'operator', 'driver', 'ceo', 'passenger']
        if role not in allowed_roles:
            return jsonify({"error": f"Rol '{role}' no permitido. Roles válidos: {', '.join(allowed_roles)}."}), 400
        user = auth.get_user(uid)
        auth.set_custom_user_claims(uid, {'role': role})
        print(f"Rol '{role}' asignado a usuario {uid} ({user.email}).")
        return jsonify({"message": f"Rol '{role}' asignado a usuario '{uid}' exitosamente."}), 200
    except auth.UserNotFoundError:
        print(f"Usuario con UID {uid} no encontrado.")
        return jsonify({"error": f"Usuario con ID '{uid}' no encontrado."}), 404
    except Exception as e:
        print(f"Error al asignar rol a usuario {uid}: {e}")
        return jsonify({"error": "Error interno del servidor al asignar rol."}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        id_token = data.get('idToken')
        if not id_token:
            return jsonify({"error": "Token de ID no proporcionado."}), 400
        claims = auth.verify_id_token(id_token)
        uid = claims['uid']
        return jsonify({
            "message": "Autenticación exitosa",
            "uid": uid,
            "email": claims.get('email'),
            "role": claims.get('role', 'none'),
        }), 200
    except firebase_exceptions.AuthError as e:
        print(f"Error de autenticación: {e.code} - {e.ak_error_code if hasattr(e, 'ak_error_code') else ''}")
        return jsonify({"error": f"Error de autenticación: {e.code}. Por favor, inicie sesión de nuevo."}), 401
    except Exception as e:
        print(f"Error durante el proceso de login: {e}")
        return jsonify({"error": "Error interno del servidor durante el login."}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)