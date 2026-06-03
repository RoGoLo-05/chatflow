'use client';

import { useState } from 'react';
import { login, register } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const data = await login(email, password);
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('username', data.username);
          router.push('/chat');
        } else {
          setError('Credenciales incorrectas');
        }
      } else {
        const data = await register(username, email, password);
        if (data.userId) {
          setIsLogin(true);
          setError('¡Cuenta creada! Ahora inicia sesión');
        } else {
          setError(data.message || 'Error al registrarse');
        }
      }
    } catch {
      setError('Error de conexión');
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-2">Chatflow</h1>
        <p className="text-gray-400 mb-8">
          {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
        </p>

        <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              isLogin ? 'bg-indigo-600 text-white' : 'text-gray-400'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              !isLogin ? 'bg-indigo-600 text-white' : 'text-gray-400'
            }`}
          >
            Registrarse
          </button>
        </div>

        {!isLogin && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 mb-6 outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {error && (
          <p className={`text-sm mb-4 ${error.includes('¡') ? 'text-green-400' : 'text-red-400'}`}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Crear cuenta'}
        </button>
      </div>
    </main>
  );
}