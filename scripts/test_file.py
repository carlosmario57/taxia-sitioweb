import os

file_name = "serviceAccountKey.json"
current_dir = os.getcwd()

print(f"Directorio actual de trabajo: {current_dir}")
print(f"Buscando el archivo: {os.path.join(current_dir, file_name)}")

if os.path.exists(file_name):
    print(f"¡El archivo '{file_name}' EXISTE en el directorio actual!")
    try:
        with open(file_name, 'r', encoding='utf-8') as f:
            content = f.read(100) # Leer los primeros 100 caracteres para verificar acceso
            print(f"¡Acceso al archivo exitoso! Primeros 100 caracteres: {content[:50]}...")
    except Exception as e:
        print(f"Error al intentar abrir el archivo: {e}")
else:
    print(f"¡ERROR! El archivo '{file_name}' NO SE ENCUENTRA en el directorio actual.")