import { useState, useEffect } from 'react';
import { Tab } from './types';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import Finances from './components/Finances';
import Diet from './components/Diet';
import Workout from './components/Workout';
import AuthScreen from './components/AuthScreen';
import ProfileBottomSheet from './components/ProfileBottomSheet';
import { PlaceholderScreen } from './components/PlaceholderScreens';
import { motion, AnimatePresence } from 'motion/react';
import ScoreToast from './components/ScoreToast';
import PWAInstallBanner from './components/PWAInstallBanner';
import PWAUpdateToast from './components/PWAUpdateToast';
import GlobalStreakOverlay from './components/streaks/GlobalStreakOverlay';

import { useDietStore } from './stores/useDietStore';
import { subscribeToUserProfile } from './services/firestore';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import CheckinBottomSheet from './components/checkin/CheckinBottomSheet';
import { useCheckinGate } from './hooks/useCheckinGate';
import { auth } from './firebase';
import { generateTodayInstances } from './services/recurringService';

export default function App() {
  return (
    <AuthScreen>
      <AppContent />
    </AuthScreen>
  );
}

function AppContent() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('life');
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<string | null>(null);

  const { shouldShow: showCheckin, isLoading: loadingCheckin, setShouldShow: setCheckinShouldShow } = useCheckinGate(userProfile);

  useEffect(() => {
    if (!userProfile) return;
    
    const checkRisks = () => {
      const now = new Date();
      if (now.getHours() >= 20) {
        const today = now.toISOString().split('T')[0];
        const pillars = ['treino', 'dieta', 'agenda', 'financas', 'habitos', 'checkin'] as const;
        pillars.forEach(pillar => {
          const streak = userProfile.streaks?.[pillar];
          if (streak && streak.current >= 3 && streak.lastCompletedDate !== today) {
            import('./stores/useStreakStore').then(({ useStreakStore }) => {
              const { riskPillars, addRisk } = useStreakStore.getState();
              if (!riskPillars.find(r => r.pillar === pillar)) {
                addRisk(pillar, streak.current);
              }
            });
          }
        });
      }
    };
    
    const interval = setInterval(checkRisks, 60000);
    checkRisks();
    return () => clearInterval(interval);
  }, [userProfile]);

  useEffect(() => {
    // Regitser dynamic subscription to user profile
    const unsubscribe = subscribeToUserProfile((data) => {
      setUserProfile(data);
      setLoadingProfile(false);
    });

    // Inicializar persistência de dieta
    useDietStore.getState().init();

    if (auth.currentUser) {
      generateTodayInstances(auth.currentUser.uid).catch(console.error);
    }

    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<Tab>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('navigate', handleNavigate);
    
    return () => {
      unsubscribe();
      window.removeEventListener('navigate', handleNavigate);
    };
  }, []);

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00FF88]"></div>
      </div>
    );
  }

  // If onboarding is not completed, enforce the onboarding wizard
  const showOnboarding = !userProfile || userProfile.onboardingCompleted !== true;

  if (showOnboarding) {
    return (
      <OnboardingFlow 
        onComplete={() => {
          setUserProfile((prev: any) => ({
            ...prev,
            onboardingCompleted: true
          }));
        }} 
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'life':
        return <Dashboard onTabChange={setActiveTab} />;
      case 'agenda':
        return <Agenda />;
      case 'finances':
        return <Finances />;
      case 'diet':
        return <Diet />;
      case 'workout':
        return <Workout />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  const renderScreen = () => {
    if (!activeScreen) return null;
    
    const titles: Record<string, string> = {
      'account': 'Conta',
      'notifications': 'Notificações',
      'privacy': 'Privacidade',
      'export': 'Exportar Dados',
      'plan': 'Gerenciar Plano'
    };

    return (
      <PlaceholderScreen 
        title={titles[activeScreen] || activeScreen} 
        onBack={() => setActiveScreen(null)} 
      />
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden font-sans">
      <ScoreToast />
      <PWAUpdateToast />
      <GlobalStreakOverlay 
        onNavigate={(pillar) => {
          if (pillar === 'treino') setActiveTab('workout');
          if (pillar === 'dieta') setActiveTab('diet');
          if (pillar === 'financas') setActiveTab('finances');
          if (pillar === 'agenda') setActiveTab('agenda');
        }}
      />
      <TopBar onProfileClick={() => setIsProfileSheetOpen(true)} />
      
      <main className="flex-1 px-4 sm:px-6 pt-6 sm:pt-8 pb-32 max-w-2xl mx-auto w-full overflow-y-auto no-scrollbar safe-pl safe-pr">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <PWAInstallBanner />
      
      {showCheckin && userProfile && (
        <AnimatePresence>
          <CheckinBottomSheet 
            userProfile={userProfile} 
            onComplete={() => setCheckinShouldShow(false)} 
            onSkip={() => setCheckinShouldShow(false)} 
          />
        </AnimatePresence>
      )}

      <ProfileBottomSheet 
        isOpen={isProfileSheetOpen} 
        onClose={() => setIsProfileSheetOpen(false)} 
        onNavigate={(screen) => setActiveScreen(screen)}
      />

      <AnimatePresence>
        {activeScreen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[200] bg-[#131313]"
          >
            {renderScreen()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
