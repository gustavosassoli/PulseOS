import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDietAIStore } from '../stores/useDietAIStore';
import { generateDietWithAI, GeneratedDiet } from '../services/DietAIService';
import { MealCard } from './MealCard';

interface DietAIScreenProps {
  onClose: () => void;
  onAdoptDiet: (diet: GeneratedDiet) => void;
}

export function DietAIScreen({ onClose, onAdoptDiet }: DietAIScreenProps) {
  const { profile, setProfile, addToHistory, activeDiet } = useDietAIStore();
  
  const [customRequest, setCustomRequest] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDiet, setGeneratedDiet] = useState<GeneratedDiet | null>(null);
  const [error, setError] = useState('');

  const [step, setStep] = useState<'profile' | 'result'>(
    'profile'
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const result = await generateDietWithAI(profile, customRequest);
      setGeneratedDiet(result);
      addToHistory(result);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar dieta');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 bg-[#131313] overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto p-6 min-h-screen pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">auto_awesome</span>
            <h2 className="font-headline font-bold text-white text-xl">IA Nutricional</h2>
          </div>
          <div className="w-10" />
        </div>

        <AnimatePresence mode="wait">
          {step === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 space-y-5">
                <h3 className="font-bold text-white text-lg">Seu Perfil Atual</h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Objetivo</label>
                    <select 
                      value={profile.objective}
                      onChange={(e) => setProfile({ objective: e.target.value })}
                      className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary-container transition-all appearance-none"
                    >
                      <option value="Perder peso">Perder peso</option>
                      <option value="Manter peso">Manter peso</option>
                      <option value="Ganhar massa">Ganhar massa</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nível de atividade</label>
                    <select 
                      value={profile.activityLevel}
                      onChange={(e) => setProfile({ activityLevel: e.target.value })}
                      className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary-container transition-all appearance-none"
                    >
                      <option value="Sedentário">Sedentário</option>
                      <option value="Leve">Leve</option>
                      <option value="Moderado">Moderado</option>
                      <option value="Intenso">Intenso</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Meta Calórica (kcal/dia)</label>
                    <input 
                      type="number"
                      value={profile.calorieGoal}
                      onChange={(e) => setProfile({ calorieGoal: parseInt(e.target.value) || 2000 })}
                      className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary-container transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Refeições por dia</label>
                    <select 
                      value={profile.mealsPerDay}
                      onChange={(e) => setProfile({ mealsPerDay: parseInt(e.target.value) || 4 })}
                      className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary-container transition-all appearance-none"
                    >
                      <option value={3}>3 refeições</option>
                      <option value={4}>4 refeições</option>
                      <option value={5}>5 refeições</option>
                      <option value={6}>6 refeições</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Restrições ou Alergias</label>
                    <input 
                      type="text"
                      placeholder="Ex: sem glúten, sou vegetariano..."
                      value={profile.restrictions}
                      onChange={(e) => setProfile({ restrictions: e.target.value })}
                      className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary-container transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 space-y-4">
                <h3 className="font-bold text-white text-lg">Pedidos Específicos para a IA</h3>
                <textarea
                  value={customRequest}
                  onChange={(e) => setCustomRequest(e.target.value)}
                  placeholder="Ex: Quero reduzir carboidratos no jantar, adicionar mais proteína no café da manhã..."
                  className="w-full h-32 bg-surface-container-lowest border-none rounded-xl p-4 text-white outline-none focus:ring-1 focus:ring-primary-container transition-all resize-none"
                />
              </div>

              {error && (
                <div className="p-4 bg-error/10 text-error rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-br from-[#00E479] to-[#00FF88] text-[#003919] rounded-xl font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 relative overflow-hidden"
              >
                {isGenerating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    A IA está montando sua dieta...
                  </>
                ) : (
                  <>
                    Gerar minha dieta ✦
                  </>
                )}
              </button>
            </motion.div>
          )}

          {step === 'result' && generatedDiet && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-6 text-center space-y-2">
                <span className="material-symbols-outlined text-primary-container text-4xl">verified</span>
                <h3 className="font-headline font-black text-white text-xl">Dieta Pronta!</h3>
                <p className="text-primary-container/80 text-sm">Abaixo está a sugestão ideal com base no seu perfil.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 <div className="bg-surface-container p-3 rounded-lg text-center">
                    <div className="text-[10px] text-on-surface-variant font-bold uppercase">Calorias</div>
                    <div className="text-white font-black text-lg">{generatedDiet.totalCalories}</div>
                 </div>
                 <div className="bg-surface-container p-3 rounded-lg text-center">
                    <div className="text-[10px] text-[#B9CBB9] font-bold uppercase">Prot</div>
                    <div className="text-white font-black text-lg">{generatedDiet.macros.protein}g</div>
                 </div>
                 <div className="bg-surface-container p-3 rounded-lg text-center">
                    <div className="text-[10px] text-[#A3B8CC] font-bold uppercase">Carb</div>
                    <div className="text-white font-black text-lg">{generatedDiet.macros.carbs}g</div>
                 </div>
                 <div className="bg-surface-container p-3 rounded-lg text-center">
                    <div className="text-[10px] text-primary-container font-bold uppercase">Gord</div>
                    <div className="text-white font-black text-lg">{generatedDiet.macros.fats}g</div>
                 </div>
              </div>

              <div className="space-y-4">
                {generatedDiet.meals.map((meal) => (
                  <MealCard key={meal.id} {...meal} />
                ))}
              </div>

              <div className="pt-6 space-y-3">
                <button
                  onClick={() => onAdoptDiet(generatedDiet)}
                  className="w-full py-4 bg-gradient-to-br from-[#00E479] to-[#00FF88] text-[#003919] rounded-xl font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all text-sm"
                >
                  Usar esta dieta como minha principal
                </button>
                <button
                  onClick={() => setStep('profile')}
                  className="w-full py-4 bg-transparent border-2 border-primary-container text-primary-container rounded-xl font-black uppercase tracking-widest hover:bg-primary-container/10 active:scale-95 transition-all text-sm"
                >
                  Ajustar dieta
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
