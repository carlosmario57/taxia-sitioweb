// =================================================================================================
// ARCHIVO: src/components/Dashboard.jsx
// FUNCIÓN: Componente principal del dashboard que muestra la información clave de la aplicación.
//          Este es el contenedor para otros componentes más pequeños como tarjetas de estadísticas
//          o tablas de datos.
// =================================================================================================

import React from 'react';
import { LuUsers, LuCar, LuMapPin } from 'react-icons/lu'; // Íconos de Lucide React

// Componente para una tarjeta de estadísticas reutilizable.
const StatCard = ({ title, value, icon, description }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md flex-1 min-w-[250px] transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <div className="text-blue-500">{icon}</div>
      </div>
      <p className="text-4xl font-extrabold text-blue-800 mb-2">{value}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
};

const Dashboard = ({ userId }) => {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-md space-y-8">
      {/* Título y descripción del Dashboard */}
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-blue-800 mb-2">
          Resumen General
        </h2>
        <p className="text-gray-600">
          Vista rápida de las métricas clave de la aplicación.
        </p>
      </div>

      {/* Grid de tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Conductores Activos"
          value="45"
          icon={<LuUsers size={32} />}
          description="Número de conductores disponibles en este momento."
        />
        <StatCard
          title="Viajes Pendientes"
          value="12"
          icon={<LuMapPin size={32} />}
          description="Viajes que aún no han sido asignados a un conductor."
        />
        <StatCard
          title="Viajes Completados Hoy"
          value="158"
          icon={<LuCar size={32} />}
          description="Número total de viajes finalizados en las últimas 24 horas."
        />
      </div>

      {/* Sección para futuras tablas o gráficos */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
          Detalles de la Operación
        </h3>
        <div className="bg-gray-50 p-6 rounded-xl text-center text-gray-500">
          <p>Aquí se podría integrar una tabla de viajes recientes o un gráfico.</p>
          <p>Se usarán componentes como `TripList.jsx` o `DriverList.jsx` más adelante.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
