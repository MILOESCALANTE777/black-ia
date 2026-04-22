import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { getCurrentUser, getUserProfile, isSupabaseConfigured } from '@/lib/supabase';
import BottomNavigation from '@/components/BottomNavigation';
import SidebarNavigation from '@/components/SidebarNavigation';
import SplashScreen from '@/screens/SplashScreen';
import LandingScreen from '@/screens/LandingScreen';
import AuthScreen from '@/screens/AuthScreen';
import OnboardingFeaturesScreen from '@/screens/OnboardingFeaturesScreen';
import ExperienceSelectScreen from '@/screens/ExperienceSelectScreen';
import MarketSelectScreen from '@/screens/MarketSelectScreen';
import StyleSelectScreen from '@/screens/StyleSelectScreen';
import DetailSelectScreen from '@/screens/DetailSelectScreen';
import TradingLevelScreen from '@/screens/TradingLevelScreen';
import PersonalizingScreen from '@/screens/PersonalizingScreen';
import HomeScreen from '@/screens/HomeScreen';
import AIBrainScreen from '@/screens/AIBrainScreen';
import AnalyzeScreen from '@/screens/AnalyzeScreen';
import MarketsScreen from '@/screens/MarketsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import GamePlanDetailScreen from '@/screens/GamePlanDetailScreen';
import SLTPDetailScreen from '@/screens/SLTPDetailScreen';
import JournalScreen from '@/screens/JournalScreen';
import ReviewPromptScreen from '@/screens/ReviewPromptScreen';
import GoldAnalysisScreen from '@/screens/QuantScreen';
import NewsSignalsScreen from '@/screens/NewsSignalsScreen';

const TAB_ROOT_SCREENS = [
  'HomeScreen',
  'AIBrainScreen',
  'AnalyzeScreen',
  'MarketsScreen',
  'ProfileScreen',
  'GoldAnalysisScreen',
  'NewsSignalsScreen',
];

const ONBOARDING_SCREENS = [
  'SplashScreen',
  'LandingScreen',
  'OnboardingFeaturesScreen',
  'ExperienceSelectScreen',
  'MarketSelectScreen',
  'StyleSelectScreen',
  'DetailSelectScreen',
  'TradingLevelScreen',
  'PersonalizingScreen',
];

function ScreenRouter() {
  const currentScreen = useStore((s) => s.currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SplashScreen': return <SplashScreen />;
      case 'LandingScreen': return <LandingScreen />;
      case 'AuthScreen': return <AuthScreen />;
      case 'OnboardingFeaturesScreen': return <OnboardingFeaturesScreen />;
      case 'ExperienceSelectScreen': return <ExperienceSelectScreen />;
      case 'MarketSelectScreen': return <MarketSelectScreen />;
      case 'StyleSelectScreen': return <StyleSelectScreen />;
      case 'DetailSelectScreen': return <DetailSelectScreen />;
      case 'TradingLevelScreen': return <TradingLevelScreen />;
      case 'PersonalizingScreen': return <PersonalizingScreen />;
      case 'HomeScreen': return <HomeScreen />;
      case 'AIBrainScreen': return <AIBrainScreen />;
      case 'AnalyzeScreen': return <AnalyzeScreen />;
      case 'MarketsScreen': return <MarketsScreen />;
      case 'ProfileScreen': return <ProfileScreen />;
      case 'GamePlanDetailScreen': return <GamePlanDetailScreen />;
      case 'SLTPDetailScreen': return <SLTPDetailScreen />;
      case 'JournalScreen': return <JournalScreen />;
      case 'GoldAnalysisScreen': return <GoldAnalysisScreen />;
      case 'NewsSignalsScreen': return <NewsSignalsScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentScreen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col min-h-0"
      >
        {renderScreen()}
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const currentScreen = useStore((s) => s.currentScreen);
  const showReviewPrompt = useStore((s) => s.showReviewPrompt);
  const setUser = useStore((s) => s.setUser);
  const navigate = useStore((s) => s.navigate);
  const theme = useStore((s) => s.theme);

  // Aplicar tema al DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Verificar autenticación al iniciar
  useEffect(() => {
    const checkAuth = async () => {
      // Si Supabase no está configurado, saltar verificación
      if (!isSupabaseConfigured) {
        console.log('ℹ️ Supabase no configurado, modo sin autenticación');
        return;
      }

      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getUserProfile(user.id);
          if (profile) {
            setUser(profile);
            console.log('✅ Usuario autenticado:', profile.email);
            if (currentScreen === 'SplashScreen' || currentScreen === 'LandingScreen') {
              setTimeout(() => {
                navigate('HomeScreen');
              }, 2000);
            }
          }
        } else {
          console.log('ℹ️ No hay usuario autenticado');
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
      }
    };

    checkAuth();
  }, []);

  const showNav = TAB_ROOT_SCREENS.includes(currentScreen);
  const isOnboarding = ONBOARDING_SCREENS.includes(currentScreen);

  return (
    <div className="h-[100dvh] w-full bg-black flex overflow-hidden">
      {/* Sidebar — desktop only, only on main app screens */}
      {showNav && <SidebarNavigation />}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0">
          <ScreenRouter />
        </main>

        {/* Review Prompt Modal */}
        <AnimatePresence>
          {showReviewPrompt && <ReviewPromptScreen />}
        </AnimatePresence>

        {/* Bottom Navigation — mobile only */}
        <AnimatePresence>
          {showNav && (
            <motion.div
              className="md:hidden"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <BottomNavigation />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
