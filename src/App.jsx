import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously, signOut } from "firebase/auth";
import { getFirestore, collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Plus, Edit, Trash2, Check, X, Volume2, MapPin, Map, Loader2, Locate, Clock, Car, Phone, Mail } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Clave de API de Google Maps con la clave que proporcionaste.
const GOOGLE_MAPS_API_KEY = "AIzaSyBkq202xtq_7v3kLB-yDAqyJ3kYjX3VmGE";
const GOOGLE_MAPS_API_URL = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;

// =================================================================================================
// FUNCIÓN UTILITARIA: Convierte PCM de 16 bits a formato WAV para la reproducción de audio.
// La API de TTS de Gemini retorna audio en formato PCM, que debe ser convertido para reproducirse en el navegador.
// =================================================================================================
const pcmToWav = (pcmData, sampleRate) => {
  const numChannels = 1;
  const sampleBits = 16;
  const pcm16 = new Int16Array(pcmData);
  const dataLength = pcm16.length * (sampleBits / 8);
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  let offset = 0;
  const writeString = (str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset++, str.charCodeAt(i));
    }
  };

  // Chunk RIFF
  writeString('RIFF');
  view.setUint32(offset, 36 + dataLength, true); offset += 4;
  writeString('WAVE');

  // Chunk fmt
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2; // Formato de Audio: PCM
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * numChannels * (sampleBits / 8), true); offset += 4; // ByteRate
  view.setUint16(offset, numChannels * (sampleBits / 8), true); offset += 2; // BlockAlign
  view.setUint16(offset, sampleBits, true); offset += 2;

  // Chunk de datos
  writeString('data');
  view.setUint32(offset, dataLength, true); offset += 4;

  for (let i = 0; i < pcm16.length; i++, offset += 2) {
    view.setInt16(offset, pcm16[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
};

// =================================================================================================
// FUNCIÓN UTILITARIA: Decodifica datos de audio de base64 a un ArrayBuffer.
// =================================================================================================
const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// =================================================================================================
// COMPONENTE PRINCIPAL DE LA APLICACIÓN
// =================================================================================================
export default function App() {
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  // Referencias para la instancia de Google Maps y los marcadores
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // =================================================================================================
  // LÓGICA DE INICIALIZACIÓN DE FIREBASE Y AUTENTICACIÓN
  // =================================================================================================
  useEffect(() => {
    // Definimos una configuración de Firebase de respaldo para el desarrollo local.
    const firebaseConfig = typeof __firebase_config !== 'undefined' ?
      JSON.parse(__firebase_config) : {
        apiKey: "fake-api-key",
        authDomain: "fake-auth-domain.firebaseapp.com",
        projectId: "fake-project-id",
        storageBucket: "fake-project-id.appspot.com",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0"
      };

    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    // Inicializa la app de Firebase, previniendo reinicialización.
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const authInstance = getAuth(app);
    const dbInstance = getFirestore(app);

    setAuth(authInstance);
    setDb(dbInstance);

    const unsubscribeAuth = onAuthStateChanged(authInstance, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const signIn = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(authInstance, initialAuthToken);
        } else {
          await signInAnonymously(authInstance);
        }
      } catch (error) {
        console.error("Error de autenticación:", error);
        showNotification(`Error de autenticación: ${error.message}`, "error");
      }
    };

    signIn();
    return () => unsubscribeAuth();
  }, []);

  // =================================================================================================
  // LÓGICA DE CONEXIÓN A FIRESTORE Y OBTENCIÓN DE DATOS EN TIEMPO REAL
  // =================================================================================================
  useEffect(() => {
    if (db && user) {
      const userId = user.uid;
      const driversCollectionPath = `/artifacts/${appId}/users/${userId}/drivers`;
      const tripsCollectionPath = `/artifacts/${appId}/users/${userId}/trips`;

      const driversQuery = query(collection(db, driversCollectionPath));
      const tripsQuery = query(collection(db, tripsCollectionPath));

      const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
        const driversData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDrivers(driversData);
      });

      const unsubscribeTrips = onSnapshot(tripsQuery, (snapshot) => {
        const tripsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTrips(tripsData);
      });

      return () => {
        unsubscribeDrivers();
        unsubscribeTrips();
      };
    }
  }, [db, user, appId]);

  // =================================================================================================
  // LÓGICA PARA ACTUALIZAR LOS VIAJES CON LA INFORMACIÓN DEL CONDUCTOR
  // =================================================================================================
  const enrichedTrips = trips.map(trip => {
    const driver = drivers.find(d => d.id === trip.driverId);
    return {
      ...trip,
      driverName: driver ? driver.name : 'Conductor desconocido',
      driverStatus: driver ? driver.status : 'Desconocido'
    };
  });

  // =================================================================================================
  // LÓGICA DE GOOGLE MAPS
  // =================================================================================================
  useEffect(() => {
    // Función para inicializar el mapa una vez que la API se carga.
    window.initMap = () => {
      if (!mapRef.current || !window.google) return;
      const mapOptions = {
        center: { lat: 19.4326, lng: -99.1332 }, // Centrado inicial en la Ciudad de México
        zoom: 12,
        mapId: "DEMO_MAP_ID", // Puedes reemplazar esto con tu propio ID de mapa si lo tienes
      };
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    };

    const loadScript = () => {
      // Evita cargar el script múltiples veces.
      const scriptExists = document.querySelector(`script[src^="${GOOGLE_MAPS_API_URL.split('&')[0]}"]`);
      if (scriptExists) {
        if (window.google) {
          window.initMap();
        }
        return;
      }
      
      const script = document.createElement('script');
      script.src = GOOGLE_MAPS_API_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    };

    loadScript();
  }, []);

  // Efecto para actualizar los marcadores en el mapa cuando los datos de los conductores cambian.
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !drivers.length) return;

    // Remover marcadores antiguos que ya no existen
    Object.keys(markersRef.current).forEach(driverId => {
      if (!drivers.find(d => d.id === driverId)) {
        markersRef.current[driverId].setMap(null);
        delete markersRef.current[driverId];
      }
    });

    drivers.forEach(driver => {
      if (driver.status === 'en curso' && driver.location && driver.location.latitude && driver.location.longitude) {
        const position = { lat: driver.location.latitude, lng: driver.location.longitude };
        
        if (markersRef.current[driver.id]) {
          // Si el marcador ya existe, simplemente actualiza su posición
          markersRef.current[driver.id].setPosition(position);
        } else {
          // Si no existe, crea uno nuevo
          markersRef.current[driver.id] = new window.google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: `Conductor: ${driver.name}`,
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              fillColor: '#FDD835',
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 5,
              rotation: driver.heading || 0, // Añadir rotación para simular dirección
            },
          });
        }
      } else {
        // Elimina el marcador si el conductor ya no está en viaje
        if (markersRef.current[driver.id]) {
          markersRef.current[driver.id].setMap(null);
          delete markersRef.current[driver.id];
        }
      }
    });
  }, [drivers]);

  // =================================================================================================
  // LÓGICA DE GESTIÓN DE DATOS EN FIRESTORE Y NOTIFICACIONES
  // =================================================================================================
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  const handleAddDriver = async (driverData) => {
    if (!db || !user) return showNotification("No hay conexión a la base de datos.", "error");
    try {
      const userId = user.uid;
      const newDriver = {
        ...driverData,
        status: 'disponible',
        currentTripId: null,
        createdAt: new Date().toISOString(),
        location: { latitude: driverData.latitude, longitude: driverData.longitude }
      };
      await addDoc(collection(db, `/artifacts/${appId}/users/${userId}/drivers`), newDriver);
      showNotification("Conductor agregado con éxito!", "success");
    } catch (error) {
      console.error("Error al agregar el conductor:", error);
      showNotification("Error al agregar el conductor.", "error");
    }
  };

  const handleUpdateDriver = async (id, updatedData) => {
    if (!db || !user) return showNotification("No hay conexión a la base de datos.", "error");
    try {
      const userId = user.uid;
      const driverDocRef = doc(db, `/artifacts/${appId}/users/${userId}/drivers`, id);
      await updateDoc(driverDocRef, updatedData);
      showNotification("Conductor actualizado con éxito!", "success");
    } catch (error) {
      console.error("Error al actualizar el conductor:", error);
      showNotification("Error al actualizar el conductor.", "error");
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!db || !user) return showNotification("No hay conexión a la base de datos.", "error");
    try {
      const userId = user.uid;
      const driverDocRef = doc(db, `/artifacts/${appId}/users/${userId}/drivers`, id);
      await deleteDoc(driverDocRef);
      showNotification("Conductor eliminado con éxito!", "success");
    } catch (error) {
      console.error("Error al eliminar el conductor:", error);
      showNotification("Error al eliminar el conductor.", "error");
    }
  };

  const handleAddTrip = async (tripData) => {
    if (!db || !user) return showNotification("No hay conexión a la base de datos.", "error");
    const userId = user.uid;
    try {
      const newTripRef = await addDoc(collection(db, `/artifacts/${appId}/users/${userId}/trips`), tripData);
      const driverDocRef = doc(db, `/artifacts/${appId}/users/${userId}/drivers`, tripData.driverId);
      await updateDoc(driverDocRef, {
        status: 'en curso',
        currentTripId: newTripRef.id,
        location: tripData.originLocation // Actualiza la ubicación del conductor al inicio del viaje
      });
      showNotification("Viaje agregado con éxito y conductor asignado!", "success");
    } catch (error) {
      console.error("Error al agregar el viaje:", error);
      showNotification("Error al agregar el viaje.", "error");
    }
  };

  const handleUpdateTrip = async (id, updatedData) => {
    if (!db || !user) return showNotification("No hay conexión a la base de datos.", "error");
    try {
      const userId = user.uid;
      const tripDocRef = doc(db, `/artifacts/${appId}/users/${userId}/trips`, id);
      await updateDoc(tripDocRef, updatedData);
      showNotification("Viaje actualizado con éxito!", "success");
    } catch (error) {
      console.error("Error al actualizar el viaje:", error);
      showNotification("Error al actualizar el viaje.", "error");
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!db || !user) return showNotification("No hay conexión a la base de datos.", "error");
    try {
      const userId = user.uid;
      const tripDocRef = doc(db, `/artifacts/${appId}/users/${userId}/trips`, id);
      await deleteDoc(tripDocRef);
      showNotification("Viaje eliminado con éxito!", "success");
    } catch (error) {
      console.error("Error al eliminar el viaje:", error);
      showNotification("Error al eliminar el viaje.", "error");
    }
  };

  const handleEndTrip = async (tripId, driverId) => {
    if (!db || !user) return showNotification("No hay conexión a la base de datos.", "error");
    const userId = user.uid;
    try {
      const tripDocRef = doc(db, `/artifacts/${appId}/users/${userId}/trips`, tripId);
      await updateDoc(tripDocRef, { status: 'finalizado' });
      const driverDocRef = doc(db, `/artifacts/${appId}/users/${userId}/drivers`, driverId);
      await updateDoc(driverDocRef, {
        status: 'disponible',
        currentTripId: null
      });
      showNotification("Viaje finalizado con éxito!", "success");
    } catch (error) {
      console.error("Error al finalizar el viaje:", error);
      showNotification("Error al finalizar el viaje.", "error");
    }
  };

  // Función para generar y reproducir audio para notificar a un conductor
  const handleNotifyDriver = async (trip) => {
    const textToSpeak = `Tienes una nueva solicitud de viaje. El pasajero te espera en la ubicación de origen: ${trip.origin}. El destino es ${trip.destination}.`;
    
    try {
      const payload = {
        contents: [{ parts: [{ text: textToSpeak }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
        },
        model: "gemini-2.5-flash-preview-tts"
      };
      
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await apiResponse.json();
      const part = result?.candidates?.[0]?.content?.parts?.[0];
      const audioData = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;

      if (audioData && mimeType && mimeType.startsWith("audio/L16")) {
        const sampleRateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 16000;
        const pcmData = base64ToArrayBuffer(audioData);
        const pcm16 = new Int16Array(pcmData);
        const wavBlob = pcmToWav(pcm16, sampleRate);
        const audioUrl = URL.createObjectURL(wavBlob);
        
        const audio = new Audio(audioUrl);
        audio.play();
        showNotification("Notificación de audio enviada!", "success");
      } else {
        console.error('La respuesta de la API de TTS no es válida:', result);
        showNotification("Error al generar la notificación de audio.", "error");
      }
    } catch (error) {
      console.error('Error en la llamada a la API de TTS:', error);
      showNotification("Error de red al generar la notificación.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; }
          .animate-spin-slow { animation: spin 3s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
        <Loader2 size={48} className="text-indigo-500 animate-spin-slow mb-4" />
        <p className="text-xl font-semibold text-indigo-300">Cargando aplicación...</p>
        <p className="mt-2 text-sm text-gray-400">Iniciando sesión en Firebase y cargando recursos.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; }
        `}</style>
        <h1 className="text-3xl font-bold text-red-500 mb-4">Error de Autenticación</h1>
        <p className="text-gray-400 text-center">No se pudo iniciar sesión. Por favor, recarga la página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 font-sans antialiased text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <script src="https://cdn.tailwindcss.com"></script>
      {notification.message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl text-white animate-fadeIn ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}
      
      <Dashboard
        user={user}
        onLogout={() => signOut(auth)}
        drivers={drivers}
        trips={enrichedTrips}
        onAddDriver={handleAddDriver}
        onUpdateDriver={handleUpdateDriver}
        onDeleteDriver={handleDeleteDriver}
        onAddTrip={handleAddTrip}
        onUpdateTrip={handleUpdateTrip}
        onDeleteTrip={handleDeleteTrip}
        onEndTrip={handleEndTrip}
        onNotifyDriver={handleNotifyDriver}
        showNotification={showNotification}
        mapRef={mapRef}
      />
    </div>
  );
}

// =================================================================================================
// COMPONENTE: DASHBOARD (Panel de Control Principal)
// =================================================================================================
const Dashboard = ({ user, onLogout, drivers, trips, onAddDriver, onUpdateDriver, onDeleteDriver, onAddTrip, onUpdateTrip, onDeleteTrip, onEndTrip, onNotifyDriver, showNotification, mapRef }) => {
  const [activeTab, setActiveTab] = useState('drivers');
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState('');

  const openDeleteModal = (item, type) => {
    setItemToDelete(item);
    setItemTypeToDelete(type);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemTypeToDelete === 'driver' && itemToDelete) {
      onDeleteDriver(itemToDelete.id);
    } else if (itemTypeToDelete === 'trip' && itemToDelete) {
      onDeleteTrip(itemToDelete.id);
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
    setItemTypeToDelete('');
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
    setItemTypeToDelete('');
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsAddingDriver(false);
    setIsAddingTrip(false);
    setEditingDriver(null);
    setEditingTrip(null);
  };

  const getDriverStatusColor = (status) => {
    switch (status) {
      case 'disponible': return 'bg-green-500 text-white';
      case 'en curso': return 'bg-yellow-500 text-gray-900';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTripStatusColor = (status) => {
    switch (status) {
      case 'pendiente': return 'bg-blue-500';
      case 'en curso': return 'bg-yellow-500';
      case 'finalizado': return 'bg-green-500';
      case 'cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const availableDrivers = drivers.filter(d => d.status === 'disponible');

  return (
    <div className="min-h-screen bg-gray-950 font-sans antialiased text-white">
      <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-400">Panel de Control de CIMCO</h1>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-sm text-gray-400 hidden md:block">UID: {user.uid}</span>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300 shadow-lg"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
        
        {/* Contenedor principal de pestañas y mapa */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna de Contenido Principal (Pestañas) */}
          <div className="lg:col-span-2 bg-gray-900 p-6 rounded-xl shadow-2xl">
            <div className="flex space-x-2 mb-6 border-b border-gray-700">
              <button
                onClick={() => handleTabChange('drivers')}
                className={`py-2 px-4 transition-colors duration-300 font-semibold ${activeTab === 'drivers' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
              >
                Conductores ({drivers.length})
              </button>
              <button
                onClick={() => handleTabChange('trips')}
                className={`py-2 px-4 transition-colors duration-300 font-semibold ${activeTab === 'trips' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
              >
                Viajes ({trips.length})
              </button>
            </div>
            
            <div className="flex justify-end mb-4">
              {activeTab === 'drivers' && !isAddingDriver && !editingDriver && (
                <button
                  onClick={() => setIsAddingDriver(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all duration-300 shadow-md"
                >
                  <Plus size={18} /> Agregar Conductor
                </button>
              )}
              {activeTab === 'trips' && !isAddingTrip && !editingTrip && (
                <button
                  onClick={() => setIsAddingTrip(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all duration-300 shadow-md"
                >
                  <Plus size={18} /> Agregar Viaje
                </button>
              )}
            </div>
            
            {/* Renderizado condicional de formularios o listas */}
            {isAddingDriver ? (
              <AddDriverForm onAddDriver={onAddDriver} onCancel={() => setIsAddingDriver(false)} showNotification={showNotification} />
            ) : isAddingTrip ? (
              <AddTripForm onAddTrip={onAddTrip} onCancel={() => setIsAddingTrip(false)} drivers={availableDrivers} showNotification={showNotification} />
            ) : editingDriver ? (
              <EditDriverForm driver={editingDriver} onUpdateDriver={onUpdateDriver} onCancel={() => setEditingDriver(null)} showNotification={showNotification} />
            ) : editingTrip ? (
              <EditTripForm trip={editingTrip} onUpdateTrip={onUpdateTrip} onCancel={() => setEditingTrip(null)} drivers={drivers} showNotification={showNotification} />
            ) : (
              <>
                {activeTab === 'drivers' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Lista de Conductores</h2>
                    {drivers.length > 0 ? (
                      <ul className="space-y-4">
                        {drivers.map(driver => (
                          <li key={driver.id} className="p-4 bg-gray-800 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center animate-fadeIn">
                            <div className="text-left mb-2 md:mb-0 flex-grow">
                              <p className="font-semibold text-lg text-indigo-300">{driver.name || 'Sin nombre'}</p>
                              <p className="text-sm text-gray-400">
                                <span className="inline-flex items-center gap-1"><Mail size={12} /> {driver.email || 'Sin correo'}</span>
                              </p>
                              <p className="text-sm text-gray-400">
                                <span className="inline-flex items-center gap-1"><Phone size={12} /> {driver.phone || 'Sin teléfono'}</span>
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Ubicación: Lat: {(driver.location?.latitude || 0).toFixed(4)}, Lng: {(driver.location?.longitude || 0).toFixed(4)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${getDriverStatusColor(driver.status)}`}>
                                {driver.status || 'Desconocido'}
                              </span>
                              <button onClick={() => setEditingDriver(driver)} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all duration-300"><Edit size={16} /></button>
                              <button onClick={() => openDeleteModal(driver, 'driver')} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-300"><Trash2 size={16} /></button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400">No hay conductores registrados.</p>
                    )}
                  </div>
                )}
                {activeTab === 'trips' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Lista de Viajes</h2>
                    {trips.length > 0 ? (
                      <ul className="space-y-4">
                        {trips.map(trip => (
                          <li key={trip.id} className="p-4 bg-gray-800 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center animate-fadeIn">
                            <div className="text-left mb-2 md:mb-0 flex-grow">
                              <p className="font-semibold text-lg text-teal-300">Viaje a {trip.destination || 'Desconocido'}</p>
                              <p className="text-sm text-gray-400">Conductor: {trip.driverName || 'Sin asignar'}</p>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Locate size={12} /> Origen: {trip.origin || 'Desconocido'}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${getTripStatusColor(trip.status)}`}>
                                {trip.status || 'Desconocido'}
                              </span>
                              {trip.status === 'en curso' && (
                                <button onClick={() => onEndTrip(trip.id, trip.driverId)} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-300" title="Finalizar viaje">
                                  <Check size={16} />
                                </button>
                              )}
                              {trip.status !== 'finalizado' && trip.status !== 'cancelado' && (
                                <button onClick={() => onNotifyDriver(trip)} className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-colors duration-300" title="Notificar a conductor">
                                  <Volume2 size={16} />
                                </button>
                              )}
                              <button onClick={() => setEditingTrip(trip)} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-300" title="Editar viaje"><Edit size={16} /></button>
                              <button onClick={() => openDeleteModal(trip, 'trip')} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-300" title="Eliminar viaje"><Trash2 size={16} /></button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400">No hay viajes registrados.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Columna de Mapa */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-2xl flex flex-col">
            <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
              <MapPin size={24} className="text-indigo-400" />
              Ubicación de Conductores
            </h2>
            <div ref={mapRef} id="map" className="w-full flex-grow rounded-lg shadow-inner bg-gray-800"></div>
          </div>
        </div>
      </div>
      {showDeleteModal && (
        <DeleteConfirmationModal
          item={itemToDelete}
          type={itemTypeToDelete}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
};

// =================================================================================================
// COMPONENTES DE FORMULARIO
// =================================================================================================
const AddDriverForm = ({ onAddDriver, onCancel }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', latitude: 19.4326, longitude: -99.1332 });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onAddDriver(formData);
    onCancel();
  };
  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-800 rounded-xl space-y-4">
      <h3 className="text-xl font-bold">Nuevo Conductor</h3>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Nombre</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Teléfono</label>
        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex gap-4">
        <div className="w-1/2 space-y-2">
          <label className="block text-sm font-medium text-gray-300">Latitud</label>
          <input type="number" name="latitude" step="any" value={formData.latitude} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="w-1/2 space-y-2">
          <label className="block text-sm font-medium text-gray-300">Longitud</label>
          <input type="number" name="longitude" step="any" value={formData.longitude} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button type="submit" className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full font-semibold transition-colors duration-300">
          <Check size={18} className="inline-block mr-2" /> Guardar
        </button>
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-full font-semibold transition-colors duration-300">
          <X size={18} className="inline-block mr-2" /> Cancelar
        </button>
      </div>
    </form>
  );
};

const EditDriverForm = ({ driver, onUpdateDriver, onCancel }) => {
  const [formData, setFormData] = useState({
    name: driver.name || '',
    email: driver.email || '',
    phone: driver.phone || '',
    latitude: driver.location?.latitude || 0,
    longitude: driver.location?.longitude || 0,
    status: driver.status || 'disponible'
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateDriver(driver.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      location: { latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) }
    });
    onCancel();
  };
  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-800 rounded-xl space-y-4">
      <h3 className="text-xl font-bold">Editar Conductor</h3>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Nombre</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Teléfono</label>
        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Estado</label>
        <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="disponible">Disponible</option>
          <option value="en curso">En Curso</option>
          <option value="ausente">Ausente</option>
        </select>
      </div>
      <div className="flex gap-4">
        <div className="w-1/2 space-y-2">
          <label className="block text-sm font-medium text-gray-300">Latitud</label>
          <input type="number" name="latitude" step="any" value={formData.latitude} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="w-1/2 space-y-2">
          <label className="block text-sm font-medium text-gray-300">Longitud</label>
          <input type="number" name="longitude" step="any" value={formData.longitude} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition-colors duration-300">
          <Check size={18} className="inline-block mr-2" /> Actualizar
        </button>
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-full font-semibold transition-colors duration-300">
          <X size={18} className="inline-block mr-2" /> Cancelar
        </button>
      </div>
    </form>
  );
};

const AddTripForm = ({ onAddTrip, onCancel, drivers, showNotification }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    originLocation: { latitude: 19.4326, longitude: -99.1332 },
    destinationLocation: { latitude: 19.4326, longitude: -99.1332 },
    driverId: '',
    status: 'pendiente',
    passengerName: '',
    fare: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    const [part, key] = name.split('-');
    setFormData({
      ...formData,
      [part]: {
        ...formData[part],
        [key]: parseFloat(value)
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.driverId) {
      showNotification("Por favor, selecciona un conductor disponible.", "error");
      return;
    }
    onAddTrip(formData);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-800 rounded-xl space-y-4">
      <h3 className="text-xl font-bold">Nuevo Viaje</h3>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Conductor</label>
        <select name="driverId" value={formData.driverId} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="" disabled>Selecciona un conductor</option>
          {drivers.map(driver => (
            <option key={driver.id} value={driver.id}>{driver.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Nombre del Pasajero</label>
        <input type="text" name="passengerName" value={formData.passengerName} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Origen</label>
        <input type="text" name="origin" value={formData.origin} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex gap-4">
        <div className="w-1/2 space-y-2">
          <label className="block text-sm font-medium text-gray-300">Latitud Origen</label>
          <input type="number" name="originLocation-latitude" step="any" value={formData.originLocation.latitude} onChange={handleLocationChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="w-1/2 space-y-2">
          <label className="block text-sm font-medium text-gray-300">Longitud Origen</label>
          <input type="number" name="originLocation-longitude" step="any" value={formData.originLocation.longitude} onChange={handleLocationChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Destino</label>
        <input type="text" name="destination" value={formData.destination} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex gap-4">
        <div className="w-1/2 space-y-2">
          <label className="block text-sm font-medium text-gray-300">Latitud Destino</label>
          <input type="number" name="destinationLocation-latitude" step="any" value={formData.destinationLocation.latitude} onChange={handleLocationChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="w-1/2 space-y-2">
          <label className="block text-sm font-medium text-gray-300">Longitud Destino</label>
          <input type="number" name="destinationLocation-longitude" step="any" value={formData.destinationLocation.longitude} onChange={handleLocationChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Tarifa</label>
        <input type="number" name="fare" value={formData.fare} onChange={handleChange} className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex gap-4 pt-4">
        <button type="submit" className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full font-semibold transition-colors duration-300">
          <Check size={18} className="inline-block mr-2" /> Iniciar Viaje
        </button>
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-full font-semibold transition-colors duration-300">
          <X size={18} className="inline-block mr-2" /> Cancelar
        </button>
      </div>
    </form>
  );
};

const EditTripForm = ({ trip, onUpdateTrip, onCancel, drivers }) => {
  const [formData, setFormData] = useState({
    origin: trip.origin || '',
    destination: trip.destination || '',
    driverId: trip.driverId || '',
    status: trip.status || 'pendiente',
    passengerName: trip.passengerName || '',
    fare: trip.fare || 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateTrip(trip.id, formData);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-800 rounded-xl space-y-4">
      <h3 className="text-xl font-bold">Editar Viaje</h3>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Conductor</label>
        <select name="driverId" value={formData.driverId} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {drivers.map(driver => (
            <option key={driver.id} value={driver.id}>{driver.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Nombre del Pasajero</label>
        <input type="text" name="passengerName" value={formData.passengerName} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Origen</label>
        <input type="text" name="origin" value={formData.origin} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Destino</label>
        <input type="text" name="destination" value={formData.destination} onChange={handleChange} required className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Estado</label>
        <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="pendiente">Pendiente</option>
          <option value="en curso">En Curso</option>
          <option value="finalizado">Finalizado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Tarifa</label>
        <input type="number" name="fare" value={formData.fare} onChange={handleChange} className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex gap-4 pt-4">
        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition-colors duration-300">
          <Check size={18} className="inline-block mr-2" /> Actualizar
        </button>
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-full font-semibold transition-colors duration-300">
          <X size={18} className="inline-block mr-2" /> Cancelar
        </button>
      </div>
    </form>
  );
};

// =================================================================================================
// COMPONENTE: MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
// =================================================================================================
const DeleteConfirmationModal = ({ item, type, onConfirm, onCancel }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
        <h3 className="text-xl font-bold text-red-500 mb-4">Confirmar Eliminación</h3>
        <p className="text-gray-300">
          ¿Estás seguro de que quieres eliminar el {type === 'driver' ? `conductor ${item.name}` : `viaje a ${item.destination}`}? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onCancel} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-semibold transition-colors duration-300">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors duration-300">
            <Trash2 size={18} className="inline-block mr-2" /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
