import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, UserPlus, Shield, AlertCircle, CheckCircle } from 'lucide-react';

const SECRET_PASSWORD = 'amadeus222';

export function UserRegistration() {
  const [secretPassword, setSecretPassword] = useState('');
  const [showSecretPassword, setShowSecretPassword] = useState(false);
  const [secretVerified, setSecretVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'admin' as 'admin' | 'secretary' | 'doctor'
  });

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretPassword === SECRET_PASSWORD) {
      setSecretVerified(true);
      setError(null);
    } else {
      setError('Contraseña secreta incorrecta');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined // Deshabilitar confirmación por email
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Crear perfil de usuario
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          is_active: true
        });

      if (profileError) throw profileError;

      setSuccess(`Usuario ${formData.full_name} creado exitosamente como ${formData.role}`);
      
      // Limpiar formulario
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'admin'
      });
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(`Error al crear usuario: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSecretVerified(false);
    setSecretPassword('');
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'admin'
    });
    setError(null);
    setSuccess(null);
  };

  if (!secretVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/Logo-corg.png" 
                alt="CORG Logo" 
                className="h-20 w-auto"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Registro de Usuario Administrador
            </h1>
            <p className="text-gray-600">
              Ingrese la contraseña secreta para continuar
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSecretSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Secreta
                </label>
                <div className="relative">
                  <input
                    type={showSecretPassword ? 'text' : 'password'}
                    required
                    value={secretPassword}
                    onChange={(e) => setSecretPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Ingrese contraseña secreta"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretPassword(!showSecretPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showSecretPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                <Shield className="h-5 w-5" />
                Verificar Acceso
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/Logo-corg.png" 
              alt="CORG Logo" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Crear Nuevo Usuario
          </h1>
          <p className="text-gray-600">
            Complete los datos del nuevo usuario
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleUserSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Juan Pérez"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="usuario@corg.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="••••••••"
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                disabled={loading}
              >
                <option value="admin">Administrador</option>
                <option value="secretary">Secretaria</option>
                <option value="doctor">Médico</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Crear Usuario
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Volver
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}