# 🚀 Backend – Firebase Functions (TypeScript)

Este directorio contiene el **backend de TaxiA-CIMCO**, implementado con **Firebase Functions** en **TypeScript**, con integración a **Firestore** y **Firebase Hosting**.

---

## 📂 Estructura del backend

functions/
├── src/              # Código fuente en TypeScript
│   └── functions/
│       └── index.ts  # Punto de entrada principal
├── lib/              # Carpeta generada con el build (NO editar a mano)
├── package.json      # Dependencias y scripts de npm
├── tsconfig.json     # Configuración de compilación TypeScript
└── README-backend.md # (Este archivo)

---

## ⚙️ Scripts disponibles

En este directorio (/functions) puedes ejecutar:

### 🔨 Compilar
npm run build
👉 Compila el código de src/ hacia lib/ usando tsconfig.json.  
El resultado es lo que Firebase usará en producción.

---

### 🖥️ Emulador local
npm run serve
👉 Compila y arranca emuladores de:
- Functions → http://127.0.0.1:5001  
- Firestore → http://127.0.0.1:8080  
- Hosting   → http://127.0.0.1:5000  
- UI Emulador → http://127.0.0.1:4000  

---

### 🧪 Solo emuladores
npm run emulate
👉 Arranca emuladores sin recompilar.

---

### ☁️ Desplegar a Firebase
npm run deploy
👉 Compila (npm run build) y despliega solo:
- Functions (lib/index.js)
- Hosting (frontend/public/)

---

### 📜 Ver logs en producción
npm run logs
👉 Muestra en consola los logs de tus funciones ya desplegadas.

---

### 🧹 Limpiar compilados
npm run clean
👉 Borra carpetas generadas (lib/, dist/, build/) para una compilación limpia.

---

## ⚠️ Variables de entorno

El aviso que ves en emulador:
!! functions: Failed to load environment variables from .env

👉 Significa que no existe el archivo `.env` en /functions/.  
- Si tu backend no usa claves privadas → puedes ignorarlo.  
- Si necesitas configurar API Keys (ejemplo WhatsApp Business, Stripe, etc.), crea un archivo:

functions/.env

Ejemplo de `.env`:
API_KEY=tu_clave_api
PROJECT_ID=taxia-cimco

Firebase automáticamente lo cargará en el emulador.

---

## 📌 Dónde ejecutar los comandos

- 📍 Para backend (Functions):
PS C:\Users\Carlos Fuentes\ProyectosCIMCO\functions>

- 📍 Para frontend (PWA):
PS C:\Users\Carlos Fuentes\ProyectosCIMCO\frontend>

---

✅ Con esto tienes un manual completo para compilar, emular y desplegar tu backend sin perderte nunca.
