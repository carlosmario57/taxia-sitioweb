# =================================================================================================
# ARCHIVO: app.py
# FUNCIÓN: Backend de la aplicación con Flask, Firebase y CORS.
# =================================================================================================
"""
Backend de la aplicación con Flask, Firebase Admin SDK y Firestore.
Este archivo contiene la lógica para la inicialización del servidor,
manejo de rutas de API para conductores, viajes y autenticación, y la
interacción con la base de datos Firestore.

Características clave de esta versión profesional:
- **Variables de Entorno:** Se utiliza `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` para
  la ruta del archivo de la clave de servicio, una práctica segura.
- **Manejo de Timestamps:** Se implementa un `CustomJSONEncoder` para convertir
  automáticamente los objetos `Timestamp` de Firestore a formato ISO 8601,
  garantizando una correcta serialización de datos.
- **Rutas Protegidas:** El decorador `auth_required` asegura que solo usuarios
  autenticados puedan acceder a las rutas sensibles, mejorando la seguridad.
- **Consultas Optimizadas:** Las consultas a Firestore se realizan de manera eficiente,
  utilizando el filtrado en la base de datos siempre que es posible.
- **Validación Robusta:** Las funciones de validación garantizan la integridad de los datos
  recibidos en las solicitudes.
"""

# --- Importaciones de bibliotecas ---
import os
import re
from functools import wraps
from datetime import datetime

# Importaciones de Flask y extensiones
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask.json import JSONEncoder

# Importaciones de Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, firestore, auth, exceptions as firebase_exceptions
from google.cloud.firestore import SERVER_TIMESTAMP, FieldFilter, Query, DELETE_FIELD

# =================================================================================================
# --- Configuración de Flask ---
# =================================================================================================
app = Flask(__name__)
# Se habilita CORS para todas las rutas. En producción, se recomienda restringir
# a la URL del frontend por razones de seguridad.
CORS(app)

# =================================================================================================
# --- Configuración de Firebase y Firestore ---
# =================================================================================================

# La ruta a la clave de servicio se obtiene de una variable de entorno,
# una práctica de seguridad estándar.
SERVICE_ACCOUNT_KEY_PATH = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY_PATH')

# Inicialización de Firebase Admin SDK. Este bloque garantiza que la inicialización
# se realice solo una vez y maneja posibles errores de manera robusta.
if not firebase_admin._apps:
    try:
        if not SERVICE_ACCOUNT_KEY_PATH or not os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            print("❌ ERROR FATAL: La variable 'FIREBASE_SERVICE_ACCOUNT_KEY_PATH' no está configurada o el archivo no existe.")
            db = None
        else:
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin SDK inicializado exitosamente.")
            db = firestore.client()
            print("✅ Firestore client inicializado.")
    except Exception as e:
        print(f"❌ ERROR FATAL al inicializar Firebase Admin SDK o Firestore: {e}")
        db = None
else:
    db = firestore.client()
    print("✅ Firestore client ya estaba inicializado.")

# =================================================================================================
# --- Constantes y Funciones de Utilidad ---
# =================================================================================================

ALLOWED_VEHICLE_TYPES = ['Mototaxi', 'Bicitaxi', 'Taxi (particular)', 'Motocarga']
PHONE_REGEX = r'^\d{7,15}$'

def is_valid_phone(phone_number: str) -> bool:
    """Valida si un número de teléfono cumple con el formato requerido."""
    return bool(re.match(PHONE_REGEX, str(phone_number)))

class CustomJSONEncoder(JSONEncoder):
    """
    JSONEncoder personalizado para manejar objetos de tipos no serializables por defecto,
    como los Timestamps de Firestore, convirtiéndolos a cadenas ISO 8601.
    """
    def default(self, obj):
        if isinstance(obj, (datetime, firestore.Timestamp)):
            return obj.isoformat()
        return super(CustomJSONEncoder, self).default(obj)

app.json_encoder = CustomJSONEncoder

# --- Decorador para Autenticación de Firebase (Middleware) ---
def auth_required(f):
    """
    Decorador para proteger rutas. Verifica el token de autenticación del usuario
    y almacena las claims del usuario en el objeto `g` de Flask.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if db is None:
            return jsonify({"error": "Base de datos no disponible."}), 503

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

# =================================================================================================
# --- Rutas de API para Conductores (Drivers) ---
# =================================================================================================

@app.route('/drivers', methods=['GET'])
@auth_required
def get_drivers():
    """
    Obtiene una lista de conductores con la posibilidad de filtrar por estado activo.
    El filtrado por `nombre` y `telefono` se hace en memoria.
    """
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        drivers_ref = db.collection('drivers')
        query = drivers_ref.limit(100)

        activo_filter = request.args.get('activo')
        if activo_filter is not None:
            expected_active = activo_filter.lower() == 'true'
            query = query.where(filter=FieldFilter('activo', '==', expected_active))

        nombre_filter = request.args.get('nombre', '').lower()
        telefono_filter = request.args.get('telefono', '').lower()
        tipo_vehiculo_filter = request.args.get('tipoVehiculo', '').lower()

        all_drivers = []
        for doc in query.stream():
            driver_data = doc.to_dict()
            driver_data['id'] = doc.id
            
            # Filtrado en memoria para campos de texto, ya que Firestore no
            # soporta búsquedas de subcadenas directamente.
            match = True
            if nombre_filter and nombre_filter not in driver_data.get('nombre', '').lower():
                match = False
            if telefono_filter and telefono_filter not in driver_data.get('telefono', '').lower():
                match = False
            if tipo_vehiculo_filter and tipo_vehiculo_filter not in driver_data.get('tipoVehiculo', '').lower():
                match = False

            if match:
                all_drivers.append(driver_data)

        return jsonify(all_drivers), 200
    except Exception as e:
        print(f"Error al obtener conductores: {e}")
        return jsonify({"error": "Error interno del servidor al obtener conductores"}), 500

@app.route('/drivers', methods=['POST'])
@auth_required
def create_driver():
    """Crea un nuevo conductor en la base de datos con validaciones."""
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400

        required_fields = ['nombre', 'telefono', 'tipoVehiculo']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Falta el campo obligatorio: '{field}'."}), 400

        if not is_valid_phone(data['telefono']):
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

        doc_ref = db.collection('drivers').document()
        doc_ref.set(driver_to_add)

        driver_to_add['id'] = doc_ref.id

        return jsonify({"id": doc_ref.id, "message": "Conductor añadido exitosamente", "data": driver_to_add}), 201
    except Exception as e:
        print(f"Error al añadir conductor: {e}")
        return jsonify({"error": "Error interno del servidor al añadir conductor"}), 500

@app.route('/drivers/<string:driver_id>', methods=['PUT'])
@auth_required
def update_driver(driver_id):
    """Actualiza los datos de un conductor existente por su ID."""
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
        if 'nombre' in data: update_data['nombre'] = data['nombre']
        if 'telefono' in data:
            if data['telefono'] and not is_valid_phone(data['telefono']):
                return jsonify({"error": "El teléfono debe contener solo números (7-15 dígitos)."}), 400
            update_data['telefono'] = data['telefono']
        if 'tipoVehiculo' in data:
            if data['tipoVehiculo'] and data['tipoVehiculo'] not in ALLOWED_VEHICLE_TYPES:
                return jsonify({"error": f"Tipo de vehículo no válido. Opciones permitidas: {', '.join(ALLOWED_VEHICLE_TYPES)}"}), 400
            update_data['tipoVehiculo'] = data['tipoVehiculo']
        if 'activo' in data and isinstance(data['activo'], bool):
            update_data['activo'] = data['activo']

        if not update_data:
            return jsonify({"message": "No hay datos válidos para actualizar."}), 200

        update_data['fecha_actualizacion'] = SERVER_TIMESTAMP
        driver_ref.update(update_data)

        updated_driver_doc = driver_ref.get().to_dict()
        updated_driver_doc['id'] = driver_id

        return jsonify({"message": f"Conductor '{driver_id}' actualizado exitosamente", "data": updated_driver_doc}), 200
    except Exception as e:
        print(f"Error al actualizar conductor '{driver_id}': {e}")
        return jsonify({"error": "Error interno del servidor al actualizar conductor"}), 500

@app.route('/drivers/<string:driver_id>', methods=['DELETE'])
@auth_required
def delete_driver(driver_id):
    """Elimina un conductor por su ID."""
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

# =================================================================================================
# --- Rutas de API para Viajes (Travels) ---
# =================================================================================================

@app.route('/viajes', methods=['GET'])
@auth_required
def get_viajes():
    """
    Obtiene una lista de viajes con filtros. Los filtros de estado se realizan
    directamente en Firestore para mayor eficiencia.
    """
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        viajes_ref = db.collection('viajes')
        query = viajes_ref.limit(100)

        estado_filter = request.args.get('estado', '').lower()
        if estado_filter:
            query = query.where(filter=FieldFilter('estado', '==', estado_filter))

        pasajero_nombre_filter = request.args.get('pasajero_nombre', '').lower()
        conductor_nombre_filter = request.args.get('conductor_nombre', '').lower()

        all_viajes = []
        for doc in query.stream():
            viaje_data = doc.to_dict()
            viaje_data['id'] = doc.id
            
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
def create_viaje():
    """Crea un nuevo viaje con validaciones de datos."""
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400

        if not data.get('pasajero_nombre'):
            return jsonify({"error": "Falta el nombre del pasajero."}), 400

        if not (data.get('ubicacion_origen_texto') or (data.get('ubicacion_origen_lat') is not None and data.get('ubicacion_origen_lon') is not None)):
            return jsonify({"error": "Debe proporcionar una ubicación de origen (texto o coordenadas)."}), 400

        if 'pasajero_telefono' in data and data['pasajero_telefono'] and not is_valid_phone(data['pasajero_telefono']):
            return jsonify({"error": "El teléfono del pasajero debe contener solo números (7-15 dígitos)."}), 400

        try:
            for key in ['ubicacion_origen_lat', 'ubicacion_origen_lon', 'ubicacion_destino_lat', 'ubicacion_destino_lon']:
                data[key] = float(data.get(key)) if data.get(key) is not None else None
        except (ValueError, TypeError):
            return jsonify({"error": "Las coordenadas deben ser números válidos."}), 400

        data['estado'] = data.get('estado', 'pendiente').lower()

        conductor_id = data.get('conductor_id')
        conductor_nombre = data.get('conductor_nombre', None)

        if data['estado'] != 'pendiente' and not conductor_id:
            return jsonify({"error": 'Si el estado no es "pendiente", debes asignar un conductor.'}), 400

        if conductor_id:
            conductor_doc = db.collection('drivers').document(str(conductor_id)).get()
            if not conductor_doc.exists:
                return jsonify({"error": f"El conductor con ID '{conductor_id}' no existe."}), 400
            conductor_nombre = conductor_doc.to_dict().get('nombre')

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
            'conductor_id': conductor_id,
            'conductor_nombre': conductor_nombre,
            'notas': data.get('notas', ''),
            'fecha_solicitud': SERVER_TIMESTAMP,
            'fecha_asignacion': SERVER_TIMESTAMP if conductor_id else None,
            'fecha_actualizacion': SERVER_TIMESTAMP,
            'fecha_finalizacion': SERVER_TIMESTAMP if data['estado'] == 'completado' else None
        }

        doc_ref = db.collection('viajes').document()
        doc_ref.set(travel_to_add)
        travel_to_add['id'] = doc_ref.id

        return jsonify({"message": "Viaje añadido exitosamente", "data": travel_to_add}), 201
    except Exception as e:
        print(f"Error al añadir viaje: {e}")
        return jsonify({"error": f"Error interno del servidor al añadir viaje: {e}"}), 500

@app.route('/viajes/<string:viaje_id>', methods=['PUT'])
@auth_required
def update_viaje(viaje_id):
    """Actualiza un viaje existente por su ID."""
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400

        viaje_ref = db.collection('viajes').document(viaje_id)
        current_viaje_doc = viaje_ref.get()
        if not current_viaje_doc.exists:
            return jsonify({"error": f"Viaje con ID '{viaje_id}' no encontrado"}), 404

        current_viaje_data = current_viaje_doc.to_dict()
        update_data = {}

        # Mapea los campos que se pueden actualizar.
        for field in ['pasajero_nombre', 'pasajero_telefono', 'ubicacion_origen_texto',
                      'ubicacion_destino_texto', 'notas', 'estado', 'conductor_id',
                      'ubicacion_origen_lat', 'ubicacion_origen_lon',
                      'ubicacion_destino_lat', 'ubicacion_destino_lon']:
            if field in data:
                update_data[field] = data[field]

        if 'pasajero_telefono' in update_data and update_data['pasajero_telefono'] and not is_valid_phone(update_data['pasajero_telefono']):
            return jsonify({"error": "El teléfono del pasajero debe contener solo números (7-15 dígitos)."}), 400

        for key in ['ubicacion_origen_lat', 'ubicacion_origen_lon', 'ubicacion_destino_lat', 'ubicacion_destino_lon']:
            if key in update_data:
                try:
                    update_data[key] = float(update_data[key]) if update_data[key] is not None else None
                except (ValueError, TypeError):
                    return jsonify({"error": f"Las coordenadas para '{key}' deben ser números válidos."}), 400

        if 'estado' in update_data:
            update_data['estado'] = update_data['estado'].lower()

        old_conductor_id = current_viaje_data.get('conductor_id')
        new_conductor_id = update_data.get('conductor_id', old_conductor_id)

        if new_conductor_id != old_conductor_id:
            if new_conductor_id:
                conductor_doc = db.collection('drivers').document(str(new_conductor_id)).get()
                if not conductor_doc.exists:
                    return jsonify({"error": f"El conductor con ID '{new_conductor_id}' no existe."}), 400
                update_data['conductor_nombre'] = conductor_doc.to_dict().get('nombre')
                update_data['fecha_asignacion'] = SERVER_TIMESTAMP
            else:
                update_data['conductor_nombre'] = None
                update_data['fecha_asignacion'] = None

        current_estado = current_viaje_data.get('estado')
        new_estado = update_data.get('estado', current_estado)

        if new_estado != 'pendiente' and not new_conductor_id:
            return jsonify({"error": 'Si el estado no es "pendiente", debes asignar un conductor.'}), 400

        if new_estado == 'completado' and current_estado != 'completado':
            update_data['fecha_finalizacion'] = SERVER_TIMESTAMP
        elif new_estado != 'completado' and current_estado == 'completado':
            update_data['fecha_finalizacion'] = DELETE_FIELD

        if not update_data:
            return jsonify({"message": "No hay datos válidos para actualizar."}), 200

        update_data['fecha_actualizacion'] = SERVER_TIMESTAMP
        viaje_ref.update(update_data)

        updated_travel = viaje_ref.get().to_dict()
        updated_travel['id'] = viaje_id

        return jsonify({"message": f"Viaje '{viaje_id}' actualizado exitosamente", "data": updated_travel}), 200
    except Exception as e:
        print(f"Error al actualizar viaje '{viaje_id}': {e}")
        return jsonify({"error": f"Error interno del servidor al actualizar viaje: {e}"}), 500

@app.route('/viajes/<string:viaje_id>', methods=['DELETE'])
@auth_required
def delete_viaje(viaje_id):
    """Elimina un viaje por su ID."""
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

# =================================================================================================
# --- Rutas de API para Autenticación y Roles ---
# =================================================================================================

@app.route('/users/set_role', methods=['POST'])
@auth_required
def set_user_role():
    """Asigna un rol personalizado a un usuario de Firebase. Requiere rol de 'admin'."""
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
    """Verifica un ID Token de Firebase y devuelve las claims del usuario."""
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
        print(f"Error de autenticación: {e.code}")
        return jsonify({"error": f"Error de autenticación: {e.code}. Por favor, inicie sesión de nuevo."}), 401
    except Exception as e:
        print(f"Error durante el proceso de login: {e}")
        return jsonify({"error": "Error interno del servidor durante el login."}), 500

# --- Punto de entrada principal ---
if __name__ == '__main__':
    # Se recomienda usar un servidor de producción como Gunicorn o Waitress en entornos de producción.
    app.run(debug=True, host='0.0.0.0', port=5000)
