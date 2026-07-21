import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Props {
  onComplete: () => void;
}

export default function OnboardingLoading({ onComplete }: Props) {
  const messages = [
    'Criando seu perfil...',
    'Configurando seus hábitos...',
    'Montando sua agenda...',
    'Quase pronto...',
  ];

  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Text Rotation every 1.2 seconds to fit 3 seconds total nicely
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1000);

    // 2. Smooth Progress Loading over 3 seconds (3000ms)
    const startTime = Date.now();
    const duration = 3000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(calculatedProgress);

      if (elapsed >= duration) {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        onComplete();
      }
    }, 30);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#131313] z-[500] flex flex-col items-center justify-center p-6 select-none">
      {/* PulseOS Logo Pulse Animation */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
          boxShadow: [
            '0 0 20px rgba(0, 255, 136, 0.15)',
            '0 0 40px rgba(0, 255, 136, 0.35)',
            '0 0 20px rgba(0, 255, 136, 0.15)',
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-24 h-24 bg-gradient-to-tr from-[#00E479] to-[#00FF88] rounded-3xl flex items-center justify-center mb-10"
      >
        <span className="material-symbols-outlined text-[52px] text-[#003919] font-black">monitoring</span>
      </motion.div>

      {/* Rotating Status Message */}
      <div className="h-6 mb-6 overflow-hidden flex justify-center items-center">
        <motion.p
          key={messageIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="text-white font-bold text-base font-sans tracking-wide"
        >
          {messages[messageIndex]}
        </motion.p>
      </div>

      {/* Progress Container */}
      <div className="w-full max-w-[280px]">
        {/* Progress Track */}
        <div className="bg-[#2A2A2A] h-1.5 rounded-full overflow-hidden w-full relative">
          {/* Progress Fill */}
          <div
            className="bg-gradient-to-r from-[#00E479] to-[#00FF88] h-full rounded-full transition-all duration-[30ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Percentage text */}
        <p className="text-[#B9CBB9]/60 text-xs font-bold font-mono tracking-wider text-center mt-3 uppercase">
          CARREGANDO {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}
