import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { Meal, WeightHistory, WorkoutSession } from '../types';
import { 
  subscribeToUserProfile,
  updateUserProfile,
  subscribeToWorkoutSessions
} from '../services/firestore';
import { auth } from '../firebase';
import { useLifeScoreStore } from '../stores/useLifeScoreStore';
import { recalculateAndSave } from '../services/lifeScoreService';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDietAIStore } from '../stores/useDietAIStore';
import { DietAIScreen } from './DietAIScreen';
import Reports from './Reports';
import { GeneratedDiet } from '../services/DietAIService';
import { useDietStore } from '../stores/useDietStore';
import { useDietDay } from '../hooks/useDietDay';
import { DietExtraItem } from '../types/diet';
import StreakBadge from './streaks/StreakBadge';
import { updateStreak } from '../services/streakService';
import { UserProfile } from '../types';

async function callGemini(prompt: string, schema?: any) {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, schema })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Falha na requisição: ${res.status}`);
  }
  return res.json();
}

export default function Diet() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  
  // Weight & Goals states
  const [targetWeight, setTargetWeight] = useState('80.0');
  const [currentWeight, setCurrentWeight] = useState('82.4');
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const { activeDiet, setActiveDiet, setProfile } = useDietAIStore();

  const [newMeal, setNewMeal] = useState({ 
    name: '', 
    type: 'Lanche' as Meal['type'], 
    weight: 100, 
    unit: 'g' as const, 
    calories: 0, 
    protein: 0, 
    carbs: 0, 
    fats: 0, 
    caloriesPer100: 150 
  });

  useEffect(() => {
    if (editingMeal) {
      setNewMeal({
        name: editingMeal.name,
        type: editingMeal.type,
        weight: editingMeal.weight || 100,
        unit: editingMeal.unit || 'g',
        calories: editingMeal.calories,
        protein: editingMeal.protein,
        carbs: editingMeal.carbs,
        fats: editingMeal.fats,
        caloriesPer100: Math.round((editingMeal.calories / (editingMeal.weight || 100)) * 100)
      });
    }
  }, [editingMeal]);

  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = new Date().toISOString().split('T')[0];
      if (current !== today) {
        setToday(current);
      }
    }, 1000 * 60);
    return () => clearInterval(interval);
  }, [today]);

  // Removed hasPopulatedToday state
  const { dayMeals, stats, activeSince, hasExtras } = useDietDay();
  const { dietBase, addExtraItem, updateDietMeal, removeDietMeal, toggleMealCompletion, removeExtraItem, setDietBase } = useDietStore();

  useEffect(() => {
    const unsubscribeSessions = subscribeToWorkoutSessions((data) => {
      setSessions(data.filter(s => s.date === today));
    });
    
    // Also re-init Diet store to catch midnight resets while app is running
    useDietStore.getState().init();
    
    const unsubscribeProfile = subscribeToUserProfile((data) => {
      setUserProfile(data as UserProfile);
      if (data.calorieGoal) setCalorieGoal(parseInt(data.calorieGoal));
      if (data.targetWeight) setTargetWeight(data.targetWeight);
      if (data.currentWeight) setCurrentWeight(data.currentWeight);
      if (data.weightHistory) setWeightHistory(data.weightHistory);
    });
    
    return () => {
      unsubscribeSessions();
      unsubscribeProfile();
    };
  }, [today]);

  const adoptAIDiet = async (diet: GeneratedDiet) => {
    // setActiveDiet is from useDietAIStore, we probably still want to call it if other parts of the app rely on it
    setActiveDiet(diet);
    setCalorieGoal(diet.totalCalories);
    handleSaveProfile('calorieGoal', diet.totalCalories.toString());
    
    const profile = useDietAIStore.getState().profile;

    // Map to new DietBase format
    const newDietBase = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatedByAI: true,
      profile: {
        objetivo: profile?.objective || 'Manter peso',
        metaCalorica: diet.totalCalories,
        totalRefeicoes: diet.meals.length,
        restricoes: profile?.restrictions || '',
      },
      macros: {
        proteina: diet.macros?.protein || 0,
        carboidrato: diet.macros?.carbs || 0,
        gordura: diet.macros?.fats || 0,
      },
      refeicoes: diet.meals.map(m => ({
        id: crypto.randomUUID(),
        nome: m.name,
        horario: m.time,
        calorias: m.calories,
        proteina: m.protein || 0,
        carboidrato: m.carbs || 0,
        gordura: m.fats || 0,
        alimentos: m.items.map(i => ({
          nome: i.name,
          quantidade: (i as any).quantity || (i as any).amount || '',
          calorias: i.calories
        })),
        isBaseItem: true as const
      }))
    };

    await setDietBase(newDietBase);
    setShowAIModal(false);
  };


  const handleSaveProfile = async (key: string, value: any) => {
    const updates: any = { [key]: value };
    
    if (key === 'currentWeight') {
      const newWeight = parseFloat(value);
      if (!isNaN(newWeight)) {
        const historyEntry: WeightHistory = {
          date: new Date().toISOString(),
          weight: newWeight
        };
        const today = new Date().toISOString().split('T')[0];
        const filteredHistory = weightHistory.filter(h => h.date.split('T')[0] !== today);
        const newHistory = [...filteredHistory, historyEntry].slice(-30);
        updates.weightHistory = newHistory;
      }
    }

    await updateUserProfile(updates);
    setSaveSuccess(key);
    setTimeout(() => setSaveSuccess(null), 1500);
  };

  const totalBurned = sessions.reduce((acc, s) => {
    const burned = s.exercises.reduce((sum, ex) => ex.completed ? sum + (ex.caloriesBurned || 0) : sum, 0);
    return acc + burned;
  }, 0);

  const totalProtein = dayMeals.filter(m => m.isCompleted).reduce((acc, curr) => acc + ((curr as any).proteina || 0), 0);
  const totalCarbs = dayMeals.filter(m => m.isCompleted).reduce((acc, curr) => acc + ((curr as any).carboidrato || 0), 0);
  const totalFats = dayMeals.filter(m => m.isCompleted).reduce((acc, curr) => acc + ((curr as any).gordura || 0), 0);

  // Stats from useDietDay
  const netCalories = stats.consumed - totalBurned;
  
  const dietProgress = Math.min((netCalories / stats.goal) * 100, 100);

  const analyzeMealWithAI = async () => {
    if (!newMeal.name || newMeal.name.length < 3) return;
    
    setIsAnalyzing(true);
    try {
      const prompt = `Analise esta refeição: "${newMeal.name}". Estime as calorias, proteínas, carboidratos e gorduras. Considere uma porção padrão se não for especificada. Retorne os valores para a porção descrita.`;
      const schema = {
        type: "OBJECT",
        properties: {
          calories: { type: "NUMBER" },
          protein: { type: "NUMBER" },
          carbs: { type: "NUMBER" },
          fats: { type: "NUMBER" },
          estimatedWeight: { type: "NUMBER" },
          unit: { type: "STRING" }
        },
        required: ["calories", "protein", "carbs", "fats"]
      };

      const result = await callGemini(prompt, schema);

      setNewMeal(prev => ({
        ...prev,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fats: result.fats,
        weight: result.estimatedWeight || prev.weight,
        unit: (result.unit === 'g' || result.unit === 'ml' || result.unit === 'unidade') ? result.unit : prev.unit
      }));
    } catch (error) {
      console.error("Erro na análise de IA:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateCalories = () => {
    if (newMeal.calories > 0) return newMeal.calories;
    if (newMeal.unit === 'unidade') {
      return Math.round(newMeal.weight * newMeal.caloriesPer100);
    }
    return Math.round((newMeal.weight / 100) * newMeal.caloriesPer100);
  };

  const handleAddMeal = async () => {
    if (!newMeal.name) return;
    
    const calories = calculateCalories();
    
    if (editingMeal) {
      if (editingMeal.isExtra) {
        // Edit extra meal not supported to keep simple just now, but we could implement updateExtraItem
        // for now just remove and add
        await removeExtraItem(editingMeal.id);
        await addExtraItem({
          id: crypto.randomUUID(),
          nome: newMeal.name,
          horario: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
          calorias: calories,
          alimentos: [{ nome: newMeal.name, quantidade: `${newMeal.weight}${newMeal.unit}`, calorias: calories }],
          isBaseItem: false,
          date: today
        });
      } else {
        if (window.confirm("Você está editando sua dieta principal.\nEsta mudança vai aparecer todos os dias.\nDeseja continuar?")) {
          await updateDietMeal({
            ...editingMeal,
            nome: newMeal.name,
            calorias: calories,
            alimentos: [{ nome: newMeal.name, quantidade: `${newMeal.weight}${newMeal.unit}`, calorias: calories }]
          });
        }
      }
    } else {
      await addExtraItem({
        id: crypto.randomUUID(),
        nome: newMeal.name,
        horario: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
        calorias: calories,
        alimentos: [{ nome: newMeal.name, quantidade: `${newMeal.weight}${newMeal.unit}`, calorias: calories }],
        isBaseItem: false,
        date: today
      });
      useLifeScoreStore.getState().showToast('Refeição adicionada', 'Utensils', 0);
      if (auth.currentUser) recalculateAndSave(auth.currentUser.uid);
    }
    
    setIsAddingMeal(false);
    setEditingMeal(null);
    setNewMeal({ name: '', type: 'Lanche', weight: 100, unit: 'g', calories: 0, protein: 0, carbs: 0, fats: 0, caloriesPer100: 150 });
  };

  const handleDeleteMeal = async (meal: any) => {
    if (meal.isExtra) {
      await removeExtraItem(meal.id);
      if (auth.currentUser) recalculateAndSave(auth.currentUser.uid);
    } else {
      if (window.confirm("Remover esta refeição da sua dieta principal?\nEla não vai mais aparecer nos próximos dias.")) {
        await removeDietMeal(meal.id);
        if (auth.currentUser) recalculateAndSave(auth.currentUser.uid);
      }
    }
  };

  const weightDiff = parseFloat(currentWeight) - parseFloat(targetWeight);
  const weightProgress = Math.max(0, Math.min(100, 100 - (weightDiff / 10) * 100));
  
  const chartData = weightHistory.map(h => ({
    date: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(h.date)),
    weight: h.weight
  }));

  return (
    <div className="space-y-8 pb-10">
      {showReports ? (
        <Reports onBack={() => setShowReports(false)} />
      ) : (
        <div className="space-y-8 pb-10">
          <div className="flex justify-between items-center px-2">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-headline font-black text-white uppercase tracking-tight">Dieta</h2>
                <StreakBadge pillar="dieta" current={userProfile?.streaks?.dieta?.current || 0} />
              </div>
              {activeSince && (
                <span className="text-[#B9CBB9] text-[11px]">Dieta ativa desde {activeSince}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowReports(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent active:bg-[#2A2A2A] hover:bg-[#2A2A2A] transition-colors"
              >
                <span className="material-symbols-outlined text-[#00FF88]">bar_chart</span>
              </button>
              <button 
                onClick={() => setIsConfigMode(!isConfigMode)}
                className={`p-2 rounded-full transition-all ${isConfigMode ? 'bg-primary-container text-[#131313]' : 'bg-surface-container hover:bg-surface-container-highest text-[#B9CBB9]'}`}
              >
                <span className="material-symbols-outlined">{isConfigMode ? 'close' : 'settings'}</span>
              </button>
            </div>
          </div>

      <AnimatePresence mode="wait">
        {isConfigMode ? (
          <motion.div 
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Health Goals Bento Section */}
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calorie Input */}
                <div className="bg-surface-container-high rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary-container">local_fire_department</span>
                      <label className="font-label text-sm font-semibold text-on-surface-variant">Meta de Calorias</label>
                    </div>
                    <button 
                      onClick={() => handleSaveProfile('calorieGoal', calorieGoal.toString())}
                      className={`p-2 rounded-full transition-all ${
                        saveSuccess === 'calorieGoal' ? 'bg-primary-container text-[#131313]' : 'bg-surface-container-lowest text-primary-container hover:bg-primary-container hover:text-[#131313]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{saveSuccess === 'calorieGoal' ? 'check' : 'save'}</span>
                    </button>
                  </div>
                  <div className="bg-surface-container-lowest rounded-full px-6 py-4 flex items-center gap-2 border border-white/5 shadow-inner">
                    <input 
                      className="bg-transparent border-none focus:ring-0 text-xl font-bold text-white flex-1 outline-none min-w-0" 
                      type="number" 
                      value={calorieGoal}
                      onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-on-surface-variant text-sm font-medium">kcal</span>
                  </div>
                </div>

                {/* Target Weight */}
                <div className="bg-surface-container-high rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary-container">flag</span>
                      <label className="font-label text-sm font-semibold text-on-surface-variant">Peso Alvo</label>
                    </div>
                    <button 
                      onClick={() => handleSaveProfile('targetWeight', targetWeight)}
                      className={`p-2 rounded-full transition-all ${
                        saveSuccess === 'targetWeight' ? 'bg-primary-container text-[#131313]' : 'bg-surface-container-lowest text-primary-container hover:bg-primary-container hover:text-[#131313]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{saveSuccess === 'targetWeight' ? 'check' : 'save'}</span>
                    </button>
                  </div>
                  <div className="bg-surface-container-lowest rounded-full px-6 py-4 flex items-center justify-between border border-white/5 shadow-inner">
                    <input 
                      className="bg-transparent border-none focus:ring-0 text-xl font-bold text-white w-24 outline-none" 
                      type="text" 
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                    />
                    <span className="text-on-surface-variant text-sm font-medium">kg</span>
                  </div>
                </div>

                {/* Weight Tracking */}
                <div className="bg-surface-container-high rounded-xl p-6 space-y-6 md:col-span-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary-container">monitor_weight</span>
                          <label className="font-label text-sm font-semibold text-on-surface-variant">Peso Atual</label>
                        </div>
                        <button 
                          onClick={() => handleSaveProfile('currentWeight', currentWeight)}
                          className={`p-2 rounded-full transition-all ${
                            saveSuccess === 'currentWeight' ? 'bg-primary-container text-[#131313]' : 'bg-surface-container-lowest text-primary-container hover:bg-primary-container hover:text-[#131313]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{saveSuccess === 'currentWeight' ? 'check' : 'save'}</span>
                        </button>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex items-center gap-2">
                          <input 
                            className="bg-transparent border-none focus:ring-0 text-5xl font-headline font-black text-white w-32 outline-none" 
                            type="text" 
                            value={currentWeight}
                            onChange={(e) => setCurrentWeight(e.target.value)}
                          />
                          <span className="text-xl font-medium text-on-surface-variant">kg</span>
                        </div>
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/20 text-primary-container text-xs font-bold">
                            <span className="material-symbols-outlined text-[12px]">trending_down</span>
                            Faltam {weightDiff.toFixed(1)}kg
                          </span>
                        </div>
                      </div>
                      <div className="relative w-full h-3 bg-surface-container-lowest rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${weightProgress}%` }}
                          className="absolute h-full bg-primary-container rounded-full"
                        ></motion.div>
                      </div>
                    </div>

                    <div className="w-full md:w-64 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">
                        <span className="material-symbols-outlined text-[12px]">history</span>
                        Tendência (30d)
                      </div>
                      <div className="h-32 bg-surface-container-lowest rounded-xl p-2 border border-white/5 shadow-inner">
                        {chartData.length > 1 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                              <XAxis dataKey="date" hide />
                              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#131313', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '10px' }}
                                itemStyle={{ color: '#00B452' }}
                              />
                              <Area type="monotone" dataKey="weight" stroke="#00B452" strokeWidth={2} fill="#00B452" fillOpacity={0.1} />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-[10px] text-on-surface-variant text-center p-4">
                            Logue seu peso para ver a tendência.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div 
            key="main"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-8"
          >
            <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 border border-white/5">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container/10 blur-[80px] rounded-full"></div>
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-headline font-bold text-white">Ingestão de Combustível</h3>
                  <span className="material-symbols-outlined text-primary-container">restaurant</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-5xl font-black font-headline text-white">{netCalories.toLocaleString('pt-BR')}</span>
                      <span className="text-on-surface-variant text-sm font-medium">/ {calorieGoal.toLocaleString('pt-BR')} kcal líq.</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[10px] font-bold text-primary-container uppercase tracking-widest mb-1">Gasto no Treino</span>
                       <span className="text-lg font-black text-primary-container">-{totalBurned} kcal</span>
                    </div>
                  </div>
                  <div className="h-4 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${dietProgress}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full rounded-full shadow-[0_0_15px_rgba(0,180,82,0.3)] ${
                        dietProgress > 100 ? 'bg-error' : 'bg-primary-container'
                      }`}
                    ></motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  {[
                    { label: 'Proteína', value: `${Math.round(totalProtein)}g`, progress: Math.min((totalProtein / (dietBase?.macros?.proteina || 150)) * 100, 100), color: 'bg-[#B9CBB9]' },
                    { label: 'Carbos', value: `${Math.round(totalCarbs)}g`, progress: Math.min((totalCarbs / (dietBase?.macros?.carboidrato || 300)) * 100, 100), color: 'bg-[#A3B8CC]' },
                    { label: 'Gorduras', value: `${Math.round(totalFats)}g`, progress: Math.min((totalFats / (dietBase?.macros?.gordura || 70)) * 100, 100), color: 'bg-primary-container' },
                  ].map((macro, i) => (
                    <div key={i} className="bg-surface-container-highest p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/5">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{macro.label}</span>
                      <span className="text-xl font-black text-white">{macro.value}</span>
                      <div className="h-1.5 w-full bg-surface-container-lowest rounded-full mt-1 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${macro.progress}%` }}
                          className={`h-full ${macro.color} rounded-full`}
                        ></motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <button 
              onClick={() => {
                const target = parseFloat(targetWeight);
                const current = parseFloat(currentWeight);
                let objective = 'Manter peso';
                if (target < current) objective = 'Perder peso';
                else if (target > current) objective = 'Ganhar massa';
                
                setProfile({
                  calorieGoal,
                  objective
                });
                setShowAIModal(true);
              }}
              className="w-full py-4 bg-gradient-to-br from-[#00E479] to-[#00FF88] text-[#003919] font-black rounded-xl shadow-[0_12px_24px_rgba(0,180,82,0.2)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              ✦ Analisar minha dieta com IA
            </button>

            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-headline font-bold text-white">Log de Hoje</h3>
                <button 
                  onClick={() => setIsAddingMeal(true)}
                  className="bg-surface-container-highest hover:bg-primary-container hover:text-[#131313] text-primary-container px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 active:scale-95 transition-all text-[#B9CBB9]"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span> Adicionar Refeição
                </button>
              </div>
              <div className="space-y-4">
                {hasExtras && dayMeals.some(m => !m.isExtra) && (
                  <div className="text-[10px] font-bold text-[#B9CBB9] uppercase tracking-widest px-1 pb-2">Dieta Base</div>
                )}
                {dayMeals.map((meal, index) => {
                  const isFirstExtra = meal.isExtra && (index === 0 || !dayMeals[index - 1].isExtra);
                  
                  return (
                    <div key={meal.id}>
                      {isFirstExtra && (
                        <div className="text-[10px] font-bold text-[#B9CBB9] uppercase tracking-widest px-1 pt-4 pb-2">ADICIONADOS HOJE</div>
                      )}
                      
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-all group active:scale-[0.98] border border-white/5 ${meal.isCompleted ? 'bg-surface-container-low opacity-60' : 'bg-surface-container hover:bg-surface-container-high'}`}
                      >
                        <button 
                          onClick={() => {
                            if (!meal.isExtra) {
                              toggleMealCompletion(meal.id);
                              if (!meal.isCompleted) {
                                useLifeScoreStore.getState().showToast('Refeição concluída', 'Utensils', 0);
                              }
                              if (auth.currentUser && userProfile) {
                                updateStreak(auth.currentUser.uid, userProfile, 'dieta');
                                recalculateAndSave(auth.currentUser.uid);
                              }
                            }
                          }}
                          className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center transition-all ${
                            meal.isCompleted 
                              ? 'bg-primary-container text-[#131313]' 
                              : 'border-2 border-on-surface-variant text-transparent hover:border-primary-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </button>
                        <div className={`w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${meal.isCompleted ? 'opacity-50 grayscale' : 'bg-surface-container-lowest'}`}>
                           <span className="material-symbols-outlined text-[#B9CBB9] text-2xl">{meal.isExtra ? 'fastfood' : 'restaurant'}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-bold ${meal.isCompleted ? 'text-on-surface-variant line-through' : 'text-white'}`}>{meal.nome}</h4>
                            {meal.isExtra && (
                              <span className="bg-[#2A2A2A] text-[#B9CBB9] text-[10px] px-2 py-0.5 rounded-full">Hoje</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            <p className="text-xs text-on-surface-variant">
                              {meal.horario} 
                              {meal.alimentos?.[0]?.quantidade ? ` • ${meal.alimentos[0].quantidade}` : ''}
                            </p>
                            {!meal.isExtra && (
                              <div className="flex gap-2">
                                <span className="text-[10px] font-bold text-[#B9CBB9] uppercase">P: {Math.round((meal as any).proteina || 0)}g</span>
                                <span className="text-[10px] font-bold text-[#A3B8CC] uppercase">C: {Math.round((meal as any).carboidrato || 0)}g</span>
                                <span className="text-[10px] font-bold text-primary-container uppercase">G: {Math.round((meal as any).gordura || 0)}g</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <div>
                            <span className="block font-bold text-primary-container text-lg">{meal.calorias}</span>
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold">kcal</span>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!meal.isExtra && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMeal(meal);
                                  setIsAddingMeal(true);
                                }}
                                className="p-1.5 hover:bg-primary-container/10 text-primary-container rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMeal(meal);
                              }}
                              className="p-1.5 hover:bg-error/10 text-error rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
                
                {dayMeals.length === 0 && (
                  <div className="text-center py-10 text-on-surface-variant bg-surface-container-high rounded-xl border border-dashed border-outline-variant/30">
                    Nenhuma refeição registrada hoje.
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAIModal && (
          <DietAIScreen 
            onClose={() => setShowAIModal(false)} 
            onAdoptDiet={adoptAIDiet} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingMeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddingMeal(false);
                setEditingMeal(null);
              }}
              className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-surface-container-high rounded-2xl shadow-2xl overflow-hidden border border-white/5"
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-headline font-bold text-white">
                    {editingMeal ? 'Editar Refeição' : 'Adicionar Refeição'}
                  </h3>
                  <button onClick={() => {
                    setIsAddingMeal(false);
                    setEditingMeal(null);
                  }} className="text-on-surface-variant hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">O que você comeu?</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ex: 200g de frango e 100g de arroz"
                        value={newMeal.name}
                        onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                        className="w-full bg-surface-container-lowest border-none rounded-xl pl-4 pr-12 py-3 text-white outline-none focus:ring-1 focus:ring-primary-container transition-all"
                      />
                      <button 
                        onClick={analyzeMealWithAI}
                        disabled={isAnalyzing || !newMeal.name}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-container hover:bg-primary-container/10 rounded-lg transition-all disabled:opacity-30"
                        title="Analisar com IA"
                      >
                        {isAnalyzing ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">auto_awesome</span>}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tipo</label>
                      <select 
                        value={newMeal.type}
                        onChange={(e) => setNewMeal({ ...newMeal, type: e.target.value as Meal['type'] })}
                        className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary-container transition-all appearance-none"
                      >
                        <option value="Café da Manhã">Café da Manhã</option>
                        <option value="Almoço">Almoço</option>
                        <option value="Jantar">Jantar</option>
                        <option value="Lanche">Lanche</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Unidade</label>
                      <select 
                        value={newMeal.unit}
                        onChange={(e) => setNewMeal({ ...newMeal, unit: e.target.value as any })}
                        className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary-container transition-all appearance-none"
                        style={{ backgroundImage: 'none' }}
                      >
                        <option value="g">Gramas (g)</option>
                        <option value="ml">Mililitros (ml)</option>
                        <option value="unidade">Unidade</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Quantidade</label>
                      <input 
                        type="number" 
                        value={newMeal.weight}
                        onChange={(e) => setNewMeal({ ...newMeal, weight: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary-container transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Calorias</label>
                      <input 
                        type="number" 
                        value={newMeal.calories || calculateCalories()}
                        onChange={(e) => setNewMeal({ ...newMeal, calories: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary-container transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase text-center block">Prot (g)</label>
                      <input 
                        type="number" 
                        value={newMeal.protein}
                        onChange={(e) => setNewMeal({ ...newMeal, protein: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-surface-container-lowest border-none rounded-lg px-2 py-2 text-center text-sm text-white outline-none focus:ring-1 focus:ring-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase text-center block">Carb (g)</label>
                      <input 
                        type="number" 
                        value={newMeal.carbs}
                        onChange={(e) => setNewMeal({ ...newMeal, carbs: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-surface-container-lowest border-none rounded-lg px-2 py-2 text-center text-sm text-white outline-none focus:ring-1 focus:ring-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase text-center block">Gord (g)</label>
                      <input 
                        type="number" 
                        value={newMeal.fats}
                        onChange={(e) => setNewMeal({ ...newMeal, fats: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-surface-container-lowest border-none rounded-lg px-2 py-2 text-center text-sm text-white outline-none focus:ring-1 focus:ring-primary-container"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-primary-container/10 rounded-xl border border-primary-container/20 flex justify-between items-center">
                    <span className="text-sm font-bold text-primary-container">Total Estimado:</span>
                    <span className="text-2xl font-black text-primary-container">{newMeal.calories || calculateCalories()} kcal</span>
                  </div>
                </div>

                <button 
                  onClick={handleAddMeal}
                  disabled={!newMeal.name}
                  className="w-full py-4 bg-primary-container text-[#131313] rounded-xl font-black uppercase tracking-widest shadow-[0_12px_24px_rgba(0,180,82,0.2)] active:scale-95 hover:scale-[1.02] disabled:opacity-50 disabled:active:scale-100 disabled:hover:scale-100 transition-all text-[10px]"
                >
                  {editingMeal ? 'Salvar Alterações' : 'Confirmar Refeição'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
      )}
    </div>
  );
}
