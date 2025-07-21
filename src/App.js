import React from 'react';
import './App.css'; // Mantenemos la importación de estilos
import DriverList from './DriverList'; // Importa el componente DriverList
import DriverForm from './DriverForm'; // Importa el nuevo componente DriverForm

function App() {
  // Usamos un estado para forzar la actualización de DriverList
  // cada vez que se crea un nuevo conductor.
  const [refreshDrivers, setRefreshDrivers] = useState(0);

  // Esta función se pasará a DriverForm y se llamará cuando un conductor sea creado.
  const handleDriverCreated = () => {
    setRefreshDrivers(prev => prev + 1); // Incrementa el estado para forzar la actualización de DriverList
  };

  return (
    <div className="App" style={{ fontFamily: 'Inter, sans-serif', maxWidth: '900px', margin: '20px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
        <h1 style={{ color: '#333', fontSize: '2.5em', marginBottom: '10px' }}>Panel de Control CIMCO - CEO</h1>
        <p style={{ color: '#666', fontSize: '1.1em' }}>
          ¡Bienvenido, Carlos Mario! Aquí gestionarás a tus conductores y servicios.
        </p>
      </header>

      <main style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
        {/* Renderiza el componente DriverForm y le pasa la función de actualización */}
        <DriverForm onDriverCreated={handleDriverCreated} />

        {/* Renderiza el componente DriverList y le pasa la clave para forzar la actualización */}
        <DriverList key={refreshDrivers} />
      </main>
    </div>
  );
}

export default App;
