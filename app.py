import os
import re
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from google.cloud.firestore import SERVER_TIMESTAMP # Importación específica para claridad y para usar SERVER_TIMESTAMP directamente

import firebase_admin
from firebase_admin import credentials, firestore, auth
from firebase_admin import exceptions as firebase_exceptions

# --- 1. Configuración de la Aplicación Flask ---
# Usamos una función para crear la aplicación Flask para una mejor organización,
# especialmente útil en pruebas o si se usa una factoría de aplicaciones.
def create_app():
    app = Flask(__name__)

    # --- 1.1. Configuración de CORS ---
    # Es crucial definir el origen exacto de tu frontend en producción.
    # 'http://localhost:3000' es para desarrollo. En producción, reemplaza con tu dominio.
    # CORS(app, resources={r"/*": {"origins": "http://localhost:3000", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "headers": ["Content-Type", "Authorization"]}})
    # Tu configuración actual de CORS(app) es un wildcard, lo cual es simple para desarrollo pero menos seguro.
    # Dejamos la tuya para mantener la funcionalidad actual, pero ten en cuenta la opción más estricta.
    CORS(app)

    return app

app = create_app()

# --- 2. Inicialización de Firebase Admin SDK ---
# Se recomienda inicializar Firebase fuera de la función create_app si es una singleton.
# La verificación de `firebase_admin._apps` es buena para evitar reinicializaciones en entornos de desarrollo.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_KEY_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")

# Inicializa Firebase Admin SDK solo si no ha sido inicializado antes
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
        # import sys; sys.exit(1) # Descomentar en producción para detener el servidor si falta la clave
    except Exception as e:
        print(f"ERROR FATAL al inicializar Firebase Admin SDK: {e}")
        print("Verifica tu conexión a internet o la configuración de tu proyecto Firebase.")
        # import sys; sys.exit(1) # Descomentar en producción para detener el servidor

# Obtiene una instancia del cliente de Firestore
try:
    db = firestore.client()
    print("Firestore client inicializado.")
except NameError: # Si 'firebase_admin' no se inicializó, 'db' no se definiría
    print("Firestore client no pudo ser inicializado. Las operaciones de base de datos fallarán.")
    db = None # Asegura que 'db' esté definido, aunque sea como None

# --- 3. Constantes y Utilidades ---
# Definición de tipos de vehículo permitidos (sincronizado con frontend)
ALLOWED_VEHICLE_TYPES = ['Mototaxi', 'Bicitaxi', 'Taxi (particular)', 'Motocarga']
PHONE_REGEX = r'^\d{7,15}$' # Regex para 7 a 15 dígitos numéricos

# --- 4. Decorador para Autenticación de Firebase (Middleware) ---
def auth_required(f):
    """
    Decorador que verifica la autenticación de Firebase ID Token en el encabezado 'Authorization'.
    Si el token es válido, decodifica los claims del usuario y los almacena en `g.user_claims` y `g.uid`.
    Retorna 401 (Unauthorized) si el token es inválido o no está presente.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Las pre-flight requests (OPTIONS) son manejadas por Flask-CORS automáticamente.
        # Si tuvieras un CORS más estricto por ruta, podrías necesitar esto:
        # if request.method == 'OPTIONS':
        #     return '', 200

        if db is None:
            return jsonify({"error": "Base de datos no disponible. El servidor no pudo inicializar Firebase."}), 503

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Acceso denegado: Token de autenticación no proporcionado o formato inválido."}), 401 # Unauthorized

        id_token = auth_header.split('Bearer ')[1]

        try:
            # Verificar el token de ID de Firebase
            # Esto también verifica la validez del token (expiración, firma, etc.)
            claims = auth.verify_id_token(id_token)
            g.user_claims = claims # Almacena todos los claims del usuario (incluyendo custom claims como 'role')
            g.uid = claims['uid'] # Almacena el UID del usuario
            # Puedes añadir más como g.email = claims.get('email') si es útil
        except firebase_exceptions.AuthError as e:
            # Captura errores específicos de Firebase Auth para mensajes más claros
            print(f"Error de autenticación de Firebase: {e}")
            return jsonify({"error": f"Acceso denegado: Token inválido o expirado. Código: {e.code}"}), 401
        except Exception as e:
            print(f"Error inesperado en la verificación del token: {e}")
            return jsonify({"error": "Error interno del servidor al verificar la autenticación."}), 500

        return f(*args, **kwargs)
    return decorated_function

# --- 5. Funciones de Ayuda (Helpers) para la API ---
# Centralizan la lógica común para mantener las rutas más limpias.

def _validate_phone(phone_number):
    """Valida el formato del número de teléfono usando la expresión regular definida."""
    return re.match(PHONE_REGEX, str(phone_number))

def _handle_timestamp(data, field_name):
    """
    Convierte un objeto Timestamp de Firestore a una cadena de texto ISO 8601 si el campo existe
    y es un objeto Timestamp.
    """
    if field_name in data and hasattr(data[field_name], 'isoformat'):
        # Verifica si es un objeto Timestamp de Firestore antes de intentar isoformat
        data[field_name] = data[field_name].isoformat()
    return data

def _clean_empty_fields(data, fields_to_clean):
    """
    Convierte cadenas vacías o 'null' a None para campos específicos en un diccionario.
    Útil para limpiar datos antes de guardarlos en Firestore.
    """
    for key in fields_to_clean:
        if key in data and (data[key] == '' or data[key] == 'null'):
            data[key] = None
    return data

# --- 6. Rutas de API para Conductores (Drivers) ---
# Hemos cambiado las rutas a '/drivers' para consistencia con el nombre de la colección.

@app.route('/drivers', methods=['GET'])
# @auth_required # Descomentar si solo usuarios autenticados pueden ver la lista de conductores
def get_drivers():
    """
    Obtiene todos los conductores de la colección 'drivers' en Firestore.
    Permite filtrar por 'nombre', 'telefono', 'tipoVehiculo' y 'activo'.
    Retorna una lista de diccionarios con los datos de los conductores, incluyendo su ID de documento.
    """
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        drivers_ref = db.collection('drivers')
        query = drivers_ref.limit(100) # Limita para evitar sobrecarga, considera paginación en el futuro.

        # Obtiene parámetros de filtro de la URL
        nombre_filter = request.args.get('nombre', '').lower()
        telefono_filter = request.args.get('telefono', '').lower()
        tipo_vehiculo_filter = request.args.get('tipoVehiculo', '').lower()
        activo_filter = request.args.get('activo') # Puede ser 'true', 'false', o None

        all_drivers = []
        for doc in query.stream():
            driver_data = doc.to_dict()
            driver_data['id'] = doc.id
            # Asegura que 'activo' sea un booleano para el filtrado, si existe.
            driver_data['activo'] = driver_data.get('activo', True) # Default a True si no está presente

            # Filtrado en memoria para campos de texto y booleano
            match = True
            if nombre_filter and nombre_filter not in driver_data.get('nombre', '').lower():
                match = False
            if telefono_filter and telefono_filter not in driver_data.get('telefono', '').lower():
                match = False
            if tipo_vehiculo_filter and tipo_vehiculo_filter not in driver_data.get('tipoVehiculo', '').lower():
                match = False # Corregido: tipoVehiculo en lugar de tipo_vehiculo
            if activo_filter is not None:
                expected_active = activo_filter.lower() == 'true'
                if driver_data.get('activo') != expected_active:
                    match = False

            if match:
                # Convierte Timestamps de Firestore a cadenas de texto ISO para la respuesta
                driver_data = _handle_timestamp(driver_data, 'fecha_creacion')
                driver_data = _handle_timestamp(driver_data, 'fecha_actualizacion') # Nuevo campo
                all_drivers.append(driver_data)

        return jsonify(all_drivers), 200
    except Exception as e:
        print(f"Error al obtener conductores: {e}")
        return jsonify({"error": "Error interno del servidor al obtener conductores"}), 500

@app.route('/drivers', methods=['POST'])
@auth_required
def add_driver():
    """
    Añade un nuevo conductor a la colección 'drivers'.
    Requiere autenticación. Realiza validaciones de campos y formato.
    """
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

        # Prepara los datos para Firestore
        driver_to_add = {
            'nombre': data['nombre'],
            'telefono': data['telefono'],
            'tipoVehiculo': data['tipoVehiculo'],
            'activo': data.get('activo', True), # Por defecto a True si no se especifica
            'fecha_creacion': SERVER_TIMESTAMP, # Usamos el Timestamp de Firestore
            'fecha_actualizacion': SERVER_TIMESTAMP # Nuevo campo
        }
        
        doc_ref = db.collection('drivers').add(driver_to_add)
        # Añade el ID del documento al objeto de respuesta para consistencia
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
    """
    Actualiza un conductor existente en la colección 'drivers'.
    Requiere autenticación. Realiza validaciones de campos y formato.
    """
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
        
        # Siempre actualizar la fecha de modificación
        update_data['fecha_actualizacion'] = SERVER_TIMESTAMP

        if not update_data:
            return jsonify({"message": "No hay datos válidos para actualizar."}), 200 # O 400 si se espera siempre algo
            
        driver_ref.update(update_data)
        
        # Recuperar el documento actualizado para devolver la respuesta completa
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
    """
    Elimina un conductor de la colección 'drivers'.
    Requiere autenticación.
    """
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

# --- 7. Rutas de API para Viajes (Travels) ---
# Mantendremos la colección como 'viajes' según tu código anterior.

@app.route('/viajes', methods=['GET'])
# @auth_required # Descomentar si solo usuarios autenticados pueden ver la lista de viajes
def get_viajes():
    """
    Obtiene todos los viajes de la colección 'viajes' en Firestore.
    Permite filtrar por 'pasajero_nombre', 'estado', 'conductor_nombre'.
    Retorna una lista de diccionarios con los datos de los viajes, incluyendo su ID de documento.
    Maneja la conversión de Timestamps de Firestore a formato legible.
    """
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        viajes_ref = db.collection('viajes')
        query = viajes_ref.limit(100) # Límite de documentos. Considera paginación.

        pasajero_nombre_filter = request.args.get('pasajero_nombre', '').lower()
        estado_filter = request.args.get('estado', '').lower()
        conductor_nombre_filter = request.args.get('conductor_nombre', '').lower()
        
        # Aplica filtro de estado directamente en Firestore si se proporciona
        if estado_filter:
            query = query.where('estado', '==', estado_filter)

        all_viajes = []
        for doc in query.stream():
            viaje_data = doc.to_dict()
            viaje_data['id'] = doc.id

            # Convierte Timestamps de Firestore a cadenas de texto ISO para JSON
            viaje_data = _handle_timestamp(viaje_data, 'fecha_solicitud')
            viaje_data = _handle_timestamp(viaje_data, 'fecha_asignacion')
            viaje_data = _handle_timestamp(viaje_data, 'fecha_actualizacion') # Nuevo campo
            viaje_data = _handle_timestamp(viaje_data, 'fecha_finalizacion') # Nuevo campo

            # Filtrado en memoria para campos de texto (pasajero_nombre, conductor_nombre)
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
    """
    Añade un nuevo viaje a la colección 'viajes'.
    Requiere autenticación. Realiza validaciones de campos y formato.
    """
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400

        # Validaciones de campos obligatorios y formato
        if not data.get('pasajero_nombre'):
            return jsonify({"error": "Falta el nombre del pasajero."}), 400
        
        if not (data.get('ubicacion_origen_texto') or 
                (data.get('ubicacion_origen_lat') is not None and data.get('ubicacion_origen_lon') is not None)):
            return jsonify({"error": "Debe proporcionar una ubicación de origen (texto o coordenadas GPS)."}), 400

        if 'pasajero_telefono' in data and not _validate_phone(data['pasajero_telefono']):
            return jsonify({"error": "El teléfono del pasajero debe contener solo números (7-15 dígitos)."}), 400

        # Limpieza y preparación de datos antes de guardar
        # Asegurarse de que las coordenadas sean float o None
        data['ubicacion_origen_lat'] = float(data['ubicacion_origen_lat']) if data.get('ubicacion_origen_lat') not in [None, ''] else None
        data['ubicacion_origen_lon'] = float(data['ubicacion_origen_lon']) if data.get('ubicacion_origen_lon') not in [None, ''] else None
        data['ubicacion_destino_lat'] = float(data['ubicacion_destino_lat']) if data.get('ubicacion_destino_lat') not in [None, ''] else None
        data['ubicacion_destino_lon'] = float(data['ubicacion_destino_lon']) if data.get('ubicacion_destino_lon') not in [None, ''] else None
        
        data['estado'] = data.get('estado', 'pendiente').lower()
        
        # Si el estado no es 'pendiente', debe tener conductor_id
        conductor_id_from_data = str(data['conductor_id']) if data.get('conductor_id') not in [None, ''] else None
        conductor_nombre_from_data = data.get('conductor_nombre', None)

        if data['estado'] != 'pendiente' and not conductor_id_from_data:
            return jsonify({"error": 'Si el estado no es "pendiente", debes asignar un conductor (conductor_id).'}), 400

        if conductor_id_from_data:
            conductor_doc = db.collection('drivers').document(conductor_id_from_data).get()
            if not conductor_doc.exists:
                return jsonify({"error": f"El conductor con ID '{conductor_id_from_data}' no existe."}), 400
            # Usar el nombre del conductor de la base de datos para asegurar consistencia
            conductor_nombre_from_data = conductor_doc.to_dict().get('nombre')
        
        # Construye el objeto de viaje
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
            'fecha_actualizacion': SERVER_TIMESTAMP, # Nuevo campo
            'fecha_finalizacion': SERVER_TIMESTAMP if data['estado'] == 'completado' else None # Nuevo campo
        }

        doc_ref = db.collection('viajes').add(travel_to_add)
        # Añade el ID del documento al objeto de respuesta
        travel_to_add['id'] = doc_ref[1].id 
        # Convierte Timestamps a ISO para la respuesta
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
    """
    Actualiza un viaje existente en la colección 'viajes'.
    Requiere autenticación. Realiza validaciones de campos y formato.
    """
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

        # Mapeo de campos a actualizar
        fields_to_update = [
            'pasajero_nombre', 'pasajero_telefono', 'ubicacion_origen_texto', 
            'ubicacion_destino_texto', 'notas', 'estado', 'conductor_id', 'conductor_nombre',
            'ubicacion_origen_lat', 'ubicacion_origen_lon', 'ubicacion_destino_lat', 'ubicacion_destino_lon'
        ]

        for field in fields_to_update:
            if field in data:
                value = data[field]
                # Manejo específico para campos de latitud/longitud
                if 'lat' in field or 'lon' in field:
                    if value is None or value == '' or value == 'null': # Si es None o cadena vacía/nula
                        update_data[field] = None # Almacenar como None en Firestore
                    else:
                        try:
                            update_data[field] = float(value) # Intentar convertir a float
                        except (ValueError, TypeError):
                            # Si no es None/vacío y no se puede convertir a float, es un error
                            return jsonify({"error": f"Coordenada '{field}' inválida. Debe ser un número."}), 400
                elif value == '' or value == 'null': # Manejo para otros campos que pueden ser None/vacíos
                    update_data[field] = None
                elif field == 'pasajero_telefono':
                    if not _validate_phone(value):
                        return jsonify({"error": "El teléfono del pasajero debe contener solo números (7-15 dígitos)."}), 400
                    update_data[field] = value
                elif field == 'estado':
                    update_data[field] = value.lower() # Asegura que el estado esté en minúsculas
                elif field == 'conductor_id':
                    update_data[field] = str(value) if value is not None else None # Convierte a string si no es None
                else:
                    update_data[field] = value

        # Lógica específica para fecha_asignacion basada en conductor_id
        old_conductor_id = current_viaje_data.get('conductor_id')
        new_conductor_id = update_data.get('conductor_id', old_conductor_id) # Si no se actualiza, mantiene el viejo

        if new_conductor_id and new_conductor_id != old_conductor_id:
            # Se asigna un nuevo conductor o se cambia
            conductor_doc = db.collection('drivers').document(new_conductor_id).get()
            if not conductor_doc.exists:
                return jsonify({"error": f"El conductor con ID '{new_conductor_id}' no existe."}), 400
            update_data['conductor_nombre'] = conductor_doc.to_dict().get('nombre')
            update_data['fecha_asignacion'] = SERVER_TIMESTAMP
        elif not new_conductor_id and old_conductor_id:
            # Se desasigna el conductor
            update_data['conductor_nombre'] = None
            update_data['fecha_asignacion'] = None
        # Si new_conductor_id es None y old_conductor_id también era None, no se hace nada
        # Si new_conductor_id es el mismo que old_conductor_id, tampoco se actualiza fecha_asignacion

        # Validar estado vs conductor
        # Si el estado se cambia a algo diferente de 'pendiente' y no hay conductor asignado
        current_estado = current_viaje_data.get('estado')
        new_estado = update_data.get('estado', current_estado) # Si no se actualiza, mantiene el viejo

        if new_estado != 'pendiente' and not new_conductor_id:
            return jsonify({"error": 'Si el estado no es "pendiente", debes asignar un conductor (conductor_id).'}), 400

        # Lógica para fecha_finalizacion
        old_estado = current_viaje_data.get('estado')
        if new_estado == 'completado' and old_estado != 'completado':
            update_data['fecha_finalizacion'] = SERVER_TIMESTAMP
        elif new_estado != 'completado' and old_estado == 'completado':
            # Si el estado cambia de "completado" a otro, se limpia la fecha de finalización
            update_data['fecha_finalizacion'] = None


        update_data['fecha_actualizacion'] = SERVER_TIMESTAMP

        if not update_data:
            return jsonify({"message": "No hay datos válidos para actualizar."}), 200 # O 400
            
        viaje_ref.update(update_data)
        updated_travel = viaje_ref.get().to_dict()
        updated_travel['id'] = viaje_id # Asegura que el ID esté en la respuesta
        # Convertir timestamps a ISO para la respuesta
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
    """
    Elimina un viaje de la colección 'viajes'.
    Requiere autenticación.
    """
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

# --- 8. Rutas de API para Gestión de Usuarios y Roles (Authentication) ---

@app.route('/users/set_role', methods=['POST'])
@auth_required
def set_user_role():
    """
    Establece un rol personalizado (custom claim) para un usuario de Firebase Authentication.
    Requiere 'uid' (ID de usuario de Firebase) y 'role' (el rol a asignar) en el cuerpo JSON.
    Este endpoint es de uso delicado, en producción debería estar protegido fuertemente
    o solo ser accesible por un panel de administración seguro (ej. solo por el CEO autenticado).
    """
    if db is None:
        return jsonify({"error": "Base de datos no disponible"}), 503
    
    # Verificar que el usuario autenticado tiene el rol de 'admin'
    # 'g.user_claims' es establecido por el decorador @auth_required
    if not g.user_claims.get('role') == 'admin':
        return jsonify({"error": "Acceso denegado: Solo los administradores pueden asignar roles."}), 403 # Forbidden

    try:
        data = request.json
        uid = data.get('uid')
        role = data.get('role')

        if not uid or not role:
            return jsonify({"error": "Se requieren 'uid' y 'role'."}), 400
        
        # Opcional: Validar que el rol sea uno de una lista permitida (ej. 'admin', 'operator', 'driver')
        allowed_roles = ['admin', 'operator', 'driver', 'ceo', 'passenger'] # Define tus roles aquí
        if role not in allowed_roles:
            return jsonify({"error": f"Rol '{role}' no permitido. Roles válidos: {', '.join(allowed_roles)}."}), 400

        user = auth.get_user(uid) # Verifica si el UID existe en Firebase Auth
        
        auth.set_custom_user_claims(uid, {'role': role})
        
        print(f"Rol '{role}' asignado a usuario {uid} ({user.email}).")
        return jsonify({"message": f"Rol '{role}' asignado a usuario '{uid}' exitosamente."}), 200
    except auth.UserNotFoundError:
        print(f"Usuario con UID {uid} no encontrado.")
        return jsonify({"error": f"Usuario con ID '{uid}' no encontrado."}), 404
    except Exception as e:
        print(f"Error al asignar rol a usuario {uid}: {e}")
        return jsonify({"error": "Error interno del servidor al asignar rol."}), 500

# --- 9. Ruta de Ejemplo para Autenticación (Login en Backend) ---
# Esta ruta es un ejemplo. El frontend de React DEBE manejar el login directamente con Firebase SDK.
# Este endpoint solo sería útil si tuvieras un caso de uso específico donde el backend necesite
# recibir el ID Token para procesarlo (ej. generar una cookie de sesión).
@app.route('/login', methods=['POST'])
def login():
    """
    Endpoint de ejemplo para procesar el ID Token de Firebase recibido del frontend.
    Verifica el token y devuelve información del usuario.
    """
    try:
        data = request.json
        id_token = data.get('idToken') # El token ID obtenido del frontend de Firebase Auth

        if not id_token:
            return jsonify({"error": "Token de ID no proporcionado."}), 400

        claims = auth.verify_id_token(id_token)
        uid = claims['uid']
        # Opcional: Cargar más datos del usuario desde Firestore si es necesario
        # Esto es útil si quieres mantener perfiles de usuario enriquecidos fuera de Firebase Auth.
        # user_doc = db.collection('users').document(uid).get() # Asume que tienes una colección 'users'
        # user_data = user_doc.to_dict() if user_doc.exists else {}

        return jsonify({
            "message": "Autenticación exitosa",
            "uid": uid,
            "email": claims.get('email'),
            "role": claims.get('role', 'none'), # Obtiene el rol del custom claim si existe
            # "user_data_from_firestore": user_data
        }), 200

    except firebase_exceptions.AuthError as e:
        # Errores específicos de autenticación (ej. token expirado, inválido)
        print(f"Error de autenticación: {e.code} - {e.ak_error_code if hasattr(e, 'ak_error_code') else ''}")
        return jsonify({"error": f"Error de autenticación: {e.code}. Por favor, inicie sesión de nuevo."}), 401
    except Exception as e:
        print(f"Error durante el proceso de login: {e}")
        return jsonify({"error": "Error interno del servidor durante el login."}), 500

# --- 10. Punto de Entrada de la Aplicación ---
if __name__ == '__main__':
    # Cuando debug=True, Flask proporciona un reloader y un debugger.
    # Esto es ideal para desarrollo, pero DESACTÍVALO en producción por seguridad y rendimiento.
    # En producción, usa un servidor WSGI como Gunicorn (gunicorn app:app -w 4 -b 0.0.0.0:5000).
    app.run(debug=True, host='0.0.0.0', port=5000)
