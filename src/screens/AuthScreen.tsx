import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { signIn, signUp } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

export default function AuthScreen() {
  const navigate = useStore((s) => s.navigate);
  
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }

        await signUp(email, password);
        // Después del signup, ir al onboarding
        navigate('OnboardingFeaturesScreen');
      } else {
        await signIn(email, password);
        // Después del login, ir al home
        navigate('HomeScreen');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <TrendingUp size={32} color="#FFFFFF" strokeWidth={2.5} />
          <span className="text-2xl font-bold text-white">PROFIT AI</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
            </h1>
            <p className="text-sm text-[#636366]">
              {mode === 'login'
                ? 'Inicia sesión para continuar'
                : 'Regístrate para empezar a analizar'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs text-[#636366] block mb-2">Email</label>
              <div className="relative">
                <Mail
                  size={18}
                  color="#636366"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white text-sm outline-none bg-[#1C1C1E] border border-[#38383A] focus:border-[#007AFF] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-[#636366] block mb-2">Contraseña</label>
              <div className="relative">
                <Lock
                  size={18}
                  color="#636366"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl text-white text-sm outline-none bg-[#1C1C1E] border border-[#38383A] focus:border-[#007AFF] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#636366" />
                  ) : (
                    <Eye size={18} color="#636366" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (solo en signup) */}
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-[#636366] block mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    color="#636366"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white text-sm outline-none bg-[#1C1C1E] border border-[#38383A] focus:border-[#007AFF] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-[#FF3B3015] border border-[#FF3B3030]"
              >
                <p className="text-xs text-[#FF3B30]">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full font-bold text-base text-white bg-gradient-to-r from-[#007AFF] to-[#AF52DE] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
            >
              {loading
                ? 'Cargando...'
                : mode === 'login'
                ? 'Iniciar Sesión'
                : 'Crear Cuenta'}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
              className="text-sm text-[#007AFF] font-medium"
            >
              {mode === 'login'
                ? '¿No tienes cuenta? Regístrate'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>

          {/* Forgot Password (solo en login) */}
          {mode === 'login' && (
            <div className="mt-4 text-center">
              <button className="text-xs text-[#636366]">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-[#38383A]">
            Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad
          </p>
        </div>
      </div>
    </div>
  );
}
