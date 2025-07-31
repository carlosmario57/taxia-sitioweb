import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
// ¡IMPORTANTE! La ruta ahora apunta dos niveles arriba para encontrar firebaseConfig.js
import { auth } from '../../firebaseConfig'; 

// Componente LoginForm: Permite a los usuarios iniciar sesión con correo y contraseña de Firebase.
// Recibe:
// - onLoginSuccess: Función para notificar al componente padre (App.jsx) sobre el éxito del login.
// - setMessage (prop): Función para actualizar el mensaje global de éxito en App.jsx.
// - setError (prop): Función para actualizar el mensaje global de error en App.jsx.
function LoginForm({ onLoginSuccess, setMessage, setError }) { // Recibe los setters de mensajes globales
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Los estados 'message' y 'error' locales se eliminan ya que se usarán los globales pasados por props
  const [loading, setLoading] = useState(false); // Estado para controlar el estado de carga de la petición

  /**
   * Maneja el envío del formulario de inicio de sesión.
   * Intenta autenticar al usuario con Firebase y maneja los estados de éxito/error.
   * @param {Event} e - El evento de envío del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage(''); // Limpia mensajes globales de éxito antes de un nuevo intento
    setError('');   // Limpia mensajes globales de error antes de un nuevo intento

    // Validación básica de campos obligatorios
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true); // Activa el estado de carga al iniciar la petición

    try {
      // Intenta iniciar sesión con Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // Objeto de usuario autenticado

      setMessage('¡Inicio de sesión exitoso!'); // Establece el mensaje global de éxito
      setEmail(''); // Limpia el campo de email
      setPassword(''); // Limpia el campo de contraseña

      // Notifica al componente padre (App.jsx) que el inicio de sesión fue exitoso
      if (onLoginSuccess) {
        onLoginSuccess(user); // Pasa el objeto user al padre
      }

    } catch (err) {
      console.error("Error al iniciar sesión:", err);

      let errorMessage = "Error al iniciar sesión. Verifica tus credenciales.";
      // Manejo de errores específicos de Firebase Authentication para mensajes más amigables
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // Error genérico para credenciales incorrectas
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
      setError(errorMessage); // Establece el mensaje global de error
    } finally {
      setLoading(false); // Desactiva el estado de carga al finalizar (éxito o error)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md transform hover:scale-105 transition-transform duration-300">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          {/* Campo Correo Electrónico */}
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
          {/* Campo Contraseña */}
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
          {/* Botón de Iniciar Sesión */}
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
        {/* Los mensajes de éxito y error ahora se mostrarán a nivel global en App.jsx */}
        {/* Puedes descomentar las siguientes líneas si quieres un feedback adicional local,
            pero el feedback principal ya lo gestiona App.jsx */}
        {/* {message && <p className="text-green-500 text-sm mt-4 text-center">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>} */}
      </div>
    </div>
  );
}

export default LoginForm;
