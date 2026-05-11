import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { auth, logout } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { updateUserProfile, subscribeToUserProfile, subscribeToAgendaHistory, subscribeToTransactions, subscribeToMealsHistory } from '../services/firestore';
import { WorkoutDay, WorkoutExercise, WeightHistory, AgendaItem, Transaction, Meal, Badge } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell } from 'recharts';

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function Settings() {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToUserProfile((data) => {
      if (data.notifications !== undefined) setNotifications(data.notifications);
      if (data.darkMode !== undefined) setDarkMode(data.darkMode);
      if (data.badges) setBadges(data.badges);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubAgenda = subscribeToAgendaHistory(setAgenda);
    const unsubTransactions = subscribeToTransactions(setTransactions);
    const unsubMeals = subscribeToMealsHistory(setMeals);
    return () => {
      unsubAgenda();
      unsubTransactions();
      unsubMeals();
    };
  }, []);

  const handleSave = async (key: string, value: any) => {
    const updates: any = { [key]: value };
    await updateUserProfile(updates);
    setSaveSuccess(key);
    setTimeout(() => setSaveSuccess(null), 2000);
  };

  // Life Score Calculations
  const today = new Date().toISOString().split('T')[0];
  
  const getScoreForDate = useCallback((dateStr: string) => {
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    const dayAgenda = agenda.filter(i => i.date === dateStr);
    const dayMeals = meals.filter(m => m.date === dateStr);

    const fin = Math.min((dayTransactions.length / 5) * 100, 100);
    const work = Math.min((dayAgenda.filter(i => i.category === 'Saúde' && i.completed).length / 1) * 100, 100);
    const nutr = Math.min((dayMeals.length / 3) * 100, 100);

    return Math.round((fin + work + nutr) / 3);
  }, [transactions, agenda, meals]);

  const lifeScore = useMemo(() => getScoreForDate(today), [getScoreForDate, today]);

  const evolutionData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const dateStr = d.toISOString().split('T')[0];
      return {
        date: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d),
        score: getScoreForDate(dateStr)
      };
    });
  }, [getScoreForDate]);

  const monthlyAverage = useMemo(() => {
    const sum = evolutionData.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / evolutionData.length);
  }, [evolutionData]);

  const trend = useMemo(() => {
    const firstHalf = evolutionData.slice(0, 15).reduce((acc, curr) => acc + curr.score, 0) / 15;
    const secondHalf = evolutionData.slice(15).reduce((acc, curr) => acc + curr.score, 0) / 15;
    return secondHalf - firstHalf;
  }, [evolutionData]);

  const pillarData = useMemo(() => {
    const transactionsToday = transactions.filter(t => t.date === today);
    const financesProgress = Math.min((transactionsToday.length / 5) * 100, 100);
    const workoutProgress = Math.min((agenda.filter(i => i.category === 'Saúde' && i.completed).length / 1) * 100, 100);
    const nutritionProgress = Math.min((meals.filter(m => m.date === today).length / 3) * 100, 100);

    return [
      { name: 'Finanças', value: financesProgress, color: '#4eeeA3' },
      { name: 'Treino', value: workoutProgress, color: '#4eeeA3' },
      { name: 'Nutrição', value: nutritionProgress, color: '#4eeeA3' },
    ];
  }, [transactions, agenda, meals, today]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': return <span className="material-symbols-outlined">emoji_events</span>;
      case 'Zap': return <span className="material-symbols-outlined">bolt</span>;
      case 'Target': return <span className="material-symbols-outlined">radar</span>;
      case 'Star': return <span className="material-symbols-outlined">star</span>;
      case 'Activity': return <span className="material-symbols-outlined">monitoring</span>;
      default: return <span className="material-symbols-outlined">emoji_events</span>;
    }
  };

  return (
    <div className="space-y-12 pb-10">
      {/* User Profile Hero Section */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-container to-primary rounded-lg blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative bg-surface-container-low backdrop-blur-xl rounded-lg p-8 flex flex-col md:flex-row items-center gap-6 border border-white/5">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary-container/30 bg-surface-container-highest">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-5xl">person</span>
                </div>
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-primary-container text-[#131313] p-1.5 rounded-full shadow-lg border-2 border-[#131313]">
              <span className="material-symbols-outlined text-[14px]">edit</span>
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-white">
              {user?.displayName || 'Usuário Pulse'}
            </h2>
            <p className="text-on-surface-variant font-body opacity-80">
              {user?.email || 'email@pulseos.ai'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container/20 text-[#B9CBB9] text-[10px] font-bold tracking-widest uppercase">
                Membro Pro
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-container/10 text-primary-container text-[10px] font-bold tracking-widest uppercase">
                Score: {lifeScore}
              </div>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center bg-surface-container-highest/30 p-4 rounded-xl border border-white/5">
            <div className="text-3xl font-black text-primary-container">{lifeScore}</div>
            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Life Score</div>
          </div>
        </div>
      </section>

      {/* Life Score Report Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold tracking-tight px-2 text-white">Relatório de Performance</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-container uppercase tracking-widest opacity-70">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            Mensal
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Card with Evolution Chart */}
          <div className="lg:col-span-2 bg-surface-container-high rounded-2xl p-8 relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[120px] text-primary-container">auto_awesome</span>
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle className="text-surface-container-highest" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle>
                    <motion.circle 
                      initial={{ strokeDashoffset: 364 }}
                      animate={{ strokeDashoffset: 364 - (364 * lifeScore) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-primary-container drop-shadow-[0_0_8px_rgba(0,180,82,0.4)]" 
                      cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364" strokeLinecap="round" strokeWidth="8"
                    ></motion.circle>
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black font-headline text-white">{lifeScore}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#B9CBB9]">HOJE</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  <h4 className="text-lg font-bold text-white">Evolução Mensal</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Seu score médio nos últimos 30 dias é de <span className="text-primary-container font-bold">{monthlyAverage} pontos</span>. 
                    {trend > 0 ? ' Você está em uma tendência de crescimento! 🔥' : ' Tente manter a consistência para estabilizar seu score.'}
                  </p>
                </div>
              </div>

              {/* Evolution Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest/30 p-3 rounded-xl border border-white/5">
                  <div className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Média Mensal</div>
                  <div className="text-xl font-black text-white">{monthlyAverage}</div>
                </div>
                <div className="bg-surface-container-lowest/30 p-3 rounded-xl border border-white/5">
                  <div className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Tendência</div>
                  <div className={`text-xl font-black ${trend >= 0 ? 'text-primary-container' : 'text-error'}`}>
                    {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-surface-container-lowest/30 p-3 rounded-xl border border-white/5">
                  <div className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Melhor Score</div>
                  <div className="text-xl font-black text-primary-container">
                    {evolutionData.length > 0 ? Math.max(...evolutionData.map(d => d.score)) : 0}
                  </div>
                </div>
                <div className="bg-surface-container-lowest/30 p-3 rounded-xl border border-white/5">
                  <div className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Dias Ativos</div>
                  <div className="text-xl font-black text-white">
                    {evolutionData.filter(d => d.score > 0).length}/30
                  </div>
                </div>
              </div>

              {/* Evolution Chart */}
              <div className="h-48 w-full bg-surface-container-lowest/50 rounded-xl p-4 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00B452" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00B452" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#ffffff30" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      interval={6}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#131313', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '10px' }}
                      itemStyle={{ color: '#00B452' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#00B452" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Breakdown Chart */}
          <div className="bg-surface-container-high rounded-2xl p-6 space-y-4 border border-white/5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary-container">monitoring</span>
              Distribuição
            </h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pillarData} layout="vertical" margin={{ left: -20, right: 20 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#ffffff60" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#131313', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#00B452' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {pillarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 70 ? '#00B452' : entry.value > 30 ? '#00B45280' : '#00B45230'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                <span>Consistência</span>
                <span className="text-primary-container">{Math.round(lifeScore)}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-lowest rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary-container" style={{ width: `${lifeScore}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges / Conquistas Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold tracking-tight px-2 text-white">Conquistas</h3>
          <span className="text-xs font-bold text-[#B9CBB9] uppercase tracking-widest">{badges.length} Desbloqueadas</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <motion.div 
              key={badge.id}
              whileHover={{ y: -5 }}
              className="bg-surface-container-low rounded-2xl p-6 flex flex-col items-center text-center gap-3 border border-white/5 relative group hover:bg-surface-container-high transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary-container/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-primary-container shadow-inner border border-white/5">
                {getIcon(badge.icon)}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{badge.name}</h4>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-tight">{badge.description}</p>
              </div>
              <div className="text-[8px] font-bold text-on-surface-variant uppercase tracking-tighter mt-auto">
                {new Intl.DateTimeFormat('pt-BR').format(new Date(badge.earnedAt))}
              </div>
            </motion.div>
          ))}
          {badges.length === 0 && (
            <div className="col-span-full py-12 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant/30">emoji_events</span>
              <p className="text-sm text-on-surface-variant italic">Complete treinos para desbloquear conquistas.</p>
            </div>
          )}
        </div>
      </section>

      {/* Preferences Toggles */}
      <section className="space-y-6">
        <h3 className="font-headline text-xl font-bold tracking-tight px-2 text-white">Preferências</h3>
        <div className="bg-surface-container-low backdrop-blur-xl rounded-lg overflow-hidden divide-y divide-outline-variant/10 border border-white/5">
          <div className="p-6 flex items-center justify-between hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined">notifications_active</span>
              </div>
              <div>
                <p className="font-bold text-white">Notificações Push</p>
                <p className="text-xs text-on-surface-variant">Lembretes diários e alertas de conquistas</p>
              </div>
            </div>
            <button 
              onClick={() => {
                const newVal = !notifications;
                setNotifications(newVal);
                handleSave('notifications', newVal);
              }}
              className={`w-14 h-8 rounded-full relative flex items-center px-1 shadow-inner transition-colors ${notifications ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="p-6 flex items-center justify-between hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined">dark_mode</span>
              </div>
              <div>
                <p className="font-bold text-white">Modo Escuro</p>
                <p className="text-xs text-on-surface-variant">Tema escuro OLED em todo o sistema</p>
              </div>
            </div>
            <button 
              onClick={() => {
                const newVal = !darkMode;
                setDarkMode(newVal);
                handleSave('darkMode', newVal);
              }}
              className={`w-14 h-8 rounded-full relative flex items-center px-1 shadow-inner transition-colors ${darkMode ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Sign Out Button */}
      <div className="pt-8">
        <button 
          onClick={logout}
          className="w-full py-4 rounded-full border-2 border-error/30 text-error font-bold tracking-wide hover:bg-error/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sair do PulseOS
        </button>
      </div>
    </div>
  );
}
