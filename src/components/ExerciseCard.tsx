import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkoutExercise } from '../types';
import { ChevronDown, ChevronUp, Play, Dumbbell, Search } from 'lucide-react';
import { WorkoutXExercise, searchExercisesByName } from '../services/workoutXService';

interface Props {
  key?: any;
  exercise: WorkoutExercise;
  onToggle: () => void;
  onRequestGifSearch: () => void;
}

export default function ExerciseCard({ exercise, onToggle, onRequestGifSearch }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [details, setDetails] = useState<WorkoutXExercise | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false);

  useEffect(() => {
    if (isExpanded && exercise.name && !details && exercise.gifUrl && !hasImageError) {
      const fetchDetails = async () => {
        setLoadingDetails(true);
        const results = await searchExercisesByName(exercise.name);
        if (results && results.length > 0) {
          // Find closest match or just first
          const match = results.find(r => r.gifUrl === exercise.gifUrl) || results[0];
          setDetails(match);
        }
        setLoadingDetails(false);
      };
      fetchDetails();
    }
  }, [isExpanded, exercise.name, exercise.gifUrl, details]);

  return (
    <motion.div 
      className={`group relative overflow-hidden rounded-2xl transition-all border ${
        exercise.completed 
          ? 'bg-primary-container/5 border-primary-container/20 shadow-none' 
          : 'bg-surface-container-low border-white/5 shadow-lg'
      }`}
    >
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center transition-all ${
            exercise.completed 
              ? 'bg-primary-container text-[#131313] scale-110 shadow-[0_0_15px_rgba(0,255,136,0.4)]' 
              : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
            {exercise.completed ? 'check' : ''}
          </span>
        </button>

        {exercise.gifUrl && !hasImageError ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0">
            <img src={exercise.gifUrl} alt={exercise.name} onError={() => setHasImageError(true)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Play className="w-4 h-4 text-[#00FF88] opacity-70" fill="currentColor" />
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
            <Dumbbell className="w-4 h-4 text-[#353534]" />
          </div>
        )}

        <div className="flex-1">
          <h5 className={`font-headline font-bold text-sm leading-tight transition-all ${exercise.completed ? 'text-on-surface-variant line-through' : 'text-white'}`}>
            {exercise.name}
          </h5>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 border-white/5">
              <span className={`font-black text-xs ${exercise.completed ? 'text-on-surface-variant' : 'text-primary-container'}`}>{exercise.sets}</span>
              <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">Séries</span>
            </div>
            <span className="text-on-surface-variant text-[10px]">•</span>
            <div className="flex items-center gap-1.5 border-white/5">
              <span className={`font-black text-xs ${exercise.completed ? 'text-on-surface-variant' : 'text-primary-container'}`}>{exercise.reps}</span>
              <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">Reps</span>
            </div>
          </div>
        </div>

        <div className="p-2 text-on-surface-variant">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden bg-[#131313]"
          >
            <div className="p-4 border-t border-white/5">
              {exercise.gifUrl && !hasImageError ? (
                <div className="flex flex-col gap-4">
                  <div className="relative w-full max-h-[280px] bg-[#0E0E0E] rounded-xl overflow-hidden flex items-center justify-center min-h-[160px]">
                    {loadingDetails && !details ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-[#2A2A2A] animate-pulse"
                      />
                    ) : (
                      <img src={exercise.gifUrl} onError={() => setHasImageError(true)} alt={exercise.name} className="w-full h-full object-contain max-h-[280px]" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  
                  {(details || exercise.muscles) && (
                    <div className="flex flex-wrap gap-2">
                       <span className="px-3 py-1 bg-[#00FF88]/10 text-[#00FF88] rounded-full text-[11px] font-bold uppercase">
                         {details?.target || exercise.muscles}
                       </span>
                       {details?.equipment && (
                         <span className="px-3 py-1 bg-[#2A2A2A] text-[#B9CBB9] rounded-full text-[11px] font-bold uppercase">
                           {details.equipment}
                         </span>
                       )}
                       {details?.difficulty && (
                         <span className="px-3 py-1 bg-[#2A2A2A] text-[#B9CBB9] rounded-full text-[11px] font-bold uppercase">
                           {details.difficulty}
                         </span>
                       )}
                       {(details?.calorieEstimate || exercise.caloriesBurned) ? (
                         <span className="px-3 py-1 bg-[#2A2A2A] text-[#FFD166] rounded-full text-[11px] font-bold uppercase">
                           {(details?.calorieEstimate || exercise.caloriesBurned)} kcal/set
                         </span>
                       ) : null}
                    </div>
                  )}

                  {details?.instructions && details.instructions.length > 0 && (
                    <div className="bg-[#1C1B1B] rounded-xl p-4 mt-2">
                      <p className="text-[10px] tracking-widest text-[#B9CBB9] font-bold uppercase mb-3">Como Fazer</p>
                      <div className="flex flex-col gap-2">
                        {(showAllSteps ? details.instructions : details.instructions.slice(0, 4)).map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-[#00FF88] text-[13px] font-bold leading-relaxed">{idx + 1}.</span>
                            <p className="text-[#B9CBB9] text-[13px] leading-relaxed flex-1">{step}</p>
                          </div>
                        ))}
                      </div>
                      {details.instructions.length > 4 && !showAllSteps && (
                        <button 
                          onClick={() => setShowAllSteps(true)}
                          className="mt-3 text-[#00FF88] text-xs font-bold hover:underline transition-all"
                        >
                          Ver todos os passos
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full py-8 flex flex-col items-center justify-center bg-[#131313] gap-3">
                  <Dumbbell className="w-8 h-8 text-[#353534]" />
                  <p className="text-xs text-[#B9CBB9] font-medium">GIF indisponível</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestGifSearch();
                    }}
                    className="mt-2 bg-transparent text-[#B9CBB9] px-4 py-2 rounded-lg font-bold text-xs transition-colors flex items-center gap-2 border border-[#3B4B3D] hover:bg-[#2A2A2A]"
                  >
                    <Search className="w-4 h-4" />
                    Buscar GIF
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
