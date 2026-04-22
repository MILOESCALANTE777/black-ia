import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { getCurrentUser, createUserProfile, getUserProfile } from '@/lib/supabase';

export default function PersonalizingScreen() {
  const { setOnboardingComplete, experience, market, tradingStyle, detailLevel, setUser } = useStore();
  const [status, setStatus] = useState('Guardando tu perfil...');

  useEffect(() => {
    const saveProfile = async () => {
      try {
        setStatus('Guardando tu perfil...');
        
        // Obtener usuario actual
        const user = await getCurrentUser();
        if (!user) {
          console.error('No user found');
          setOnboardingComplete();
          return;
        }

        // Verificar si ya existe el perfil
        const existingProfile = await getUserProfile(user.id);
        
        if (!existingProfile) {
          // Crear perfil nuevo
          setStatus('Creando tu perfil personalizado...');
          
          const profileData = {
            experience_level: experience as any || 'beginner',
            trading_style: tradingStyle as any || 'day_trader',
            preferred_markets: market || [],
            risk_tolerance: detailLevel === 'detailed' ? 'conservative' : detailLevel === 'balanced' ? 'moderate' : 'aggressive',
            trading_goals: 'Mejorar mis habilidades de trading',
            preferred_timeframes: ['1h', '4h', '1day'],
            max_risk_per_trade: 2,
            preferred_rr_ratio: 2,
          };

          const profile = await createUserProfile(user.id, user.email || '', profileData);
          setUser(profile);
        } else {
          setUser(existingProfile);
        }

        setStatus('¡Listo! Preparando tu experiencia...');
        
        setTimeout(() => {
          setOnboardingComplete();
        }, 1500);
      } catch (error) {
        console.error('Error saving profile:', error);
        // Continuar de todos modos
        setTimeout(() => {
          setOnboardingComplete();
        }, 1000);
      }
    };

    saveProfile();
  }, [setOnboardingComplete, experience, market, tradingStyle, detailLevel, setUser]);

  return (
    <div className="flex-1 flex items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-8 py-5 rounded-full flex items-center gap-3"
        style={{
          background: '#1C1C1E',
          border: '1px solid #38383A',
        }}
      >
        <span className="text-white font-medium">{status}</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-white"
              animate={{ scale: [0, 1, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
