import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useLifeScoreStore } from '../stores/useLifeScoreStore';
import { subscribeToUserProfile } from '../services/firestore';
import { auth } from '../firebase';

export default function LifeScoreRing() {
  const { score, setScore } = useLifeScoreStore();
  const [dbScore, setDbScore] = useState(score);

  useEffect(() => {
    const unsub = subscribeToUserProfile((data) => {
      if (data && data.lifeScore !== undefined) {
          setDbScore(data.lifeScore);
          useLifeScoreStore.getState().setScore(data.lifeScore, data.scoreBreakdown || null, 0);
      }
    });
    return () => unsub();
  }, []);

  const currentScore = dbScore || score;
  const scoreMotion = useMotionValue(0);

  useEffect(() => {
    const controls = animate(scoreMotion, currentScore, {
      duration: 0.8,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [currentScore, scoreMotion]);

  const displayScore = useTransform(scoreMotion, (v) => Math.round(v).toString());
  
  const ringOffset = useTransform(scoreMotion, (v) => 628 - (628 * v) / 100);

  const ringColor = useTransform(scoreMotion, (v) => {
    if (v < 40) return '#FF4D4D';
    if (v < 60) return '#FF9F43';
    if (v < 80) return '#FFD166';
    return '#00FF88';
  });

  return (
    <section className="relative overflow-hidden mb-10">
      <div className="bg-surface-container-low rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container/5 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-container/5 rounded-full blur-[80px]"></div>
        
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle className="text-surface-container-highest" cx="112" cy="112" fill="transparent" r="100" stroke="currentColor" strokeWidth="12"></circle>
            <motion.circle 
              style={{ 
                strokeDashoffset: ringOffset,
                stroke: ringColor,
                filter: useTransform(scoreMotion, v => `drop-shadow(0 0 15px ${v >= 80 ? 'rgba(0,255,136,0.3)' : 'rgba(0,0,0,0)'})`)
              }}
              className="transition-shadow" 
              cx="112" cy="112" fill="transparent" r="100" strokeDasharray="628" strokeLinecap="round" strokeWidth="12"
            ></motion.circle>
          </svg>
          <div className="flex flex-col items-center">
            <motion.span className="text-6xl sm:text-7xl lg:text-8xl font-black text-white font-headline tracking-tighter">
              {displayScore}
            </motion.span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mt-1">Life Score</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-white italic">MANTENHA O MOMENTUM.</h2>
          <p className="text-on-surface-variant mt-2 text-sm sm:text-base max-w-[240px]">
            {currentScore >= 60 ? 'Seu desempenho está excelente!' : 'Continue focado nos seus pilares.'}
          </p>
        </div>
      </div>
    </section>
  );
}
