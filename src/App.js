import React from 'react';
import './App.css'; // Mantenemos la importación de estilos
import DriverList from './DriverList'; // Importa el nuevo componente DriverList

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Panel de Control CIMCO - CEO</h1>
        <p>¡Bienvenido, Carlos Mario! Aquí gestionarás a tus conductores y servicios.</p>
      </header>

      <main>
        {/* Renderiza el componente DriverList aquí */}
        <DriverList />
      </main>
    </div>
  );
}

export default App;