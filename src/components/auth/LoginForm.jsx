import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Importa la instancia 'auth' desde firebaseConfig.js

function LoginForm({ onLoginSuccess }) { // Agregamos una prop para notificar al componente padre sobre el éxito
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Nuevo estado para controlar el estado de carga

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true); // Activa el estado de carga al iniciar la petición

    try {
      // Intenta iniciar sesión con Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // const user = userCredential.user; // Puedes acceder al objeto de usuario si lo necesitas

      setMessage('¡Inicio de sesión exitoso!');
      setEmail('');
      setPassword('');

      // Notifica al componente padre que el inicio de sesión fue exitoso
      if (onLoginSuccess) {
        onLoginSuccess(userCredential.user); // Pasa el objeto user al padre
      }

    } catch (err) {
      console.error("Error al iniciar sesión:", err);

      let errorMessage = "Error al iniciar sesión. Verifica tus credenciales.";
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = "Correo o contraseña incorrectos. Intenta de nuevo.";
          break;
        case 'auth/invalid-email':
          errorMessage = "El formato del correo electrónico es inválido.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Demasiados intentos de inicio de sesión fallidos. Intenta de nuevo más tarde.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Problema de conexión a la red. Por favor, verifica tu conexión a internet.";
          break;
        default:
          errorMessage = `Ocurrió un error inesperado: ${err.message}`;
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false); // Desactiva el estado de carga al finalizar (éxito o error)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Correo Electrónico:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              placeholder="tu@ejemplo.com"
              required
              disabled={loading} // Deshabilita el campo mientras carga
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              placeholder="********"
              required
              disabled={loading} // Deshabilita el campo mientras carga
            />
          </div>
          <button
            type="submit"
            disabled={loading} // Deshabilita el botón mientras carga
            className={`
              bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline transition duration-150 ease-in-out
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        {message && <p className="text-green-500 text-sm mt-4 text-center">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}

export default LoginForm;