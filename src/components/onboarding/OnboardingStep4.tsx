import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  mainGoal: 'productivity' | 'muscle' | 'weightLoss' | 'wellness' | 'finance' | 'balanced';
  dailyCalorieGoal: number;
  onChangeCalorieGoal: (value: number) => void;
  currentWeight: number | null;
  onChangeWeight: (value: number | null) => void;
  height: number | null;
  onChangeHeight: (value: number | null) => void;
}

export default function OnboardingStep4({
  mainGoal,
  dailyCalorieGoal,
  onChangeCalorieGoal,
  currentWeight,
  onChangeWeight,
  height,
  onChangeHeight,
}: Props) {
  // Get recommendation based on user choice
  const getCalorieSuggestion = () => {
    switch (mainGoal) {
      case 'weightLoss':
        return 1800;
      case 'muscle':
        return 2800;
      case 'balanced':
        return 2200;
      default:
        return 2000;
    }
  };

  const suggestion = getCalorieSuggestion();

  // Set default suggestion on mount if calorie goal is not modified or zero
  useEffect(() => {
    if (dailyCalorieGoal === 0 || dailyCalorieGoal === 2000) {
      onChangeCalorieGoal(suggestion);
    }
  }, [mainGoal]);

  return (
    <div className="flex flex-col py-2 px-1 max-w-sm mx-auto w-full h-full select-none">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white leading-tight font-sans tracking-tight">
          Quase lá! Suas metas iniciais
        </h2>
        <p className="text-[#B9CBB9] text-[14px] font-medium mt-2">
          Você pode ajustar isso a qualquer momento
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Calorie Goal */}
        <div className="flex flex-col text-left">
          <label className="text-xs font-bold text-[#B9CBB9] uppercase tracking-widest mb-2 ml-1">
            Meta de calorias por dia
          </label>
          <input
            type="number"
            value={dailyCalorieGoal || ''}
            onChange={(e) => onChangeCalorieGoal(parseInt(e.target.value) || 0)}
            placeholder="2000"
            className="w-full bg-[#1C1B1B] border border-[#3B4B3D] focus:border-[#00FF88] rounded-xl py-3 px-5 text-white outline-none transition-colors font-medium h-[52px]"
          />
          <p className="text-[#B9CBB9] text-[11px] font-semibold mt-1.5 ml-1">
            Sugestão baseada no seu objetivo: <span className="text-[#00FF88]">{suggestion} kcal</span>
          </p>
        </div>

        {/* Current Weight */}
        <div className="flex flex-col text-left">
          <label className="text-xs font-bold text-[#B9CBB9] uppercase tracking-widest mb-2 ml-1">
            Meu peso atual (opcional)
          </label>
          <div className="relative">
            <input
              type="number"
              value={currentWeight === null ? '' : currentWeight}
              onChange={(e) => {
                const val = e.target.value;
                onChangeWeight(val === '' ? null : parseFloat(val) || null);
              }}
              placeholder="70"
              className="w-full bg-[#1C1B1B] border border-[#3B4B3D] focus:border-[#00FF88] rounded-xl py-3 pl-5 pr-12 text-white outline-none transition-colors font-medium h-[52px]"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#B9CBB9]/60">
              kg
            </span>
          </div>
          <p className="text-[#B9CBB9]/60 text-[10px] sm:text-[11px] mt-1 ml-1">
            Usado para acompanhar sua evolução
          </p>
        </div>

        {/* Height */}
        <div className="flex flex-col text-left">
          <label className="text-xs font-bold text-[#B9CBB9] uppercase tracking-widest mb-2 ml-1">
            Minha altura (opcional)
          </label>
          <div className="relative">
            <input
              type="number"
              value={height === null ? '' : height}
              onChange={(e) => {
                const val = e.target.value;
                onChangeHeight(val === '' ? null : parseInt(val) || null);
              }}
              placeholder="175"
              className="w-full bg-[#1C1B1B] border border-[#3B4B3D] focus:border-[#00FF88] rounded-xl py-3 pl-5 pr-12 text-white outline-none transition-colors font-medium h-[52px]"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#B9CBB9]/60">
              cm
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className="flex gap-3 bg-[#1C1B1B] border-l-3 border-[#00FF88] rounded-r-xl p-4 mt-2 border border-[#3B4B3D]/30 border-l-0">
          <Sparkles className="w-5 h-5 text-[#00FF88] shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-[#B9CBB9] font-medium text-left">
            Com base nas suas respostas, vou criar sua primeira rotina personalizada automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
