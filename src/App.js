import React, { useState } from 'react'; // ¡Importante: Asegúrate de que useState esté aquí!
import './App.css'; // Mantenemos la importación de estilos
import DriverList from './DriverList'; // Importa el componente DriverList
import DriverForm from './DriverForm'; // Importa el nuevo componente DriverForm

function App() {
  // Estado para forzar la actualización de DriverList.
  // Cada vez que este estado cambie, React "remonta" DriverList,
  // lo que dispara una nueva petición de datos.
  const [refreshDrivers, setRefreshDrivers] = useState(0);

  // Esta función se pasará a DriverForm.
  // Se llamará cuando un conductor sea creado exitosamente en el formulario.
  const handleDriverCreated = () => {
    // Incrementa el estado para forzar la actualización de DriverList.
    // Usamos 'prev' para asegurar que siempre tomamos el valor más reciente.
    setRefreshDrivers(prev => prev + 1); 
  };

  return (
    <div 
      className="App" 
      style={{ 
        fontFamily: 'Inter, sans-serif', 
        maxWidth: '900px', 
        margin: '20px auto', 
        padding: '20px', 
        backgroundColor: '#fff', 
        borderRadius: '10px', 
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' 
      }}
    >
      <header 
        style={{ 
          textAlign: 'center', 
          marginBottom: '40px', 
          paddingBottom: '20px', 
          borderBottom: '1px solid #eee' 
        }}
      >
        <h1 style={{ color: '#333', fontSize: '2.5em', marginBottom: '10px' }}>
          Panel de Control CIMCO - CEO
        </h1>
        <p style={{ color: '#666', fontSize: '1.1em' }}>
          ¡Bienvenido, Carlos Mario! Aquí gestionarás a tus conductores y servicios.
        </p>
      </header>

      <main 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', // Cambiado a columna para que el formulario y la lista estén uno encima del otro
          gap: '40px', 
          justifyContent: 'center',
          alignItems: 'center' // Centra los elementos horizontalmente
        }}
      >
        {/* Renderiza el componente DriverForm y le pasa la función de actualización.
            Cuando un conductor se crea, DriverForm llamará a handleDriverCreated. */}
        <DriverForm onDriverCreated={handleDriverCreated} />

        {/* Renderiza el componente DriverList.
            La prop 'key' se usa para forzar a React a "re-montar" este componente
            cuando 'refreshDrivers' cambia, lo que a su vez hace que DriverList
            vuelva a cargar los datos de los conductores. */}
        <DriverList key={refreshDrivers} />
      </main>
    </div>
  );
}

export default App;