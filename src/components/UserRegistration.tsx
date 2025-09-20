import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

interface UserRegistrationProps {
  onBack: () => void;
}

export function UserRegistration({ onBack }: UserRegistrationProps) {
  const [formData, setFormData] = useState({
    email: 'm.sedacca@gmail.com',
    password: 'admin1234',
    fullName: 'Administrador'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Creando usuario administrador...');
      
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined // Deshabilitar confirmación por email
        }
      });

      if (authError) {
        console.error('Error creando usuario:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      console.log('Usuario creado en Auth:', authData.user.id);

      // 2. Crear perfil de usuario
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          role: 'admin',
          is_active: true
        });

      if (profileError) {
        console.error('Error creando perfil:', profileError);
        throw profileError;
      }

      console.log('Perfil creado exitosamente');
      setSuccess(true);

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        onBack();
      }, 2000);

    } catch (err: any) {
      console.error('Error en registro:', err);
      if (err.message.includes('User already registered')) {
        setError('Este email ya está registrado. Intente iniciar sesión.');
      } else if (err.message.includes('Password should be at least')) {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError(`Error al crear usuario: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Usuario Creado Exitosamente!
            </h2>
            <p className="text-gray-600 mb-4">
              El usuario administrador ha sido creado correctamente.
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo al login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/Logo-corg.png" 
              alt="CORG Logo" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Crear Usuario Administrador
          </h1>
          <p className="text-gray-600">
            Configure el primer usuario del sistema
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Nombre del administrador"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="admin@corg.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Contraseña segura"
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
                Volver
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Información del Usuario Administrador:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Acceso completo al sistema</li>
              <li>• Puede gestionar todos los módulos</li>
              <li>• Puede crear y administrar otros usuarios</li>
              <li>• Sin restricciones de permisos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}