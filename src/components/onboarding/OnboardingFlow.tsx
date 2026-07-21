import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, X } from 'lucide-react';
import { logout, auth } from '../../firebase';
import { finishOnboarding } from '../../services/onboardingService';

import OnboardingStep1 from './OnboardingStep1';
import OnboardingStep2 from './OnboardingStep2';
import OnboardingStep3 from './OnboardingStep3';
import OnboardingStep4 from './OnboardingStep4';
import OnboardingLoading from './OnboardingLoading';
import OnboardingSuccess from './OnboardingSuccess';

interface Props {
  onComplete: () => void;
}

type StepType = 1 | 2 | 3 | 4 | 'loading' | 'success';

export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState<StepType>(1);
  const [name, setName] = useState('');
  const [mainGoal, setMainGoal] = useState<'productivity' | 'muscle' | 'weightLoss' | 'wellness' | 'finance' | 'balanced' | ''>('');
  const [wakeUpTime, setWakeUpTime] = useState('06:30');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState(2000);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  // 1. Exit and resume logic: Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pwa_onboarding_temp_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) setName(parsed.name);
        if (parsed.mainGoal) setMainGoal(parsed.mainGoal);
        if (parsed.wakeUpTime) setWakeUpTime(parsed.wakeUpTime);
        if (parsed.sleepTime) setSleepTime(parsed.sleepTime);
        if (parsed.mealsPerDay) setMealsPerDay(parsed.mealsPerDay);
        if (parsed.workoutsPerWeek) setWorkoutsPerWeek(parsed.workoutsPerWeek);
        if (parsed.dailyCalorieGoal) setDailyCalorieGoal(parsed.dailyCalorieGoal);
        if (parsed.currentWeight) setCurrentWeight(parsed.currentWeight);
        if (parsed.height) setHeight(parsed.height);
        
        // Only load step if it is valid step number and not currently 'loading'
        if (parsed.step && [1, 2, 3, 4].includes(parsed.step)) {
          setStep(parsed.step);
        }
      } catch (e) {
        console.error('Error parsing loaded onboarding state:', e);
      }
    }
  }, []);

  // 2. Save progress to localStorage whenever an input changes
  useEffect(() => {
    if (typeof step === 'number') {
      const dataToSave = {
        step,
        name,
        mainGoal,
        wakeUpTime,
        sleepTime,
        mealsPerDay,
        workoutsPerWeek,
        dailyCalorieGoal,
        currentWeight,
        height
      };
      localStorage.setItem('pwa_onboarding_temp_data', JSON.stringify(dataToSave));
    }
  }, [step, name, mainGoal, wakeUpTime, sleepTime, mealsPerDay, workoutsPerWeek, dailyCalorieGoal, currentWeight, height]);

  // Validation rules for each step
  const isStepValid = () => {
    switch (step) {
      case 1:
        return name.trim().length >= 2;
      case 2:
        return mainGoal !== '';
      case 3:
        return wakeUpTime !== '' && sleepTime !== '';
      case 4:
        return dailyCalorieGoal > 0;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!isStepValid()) return;

    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      // Trigger API / Onboarding submission & change to loading
      setStep('loading');
      
      const currentUserId = auth.currentUser?.uid;
      if (currentUserId) {
        try {
          await finishOnboarding(currentUserId, {
            name,
            mainGoal: mainGoal as any,
            wakeUpTime,
            sleepTime,
            mealsPerDay,
            workoutsPerWeek,
            dailyCalorieGoal,
            currentWeight,
            height
          });
        } catch (err) {
          console.error("Failed completing onboarding Firestore update:", err);
        }
      }
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  const handleExit = async () => {
    // Logging out returns user safely to authenticate screen, keeping their local saved onboarding state intact for next login
    await logout();
  };

  const handleLoadingComplete = () => {
    setStep('success');
  };

  const handleSuccessComplete = () => {
    // Clear temp storage state
    localStorage.removeItem('pwa_onboarding_temp_data');
    onComplete();
  };

  // Render correct sub-screen based on current step
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <OnboardingStep1 
            name={name} 
            onChangeName={setName} 
          />
        );
      case 2:
        return (
          <OnboardingStep2 
            userName={name} 
            selectedGoal={mainGoal} 
            onSelectGoal={(val) => setMainGoal(val)} 
          />
        );
      case 3:
        return (
          <OnboardingStep3 
            wakeUpTime={wakeUpTime}
            onChangeWakeUpTime={setWakeUpTime}
            sleepTime={sleepTime}
            onChangeSleepTime={setSleepTime}
            mealsPerDay={mealsPerDay}
            onChangeMealsPerDay={setMealsPerDay}
            workoutsPerWeek={workoutsPerWeek}
            onChangeWorkoutsPerWeek={setWorkoutsPerWeek}
          />
        );
      case 4:
        return (
          <OnboardingStep4 
            mainGoal={mainGoal as any}
            dailyCalorieGoal={dailyCalorieGoal}
            onChangeCalorieGoal={setDailyCalorieGoal}
            currentWeight={currentWeight}
            onChangeWeight={setCurrentWeight}
            height={height}
            onChangeHeight={setHeight}
          />
        );
      default:
        return null;
    }
  };

  if (step === 'loading') {
    return <OnboardingLoading onComplete={handleLoadingComplete} />;
  }

  if (step === 'success') {
    return <OnboardingSuccess onStart={handleSuccessComplete} />;
  }

  // Calculate generic active fractional progress out of 4 steps
  const activeStepNumber = step as number;
  const progressPercent = (activeStepNumber / 4) * 100;

  return (
    <div className="fixed inset-0 bg-[#131313] z-[400] flex flex-col justify-between select-none safe-pt safe-pb font-sans">
      
      {/* 1. FIXED HEADER */}
      <header className="px-5 py-4 flex flex-col gap-4 border-b border-white/5 bg-[#131313] shrink-0">
        <div className="flex items-center justify-between w-full h-8">
          {/* Back button */}
          {activeStepNumber > 1 ? (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#B9CBB9] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8" />
          )}

          {/* Step Indicator */}
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B9CBB9] select-none">
            Configuração {activeStepNumber} de 4
          </span>

          {/* Exit/Cancel button */}
          <button
            onClick={handleExit}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#B9CBB9] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Sair e concluir mais tarde"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="w-full bg-[#1C1B1B] h-1.5 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="h-full bg-gradient-to-r from-[#00E479] to-[#00FF88] rounded-full"
          />
        </div>
      </header>

      {/* 2. DYNAMIC CONTENT CONTAINER (CENTRALIZED) */}
      <main className="flex-1 overflow-y-auto px-6 py-8 flex flex-col justify-center items-center h-full max-w-md mx-auto w-full no-scrollbar">
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStepNumber}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 3. FIXED CTA FOOTER */}
      <footer className="px-6 py-5 border-t border-white/5 bg-[#131313] shrink-0">
        <div className="max-w-md mx-auto w-full">
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className={`w-full py-4 font-black tracking-widest uppercase text-[12px] rounded-2xl transition-all border outline-none ${
              isStepValid()
                ? 'bg-gradient-to-r from-[#00E479] to-[#00FF88] text-[#131313] shadow-[0_12px_24px_rgba(0,180,82,0.15)] border-white/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                : 'bg-white/5 border-transparent text-[#B9CBB9]/30 pointer-events-none'
            }`}
          >
            {activeStepNumber === 4 ? 'Gerar minha rotina de aço' : 'Continuar'}
          </button>
        </div>
      </footer>
    </div>
  );
}
