import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { Meal, WeightHistory, WorkoutSession } from '../types';
import { 
  subscribeToMeals, 
  addMeal, 
  updateMeal, 
  deleteMeal, 
  subscribeToUserProfile,
  updateUserProfile,
  subscribeToWorkoutSessions
} from '../services/firestore';
import { GoogleGenAI, Type } from "@google/genai";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDietAIStore } from '../stores/useDietAIStore';
import { DietAIScreen } from './DietAIScreen';
import { GeneratedDiet } from '../services/DietAIService';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function Diet() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConfigMode, setIsConfigMode] = useState(false);
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

  const [hasPopulatedToday, setHasPopulatedToday] = useState(false);

  useEffect(() => {
    let populatedForDate = localStorage.getItem('diet_populated_date');
    if (populatedForDate !== today) {
      setHasPopulatedToday(false);
    } else {
      setHasPopulatedToday(true);
    }

    const unsubscribeMeals = subscribeToMeals((fetchedMeals) => {
      setMeals(fetchedMeals);
      
      // Auto populate from active diet if empty and not yet populated today
      if (fetchedMeals.length === 0 && activeDiet && !hasPopulatedToday) {
        populateMealsFromDiet(activeDiet, today);
        setHasPopulatedToday(true);
        localStorage.setItem('diet_populated_date', today);
      }
    }, today);
    
    const unsubscribeSessions = subscribeToWorkoutSessions((data) => {
      setSessions(data.filter(s => s.date === today));
    });
    
    const unsubscribeProfile = subscribeToUserProfile((data) => {
      if (data.calorieGoal) setCalorieGoal(parseInt(data.calorieGoal));
      if (data.targetWeight) setTargetWeight(data.targetWeight);
      if (data.currentWeight) setCurrentWeight(data.currentWeight);
      if (data.weightHistory) setWeightHistory(data.weightHistory);
    });
    
    return () => {
      unsubscribeMeals();
      unsubscribeSessions();
      unsubscribeProfile();
    };
  }, [today, activeDiet, hasPopulatedToday]);

  const populateMealsFromDiet = async (diet: GeneratedDiet, dateStr: string) => {
    for (const meal of diet.meals) {
      await addMeal({
        name: meal.items.map(i => i.name).join(', '),
        type: meal.name.includes('Café') ? 'Café da Manhã' : meal.name.includes('Almoço') ? 'Almoço' : meal.name.includes('Jantar') ? 'Jantar' : 'Lanche',
        time: meal.time,
        date: dateStr,
        calories: meal.calories,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fats: meal.fats || 0,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&h=200&auto=format&fit=crop',
        completed: false
      });
    }
  };

  const adoptAIDiet = (diet: GeneratedDiet) => {
    setActiveDiet(diet);
    setCalorieGoal(diet.totalCalories);
    handleSaveProfile('calorieGoal', diet.totalCalories.toString());
    
    // Clear current meals for today and populate new ones
    Promise.all(meals.map(m => deleteMeal(m.id))).then(() => {
      populateMealsFromDiet(diet, today);
      setHasPopulatedToday(true);
      localStorage.setItem('diet_populated_date', today);
    });

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

  const totalConsumed = meals.reduce((acc, curr) => acc + curr.calories, 0);
  const totalBurned = sessions.reduce((acc, s) => {
    const burned = s.exercises.reduce((sum, ex) => ex.completed ? sum + (ex.caloriesBurned || 0) : sum, 0);
    return acc + burned;
  }, 0);

  const netCalories = totalConsumed - totalBurned;
  const totalProtein = meals.reduce((acc, curr) => acc + (curr.protein || 0), 0);
  const totalCarbs = meals.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
  const totalFats = meals.reduce((acc, curr) => acc + (curr.fats || 0), 0);
  
  const dietProgress = Math.min((netCalories / calorieGoal) * 100, 100);

  const analyzeMealWithAI = async () => {
    if (!newMeal.name || newMeal.name.length < 3) return;
    
    setIsAnalyzing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise esta refeição: "${newMeal.name}". Estime as calorias, proteínas, carboidratos e gorduras. Considere uma porção padrão se não for especificada. Retorne os valores para a porção descrita.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
              estimatedWeight: { type: Type.NUMBER },
              unit: { type: Type.STRING }
            },
            required: ["calories", "protein", "carbs", "fats"]
          }
        }
      });

      const result = JSON.parse(response.text);
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
    
    const mealData = {
      name: newMeal.name,
      type: newMeal.type,
      time: editingMeal ? editingMeal.time : new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
      calories: calories,
      protein: newMeal.protein,
      carbs: newMeal.carbs,
      fats: newMeal.fats,
      weight: newMeal.weight,
      unit: newMeal.unit,
      date: new Date().toISOString().split('T')[0],
      image: editingMeal ? editingMeal.image : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&h=200&auto=format&fit=crop'
    };

    if (editingMeal) {
      await updateMeal(editingMeal.id, mealData);
    } else {
      await addMeal(mealData);
    }
    
    setIsAddingMeal(false);
    setEditingMeal(null);
    setNewMeal({ name: '', type: 'Lanche', weight: 100, unit: 'g', calories: 0, protein: 0, carbs: 0, fats: 0, caloriesPer100: 150 });
  };

  const handleDeleteMeal = async (id: string) => {
    await deleteMeal(id);
  };

  const weightDiff = parseFloat(currentWeight) - parseFloat(targetWeight);
  const weightProgress = Math.max(0, Math.min(100, 100 - (weightDiff / 10) * 100));
  
  const chartData = weightHistory.map(h => ({
    date: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(h.date)),
    weight: h.weight
  }));

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-headline font-black text-white uppercase tracking-tight">Dieta</h2>
        <button 
          onClick={() => setIsConfigMode(!isConfigMode)}
          className={`p-2 rounded-full transition-all ${isConfigMode ? 'bg-primary-container text-[#131313]' : 'bg-surface-container hover:bg-surface-container-highest text-[#B9CBB9]'}`}
        >
          <span className="material-symbols-outlined">{isConfigMode ? 'close' : 'settings'}</span>
        </button>
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
                    { label: 'Proteína', value: `${Math.round(totalProtein)}g`, progress: Math.min((totalProtein / 150) * 100, 100), color: 'bg-[#B9CBB9]' },
                    { label: 'Carbos', value: `${Math.round(totalCarbs)}g`, progress: Math.min((totalCarbs / 300) * 100, 100), color: 'bg-[#A3B8CC]' },
                    { label: 'Gorduras', value: `${Math.round(totalFats)}g`, progress: Math.min((totalFats / 70) * 100, 100), color: 'bg-primary-container' },
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
                {meals.map((meal) => (
                  <motion.div 
                    key={meal.id}
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all group active:scale-[0.98] border border-white/5 ${meal.completed ? 'bg-surface-container-low opacity-60' : 'bg-surface-container hover:bg-surface-container-high'}`}
                  >
                    <button 
                      onClick={() => updateMeal(meal.id, { completed: !meal.completed })}
                      className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center transition-all ${
                        meal.completed 
                          ? 'bg-primary-container text-[#131313]' 
                          : 'border-2 border-on-surface-variant text-transparent hover:border-primary-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </button>
                    <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${meal.completed ? 'opacity-50 grayscale' : 'bg-surface-container-lowest'}`}>
                      <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={meal.image} referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold ${meal.completed ? 'text-on-surface-variant line-through' : 'text-white'}`}>{meal.name}</h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <p className="text-xs text-on-surface-variant">
                          {meal.type} • {meal.time} 
                          {meal.weight ? ` • ${meal.weight}${meal.unit}` : ''}
                        </p>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold text-[#B9CBB9] uppercase">P: {Math.round(meal.protein || 0)}g</span>
                          <span className="text-[10px] font-bold text-[#A3B8CC] uppercase">C: {Math.round(meal.carbs || 0)}g</span>
                          <span className="text-[10px] font-bold text-primary-container uppercase">G: {Math.round(meal.fats || 0)}g</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div>
                        <span className="block font-bold text-primary-container text-lg">{meal.calories}</span>
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold">kcal</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMeal(meal.id);
                          }}
                          className="p-1.5 hover:bg-error/10 text-error rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {meals.length === 0 && (
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
  );
}
