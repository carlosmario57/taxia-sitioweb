# 🚖 TaxiA-CIMCO – Plataforma de Movilidad

Este proyecto es una **plataforma de movilidad integral** que conecta pasajeros con distintos tipos de conductores: mototaxi, motoparrillero, motocarga, intermunicipal, despachadores y panel de CEO.  
Está construido sobre **Firebase (backend serverless)** y un **frontend web progresivo (PWA)**, integrando **API de WhatsApp Business** para notificaciones en tiempo real.

---

## 📂 Estructura del proyecto
ProyectosCIMCO/
├── functions/ # Backend (Firebase Cloud Functions)
│ ├── index.js # Lógica principal de backend
│ ├── package.json # Dependencias backend
│ ├── serviceAccountKey.json # 🔒 Claves privadas (NO se sube a GitHub)
│ └── ...
│
├── frontend/ # Aplicación web (PWA)
│ ├── public/ # Archivos HTML y estáticos
│ │ ├── pasajero.html
│ │ ├── mototaxi.html
│ │ ├── motoparrillero.html
│ │ ├── motocarga.html
│ │ ├── intermunicipal.html
│ │ ├── despachadorinter.html
│ │ ├── ceo-panel.html
│ │ ├── paginaweb.html
│ │ ├── panel-credito.html
│ │ ├── panel-whatsapp.html
│ │ ├── qr-generador.html
│ │ ├── manifest.json
│ │ └── service-worker.js
│ └── ...
│
├── database/ # Reglas y configuración de Firestore
│ ├── firestore.rules
│ ├── firestore.indexes.json
│
├── scripts/ # Scripts de automatización
│ ├── check-env.ps1 # ✅ Verifica entorno (Java, Node, NPM, Firebase)
│ ├── check-firebase.ps1 # ✅ (opcional) Test de emulador y backend
│ ├── iniciar-frontend.ps1 # 🚀 Levanta el frontend en local
│ └── iniciar_cimco.bat # 🚀 Launcher para Windows
│
├── firebase.json # Configuración de Firebase Hosting & Functions
├── .firebaserc # Proyecto de Firebase activo
├── .gitignore # Ignora claves, node_modules y archivos sensibles
└── README.md # Documentación del proyecto

---

## 🛠️ Tecnologías utilizadas

- **Backend:** Firebase Functions, Express, Firebase Admin SDK  
- **Frontend:** HTML5, CSS3, JS, PWA (con `manifest.json` y `service-worker.js`)  
- **Base de datos:** Firestore (NoSQL en tiempo real)  
- **Mensajería:** API de WhatsApp Business (Meta)  
- **Infraestructura:** Firebase Hosting + Emulator Suite para pruebas locales  

---

## 🚀 Instalación y configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/carlosmario57/taxia-sitioweb.git
cd taxia-sitioweb
