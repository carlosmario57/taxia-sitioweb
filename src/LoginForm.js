import React, { useState } from 'react';
// import { signInWithEmailAndPassword } from 'firebase/auth'; // Lo usaremos más adelante
// import { auth } from './firebaseConfig'; // Lo usaremos más adelante

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // Para mensajes de éxito o error
  const [error, setError] = useState('');     // Para errores específicos

  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene el envío por defecto del formulario

    setMessage(''); // Limpiar mensajes anteriores
    setError('');   // Limpiar errores anteriores

    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    // --- Lógica de Inicio de Sesión con Firebase Authentication se añadirá aquí ---
    try {
      // ESTO ES SOLO UN EJEMPLO DE SIMULACIÓN POR AHORA
      // Aquí iría la llamada real a Firebase: await signInWithEmailAndPassword(auth, email, password);
      console.log('Intentando iniciar sesión con:', { email, password });
      setMessage('Iniciando sesión... (Lógica de Firebase vendrá aquí)');
      // Simular un retraso para ver el mensaje
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      setMessage('¡Inicio de sesión simulado exitoso!');
      setEmail('');
      setPassword('');

    } catch (err) {
      // console.error("Error al iniciar sesión:", err);
      // let errorMessage = "Error al iniciar sesión. Verifica tus credenciales.";
      // if (err.code === 'auth/user-not-found') {
      //   errorMessage = "Usuario no encontrado. Crea una cuenta.";
      // } else if (err.code === 'auth/wrong-password') {
      //   errorMessage = "Contraseña incorrecta. Intenta de nuevo.";
      // }
      // setError(errorMessage);
      setError('Error simulado al iniciar sesión.'); // Mensaje de error simulado
    }
  };

  return (
    // Contenedor principal del formulario de login con estilos Tailwind
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          {/* Campo de Correo Electrónico */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Correo Electrónico:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@ejemplo.com"
              required
            />
          </div>
          {/* Campo de Contraseña */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              required
            />
          </div>
          {/* Botón de Iniciar Sesión */}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Iniciar Sesión
          </button>
        </form>
        {/* Mensajes de éxito o error */}
        {message && <p className="text-green-500 text-sm mt-4 text-center">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}

export default LoginForm;
