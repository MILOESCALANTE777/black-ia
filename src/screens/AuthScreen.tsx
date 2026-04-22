import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
        if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); setLoading(false); return; }
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); setLoading(false); return; }
        await signUp(email, password);
        navigate('OnboardingFeaturesScreen');
      } else {
        await signIn(email, password);
        navigate('HomeScreen');
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: 12,
    width: '100%',
    padding: '14px 16px 14px 44px',
    fontSize: 14,
    outline: 'none',
  };

  return (
    <div className="flex-1 flex flex-col theme-bg-app">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <TrendingUp size={32} strokeWidth={2.5} style={{ color: 'var(--text-primary)' }} />
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>PROFIT AI</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {mode === 'login' ? 'Inicia sesión para continuar' : 'Regístrate para empezar a analizar'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs block mb-2" style={{ color: 'var(--text-muted)' }}>Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com" required style={inputStyle} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs block mb-2" style={{ color: 'var(--text-muted)' }}>Contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  required minLength={6} style={{ ...inputStyle, paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showPassword
                    ? <EyeOff size={18} style={{ color: 'var(--text-muted)' }} />
                    : <Eye size={18} style={{ color: 'var(--text-muted)' }} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            {mode === 'signup' && (
              <div>
                <label className="text-xs block mb-2" style={{ color: 'var(--text-muted)' }}>Confirmar Contraseña</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                    required minLength={6} style={inputStyle} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl" style={{ background: 'rgba(215,0,21,0.1)', border: '1px solid rgba(215,0,21,0.25)' }}>
                <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-full font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#FFFFFF' }}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-sm font-medium" style={{ color: 'var(--blue)' }}>
              {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <button className="text-xs" style={{ color: 'var(--text-muted)' }}>¿Olvidaste tu contraseña?</button>
            </div>
          )}
        </motion.div>

        <div className="mt-12 text-center">
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad
          </p>
        </div>
      </div>
    </div>
  );
}
