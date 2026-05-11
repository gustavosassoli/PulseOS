import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useCallback } from 'react';
import { WorkoutSession, WorkoutDay, Badge, WorkoutExercise, UserProfile } from '../types';
import { 
  subscribeToUserProfile, 
  subscribeToWorkoutSessions, 
  addWorkoutSession, 
  updateWorkoutSession, 
  awardBadge,
  updateUserProfile 
} from '../services/firestore';
import { suggestWorkoutAdjustment, WorkoutInsight, generateFullWorkoutPlan } from '../services/aiService';

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function Workout() {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [isConfigMode, setIsConfigMode] = useState(false);
  
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  // Config states
  const [trainingFocus, setTrainingFocus] = useState<'lose' | 'gain'>('lose');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [currentWeight, setCurrentWeight] = useState('0');
  const [targetWeight, setTargetWeight] = useState('0');
  const [height, setHeight] = useState('0');
  const [age, setAge] = useState('25');
  const [tempWorkoutPlan, setTempWorkoutPlan] = useState<WorkoutDay[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // AI Insight state
  const [aiInsight, setAiInsight] = useState<WorkoutInsight | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const unsubscribeProfile = subscribeToUserProfile((data) => {
      if (data.workoutPlan) {
        setWorkoutPlan(data.workoutPlan);
        setTempWorkoutPlan(data.workoutPlan);
      }
      if (data.trainingFocus) setTrainingFocus(data.trainingFocus);
      if (data.gender) setGender(data.gender);
      if (data.currentWeight) setCurrentWeight(data.currentWeight);
      if (data.targetWeight) setTargetWeight(data.targetWeight);
      if (data.height) setHeight(data.height);
      if (data.age) setAge(data.age);
    });
    const unsubscribeSessions = subscribeToWorkoutSessions(setSessions);
    
    return () => {
      unsubscribeProfile();
      unsubscribeSessions();
    };
  }, []);

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const newPlan = await generateFullWorkoutPlan({
        trainingFocus,
        gender,
        currentWeight,
        targetWeight,
        height,
        age
      });
      if (newPlan.length > 0) {
        setTempWorkoutPlan(newPlan);
      }
    } catch (error) {
      console.error("Erro ao gerar plano:", error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const refreshAiInsight = useCallback(async () => {
    if (workoutPlan.length === 0) return;
    setIsAiLoading(true);
    try {
      const insight = await suggestWorkoutAdjustment({
        trainingFocus,
        gender,
        currentWeight,
        targetWeight
      }, workoutPlan);
      setAiInsight(insight);
    } catch (error) {
      console.error("Erro ao carregar insight de IA:", error);
    } finally {
      setIsAiLoading(false);
    }
  }, [trainingFocus, gender, currentWeight, targetWeight, workoutPlan]);

  useEffect(() => {
    if (workoutPlan.length > 0 && !aiInsight && !isAiLoading) {
      refreshAiInsight();
    }
  }, [workoutPlan, aiInsight, isAiLoading, refreshAiInsight]);

  const todayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date());
  const normalizedToday = todayName.charAt(0).toUpperCase() + todayName.slice(1).split('-')[0];
  
  const todayPlan = workoutPlan.find(p => p.day.startsWith(normalizedToday));
  const todaySession = sessions.find(s => s.date === today);

  const startWorkout = async () => {
    if (!todayPlan) return;
    const newSession: Omit<WorkoutSession, 'id'> = {
      date: today,
      dayName: todayPlan.day,
      title: todayPlan.title,
      exercises: todayPlan.exercises.map(ex => ({ ...ex, completed: false })),
      completed: false
    };
    await addWorkoutSession(newSession);
  };

  const toggleExercise = async (exerciseId: string) => {
    if (!todaySession) return;
    const updatedExercises = todaySession.exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
    );
    const allDone = updatedExercises.every(ex => ex.completed);
    await updateWorkoutSession(todaySession.id, { 
      exercises: updatedExercises,
      completed: allDone
    });

    if (allDone) {
      // Award "Foco Total" badge
      const badge = await awardBadge({
        id: 'foco-total',
        name: 'Foco Total',
        description: 'Completou todos os exercícios de um treino planejado.',
        icon: 'Target',
        category: 'workout'
      });
      if (badge) setNewBadge(badge);

      // Check for "Primeiro Passo"
      if (sessions.length === 0 || (sessions.length === 1 && !sessions[0].completed)) {
        const b = await awardBadge({
          id: 'primeiro-passo',
          name: 'Primeiro Passo',
          description: 'Completou seu primeiro treino no PulseOS.',
          icon: 'Zap',
          category: 'workout'
        });
        if (b) setNewBadge(b);
      }

      // Check for "Consistência de Ferro" (7 days streak)
      // Simplified check: if there are 7 completed sessions in the last 7 days
      const last7Days = sessions.filter(s => {
        const sDate = new Date(s.date);
        const diff = (new Date().getTime() - sDate.getTime()) / (1000 * 3600 * 24);
        return diff <= 7 && s.completed;
      });
      if (last7Days.length >= 7) {
        const b = await awardBadge({
          id: 'consistencia-ferro',
          name: 'Consistência de Ferro',
          description: 'Manteve uma sequência de 7 dias de treinos concluídos.',
          icon: 'Trophy',
          category: 'consistency'
        });
        if (b) setNewBadge(b);
      }
    }
  };

  // Config handlers
  const addExercise = (dayIndex: number) => {
    const newPlan = [...tempWorkoutPlan];
    if (!newPlan[dayIndex]) {
      newPlan[dayIndex] = { day: DAYS_OF_WEEK[dayIndex], title: '', exercises: [] };
    }
    newPlan[dayIndex].exercises.push({
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      sets: 3,
      reps: '12',
      completed: false,
      muscles: '',
      gifUrl: ''
    });
    setTempWorkoutPlan(newPlan);
  };

  const updateExercise = (dayIndex: number, exIndex: number, field: keyof WorkoutExercise, value: any) => {
    const newPlan = [...tempWorkoutPlan];
    newPlan[dayIndex].exercises[exIndex] = { ...newPlan[dayIndex].exercises[exIndex], [field]: value };
    setTempWorkoutPlan(newPlan);
  };

  const removeExercise = (dayIndex: number, exIndex: number) => {
    const newPlan = [...tempWorkoutPlan];
    newPlan[dayIndex].exercises.splice(exIndex, 1);
    setTempWorkoutPlan(newPlan);
  };

  const updateDayTitle = (dayIndex: number, title: string) => {
    const newPlan = [...tempWorkoutPlan];
    if (!newPlan[dayIndex]) {
      newPlan[dayIndex] = { day: DAYS_OF_WEEK[dayIndex], title: '', exercises: [] };
    }
    newPlan[dayIndex].title = title;
    setTempWorkoutPlan(newPlan);
  };

  const handleSaveConfig = async () => {
    await updateUserProfile({
      workoutPlan: tempWorkoutPlan,
      trainingFocus,
      gender,
      height,
      age
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsConfigMode(false);
    }, 1500);
  };

  const todayExercisesDone = todaySession?.exercises.filter(ex => ex.completed).length || 0;
  const todayTotalCaloriesBurned = todaySession?.exercises.reduce((acc, ex) => ex.completed ? acc + (ex.caloriesBurned || 0) : acc, 0) || 0;
  const todayTotalExpectedCalories = todaySession?.exercises.reduce((acc, ex) => acc + (ex.caloriesBurned || 0), 0) || 0;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-headline font-black text-white uppercase tracking-tight">Treino</h2>
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            {/* Workout Plan Configuration */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-xl font-bold tracking-tight text-white">Planejamento Semanal</h3>
              </div>

              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day, dayIdx) => {
                  const dayPlan = tempWorkoutPlan.find(p => p.day === day) || { day, title: '', exercises: [] };
                  return (
                    <div key={day} className="bg-surface-container-high rounded-xl overflow-hidden border border-white/5">
                      <div className="p-4 bg-surface-container flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary-container text-lg">calendar_today</span>
                          <span className="font-bold text-white">{day}</span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Ex: Treino de Braço"
                          value={dayPlan.title}
                          onChange={(e) => updateDayTitle(dayIdx, e.target.value)}
                          className="bg-surface-container-lowest border-none rounded-lg px-3 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-primary-container w-full max-w-[150px] ml-4"
                        />
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {dayPlan.exercises.map((ex, exIdx) => (
                          <div key={ex.id} className="flex items-center gap-2 bg-surface-container-lowest p-2 rounded-lg">
                            <input 
                              type="text" 
                              placeholder="Exercício"
                              value={ex.name}
                              onChange={(e) => updateExercise(dayIdx, exIdx, 'name', e.target.value)}
                              className="flex-1 bg-transparent border-none text-sm text-white outline-none"
                            />
                            <div className="flex items-center gap-1 shrink-0">
                              <input 
                                type="number" 
                                value={ex.sets}
                                onChange={(e) => updateExercise(dayIdx, exIdx, 'sets', parseInt(e.target.value) || 0)}
                                className="w-8 bg-surface-container-high border-none text-center text-xs text-white rounded py-1"
                              />
                              <span className="text-[10px] text-on-surface-variant">x</span>
                              <input 
                                type="text" 
                                value={ex.reps}
                                onChange={(e) => updateExercise(dayIdx, exIdx, 'reps', e.target.value)}
                                className="w-8 bg-surface-container-high border-none text-center text-xs text-white rounded py-1"
                              />
                            </div>
                            <button 
                              onClick={() => removeExercise(dayIdx, exIdx)}
                              className="p-1 text-error/50 hover:text-error transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => addExercise(dayIdx)}
                          className="w-full py-2 border-2 border-dashed border-outline-variant/30 rounded-lg text-on-surface-variant hover:text-primary-container hover:border-primary-container/50 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span> Adicionar Exercício
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Focus & Biotype */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-headline text-xl font-bold tracking-tight text-white">Foco do Treino</h3>
                  <span className="text-[10px] bg-primary-container/10 text-primary-container px-2 py-1 rounded-full font-bold uppercase tracking-wider">Fator IA</span>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={() => setTrainingFocus('lose')}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between group ${trainingFocus === 'lose' ? 'bg-surface-container-highest border-2 border-primary-container shadow-lg' : 'bg-surface-container-high'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trainingFocus === 'lose' ? 'bg-primary-container/20 text-primary-container' : 'bg-surface-container-lowest text-on-surface-variant'}`}>
                        <span className="material-symbols-outlined text-lg">timer</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">Perder Peso</p>
                        <p className="text-[10px] text-on-surface-variant">Cardio e Déficit</p>
                      </div>
                    </div>
                    {trainingFocus === 'lose' && <span className="material-symbols-outlined text-primary-container">check</span>}
                  </button>
                  <button 
                    onClick={() => setTrainingFocus('gain')}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between group ${trainingFocus === 'gain' ? 'bg-surface-container-highest border-2 border-primary-container shadow-lg' : 'bg-surface-container-high'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trainingFocus === 'gain' ? 'bg-primary-container/20 text-primary-container' : 'bg-surface-container-lowest text-on-surface-variant'}`}>
                        <span className="material-symbols-outlined text-lg">fitness_center</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">Ganhar Músculo</p>
                        <p className="text-[10px] text-on-surface-variant">Hipertrofia e Força</p>
                      </div>
                    </div>
                    {trainingFocus === 'gain' && <span className="material-symbols-outlined text-primary-container">check</span>}
                  </button>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-headline text-xl font-bold tracking-tight text-white">Biótipo & Perfil</h3>
                  <span className="text-[10px] bg-primary-container/10 text-primary-container px-2 py-1 rounded-full font-bold uppercase tracking-wider">Fator IA</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setGender('male')}
                    className={`p-4 rounded-xl transition-all flex flex-col items-center gap-3 ${gender === 'male' ? 'bg-primary-container/10 border-2 border-primary-container shadow-lg' : 'bg-surface-container-high'}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${gender === 'male' ? 'bg-primary-container/20 text-primary-container' : 'bg-surface-container-lowest text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-2xl">male</span>
                    </div>
                    <span className="font-bold text-xs text-white">Masculino</span>
                  </button>
                  <button 
                    onClick={() => setGender('female')}
                    className={`p-4 rounded-xl transition-all flex flex-col items-center gap-3 ${gender === 'female' ? 'bg-primary-container/10 border-2 border-primary-container shadow-lg' : 'bg-surface-container-high'}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${gender === 'female' ? 'bg-primary-container/20 text-primary-container' : 'bg-surface-container-lowest text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-2xl">female</span>
                    </div>
                    <span className="font-bold text-xs text-white">Feminino</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Altura (cm)</label>
                    <input 
                      type="number" 
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-primary-container"
                      placeholder="175"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Idade</label>
                    <input 
                      type="number" 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-primary-container"
                      placeholder="25"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan}
                className="w-full flex-1 py-4 rounded-2xl font-black uppercase tracking-widest bg-surface-container-highest text-primary-container border border-primary-container/20 flex items-center justify-center gap-3 hover:bg-primary-container hover:text-[#131313] transition-all disabled:opacity-50 text-[10px]"
              >
                {isGeneratingPlan ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> Gerando Plano...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">auto_awesome</span> Gerar Plano com IA
                  </>
                )}
              </button>

              <button 
                onClick={handleSaveConfig}
                className={`w-full flex-1 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_12px_24px_rgba(0,180,82,0.2)] flex items-center justify-center gap-3 transition-all text-[10px] ${saveSuccess ? 'bg-primary-container text-[#131313]' : 'bg-primary-container text-[#131313] hover:scale-[1.02] active:scale-95'}`}
              >
                {saveSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-lg">check</span> Configurador Salvo
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span> Salvar Plano Atual
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* AI Insights Section */}
            <section className="bg-surface-container-high rounded-2xl p-6 border border-primary-container/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary-container">auto_awesome</span>
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container text-xl">auto_awesome</span>
                    <h4 className="font-headline font-bold text-white">Pulse AI Insights</h4>
                  </div>
                  <button 
                    onClick={refreshAiInsight}
                    disabled={isAiLoading}
                    className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-base ${isAiLoading ? 'animate-spin' : ''}`}>sync</span>
                  </button>
                </div>

                <div className="bg-surface-container-lowest/50 p-4 rounded-xl border border-white/5">
                  {isAiLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-primary-container rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-primary-container rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1 h-1 bg-primary-container rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <p className="text-xs text-on-surface-variant italic">Analisando seu perfil e plano de treino...</p>
                    </div>
                  ) : aiInsight ? (
                    <div className="space-y-4">
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-on-surface-variant leading-relaxed italic"
                      >
                        "{aiInsight.tip}"
                      </motion.p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiInsight.exercises.map((ex, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5 flex flex-col group/card"
                          >
                            <div className="aspect-video relative bg-black/40 overflow-hidden">
                              <img 
                                src={ex.gifUrl} 
                                alt={ex.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover opacity-80 group-hover/card:scale-110 group-hover/card:opacity-100 transition-all duration-500"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop';
                                }}
                              />
                              <div className="absolute top-2 left-2 bg-primary-container/20 backdrop-blur-md px-2 py-1 rounded text-[8px] font-black uppercase text-primary-container border border-primary-container/30">
                                {ex.muscles}
                              </div>
                            </div>
                            <div className="p-3 space-y-1">
                              <div className="flex justify-between items-center">
                                <h5 className="font-bold text-xs text-white">{ex.name}</h5>
                                <span className="text-[10px] font-black text-primary-container">{ex.setsReps}</span>
                              </div>
                              <p className="text-[9px] text-on-surface-variant leading-tight opacity-70">
                                {ex.execution}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant italic">Clique no ícone de recarregar para obter uma sugestão personalizada.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-surface-container-highest rounded text-on-surface-variant group-hover:text-primary-container transition-colors">
                    Foco: {trainingFocus === 'lose' ? 'Peso' : 'Músculo'}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-surface-container-highest rounded text-on-surface-variant group-hover:text-primary-container transition-colors">
                    Biótipo: {gender === 'male' ? 'Masc' : 'Fem'}
                  </span>
                </div>
              </div>
            </section>

            <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 border border-white/5">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container/10 blur-[80px] rounded-full"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#B9CBB9] font-bold">Treino de Hoje</span>
                    <h3 className="text-2xl font-headline font-black text-white">
                      {todayPlan ? todayPlan.title : 'Dia de Descanso'}
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined">fitness_center</span>
                  </div>
                </div>

                {todayPlan ? (
                  todaySession ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-on-surface-variant">Progresso</span>
                          <div className="flex items-center gap-2">
                             <span className="text-xl font-black text-white">
                              {todayExercisesDone}/{todaySession.exercises.length}
                            </span>
                            <span className="text-xs text-on-surface-variant font-medium">concluídos</span>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-sm font-bold text-on-surface-variant flex items-center gap-1 justify-end">
                            <span className="material-symbols-outlined text-[14px] text-primary-container">local_fire_department</span> Calorias
                          </span>
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xl font-black text-primary-container">
                              {todayTotalCaloriesBurned}
                            </span>
                            <span className="text-xs text-on-surface-variant font-medium">/ {todayTotalExpectedCalories} kcal</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(todayExercisesDone / todaySession.exercises.length) * 100}%` }}
                          className="h-full bg-primary-container rounded-full transition-all duration-500"
                        ></motion.div>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={startWorkout}
                      className="w-full py-4 bg-primary-container text-[#131313] rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_12px_24px_rgba(0,180,82,0.2)] active:scale-95 transition-all text-sm"
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                      Iniciar Sessão
                    </button>
                  )
                ) : (
                  <div className="p-6 bg-surface-container-high rounded-xl text-center border border-dashed border-outline-variant/30">
                    <p className="text-on-surface-variant text-sm italic">Aproveite seu descanso ou configure um treino usando o ícone de engrenagem acima.</p>
                  </div>
                )}
              </div>
            </section>

            {todaySession && (
              <section className="space-y-4">
                <h4 className="text-[10px] font-bold text-[#B9CBB9] uppercase tracking-widest px-2">Exercícios do Dia</h4>
                <div className="grid grid-cols-1 gap-4">
                  {todaySession.exercises.map((ex) => (
                    <motion.div 
                      key={ex.id}
                      onClick={() => toggleExercise(ex.id)}
                      whileTap={{ scale: 0.98 }}
                      className={`group relative overflow-hidden rounded-2xl transition-all cursor-pointer border ${
                        ex.completed 
                          ? 'bg-primary-container/5 border-primary-container/20 shadow-none' 
                          : 'bg-surface-container-low border-white/5 hover:bg-surface-container-high shadow-lg hover:shadow-primary-container/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row h-full">
                        {/* Visual Element */}
                        <div className="w-full sm:w-28 h-32 sm:h-auto bg-surface-container-highest relative overflow-hidden shrink-0">
                          <img 
                            src={ex.gifUrl || `https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?w=300&auto=format&fit=crop`} 
                            alt={ex.name}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-cover transition-all duration-700 ${ex.completed ? 'grayscale opacity-20' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&auto=format&fit=crop';
                            }}
                          />
                          {ex.muscles && (
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black uppercase text-white border border-white/10">
                              {ex.muscles}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-5 flex flex-col justify-center gap-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h5 className={`font-headline font-bold text-base leading-tight transition-all ${ex.completed ? 'text-on-surface-variant line-through' : 'text-white'}`}>
                                {ex.name}
                              </h5>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-1 rounded-md border border-white/5">
                                  <span className={`font-black text-xs ${ex.completed ? 'text-on-surface-variant' : 'text-primary-container'}`}>{ex.sets}</span>
                                  <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">Séries</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-1 rounded-md border border-white/5">
                                  <span className={`font-black text-xs ${ex.completed ? 'text-on-surface-variant' : 'text-primary-container'}`}>{ex.reps}</span>
                                  <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">Reps</span>
                                </div>
                                {ex.caloriesBurned && (
                                  <div className="flex items-center gap-1.5 bg-primary-container/10 px-2 py-1 rounded-md border border-primary-container/10">
                                    <span className="material-symbols-outlined text-[10px] text-primary-container">local_fire_department</span>
                                    <span className={`font-black text-xs ${ex.completed ? 'text-on-surface-variant' : 'text-primary-container'}`}>{ex.caloriesBurned}</span>
                                    <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">kcal</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-inner ${
                              ex.completed ? 'bg-primary-container text-[#131313] shadow-lg shadow-primary-container/30' : 'bg-surface-container-lowest text-on-surface-variant'
                            }`}>
                              {ex.completed ? <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> : <div className="w-4 h-4 rounded-full border-2 border-[#1E1E1E]/30" />}
                            </div>
                          </div>
                          {ex.executionTip && !ex.completed && (
                             <p className="text-[10px] text-on-surface-variant italic leading-snug border-l-2 border-primary-container/30 pl-2">
                               {ex.executionTip}
                             </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Completion Progress Overlay */}
                      {ex.completed && (
                        <div className="absolute inset-0 bg-primary-container/5 pointer-events-none"></div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-[#B9CBB9] uppercase tracking-widest px-2">Momentum Semanal</h4>
              <div className="flex justify-between items-center gap-2">
                {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => {
                  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
                  const sessionForDay = sessions.find(s => s.dayName.startsWith(dayNames[i]));
                  const isToday = normalizedToday.startsWith(dayNames[i]);
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-primary-container' : 'text-on-surface-variant'}`}>{day}</span>
                      <div className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                        sessionForDay?.completed 
                          ? 'bg-primary-container text-[#131313] shadow-lg shadow-primary-container/20' 
                          : isToday 
                            ? 'border-2 border-primary-container bg-primary-container/5' 
                            : 'bg-surface-container-lowest border border-white/5'
                      }`}>
                        {sessionForDay?.completed && <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
