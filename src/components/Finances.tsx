import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';
import { Transaction } from '../types';
import { 
  subscribeToTransactions, 
  addTransaction, 
  deleteTransaction, 
  subscribeToUserProfile, 
  updateUserProfile 
} from '../services/firestore';
import { auth } from '../firebase';
import { useLifeScoreStore } from '../stores/useLifeScoreStore';
import { recalculateAndSave } from '../services/lifeScoreService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { UserProfile } from '../types';
import { updateStreak } from '../services/streakService';
import StreakBadge from './streaks/StreakBadge';

export default function Finances() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState('0');
  const [isAdding, setIsAdding] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    name: '',
    category: 'Geral',
    amount: 0,
    type: 'debit',
    icon: 'shopping_bag'
  });

  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsubProfile = subscribeToUserProfile((data) => {
      setUserProfile(data as UserProfile);
      if (data.monthlyBudget) setMonthlyBudget(data.monthlyBudget);
    });

    const unsubTransactions = subscribeToTransactions(setTransactions);

    // Midnight Refresh
    const interval = setInterval(() => {
      const current = new Date().toISOString().split('T')[0];
      if (current !== today) {
        setToday(current);
      }
    }, 1000 * 60);

    return () => {
      unsubProfile();
      unsubTransactions();
      clearInterval(interval);
    };
  }, [today]);

  const totalBalance = useMemo(() => transactions.reduce((acc, curr) => 
    curr.type === 'credit' ? acc + curr.amount : acc - curr.amount, 0
  ), [transactions]);

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const monthExpenses = useMemo(() => transactions
    .filter(t => t.type === 'debit' && t.date >= monthStartStr)
    .reduce((acc, curr) => acc + curr.amount, 0)
  , [transactions, monthStartStr]);

  const incomeToday = transactions
    .filter(t => t.type === 'credit' && t.date === today)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expensesToday = transactions
    .filter(t => t.type === 'debit' && t.date === today)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const handleAddTransaction = async () => {
    if (!newTransaction.name || !newTransaction.amount) return;
    await addTransaction(newTransaction as Omit<Transaction, 'id'>);
    
    useLifeScoreStore.getState().showToast('Transação registrada', 'Payments', 0);
    if (auth.currentUser) {
      if (userProfile) {
        updateStreak(auth.currentUser.uid, userProfile, 'financas');
      }
      recalculateAndSave(auth.currentUser.uid);
    }
    
    setIsAdding(false);
    setNewTransaction({
      name: '',
      category: 'Geral',
      amount: 0,
      type: 'debit',
      icon: 'shopping_bag'
    });
  };

  const handleSaveBudget = async () => {
    await updateUserProfile({ monthlyBudget });
    setIsConfigOpen(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Excluir transação?')) {
      await deleteTransaction(id);
      if (auth.currentUser) recalculateAndSave(auth.currentUser.uid);
    }
  };

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'debit' && t.date >= monthStartStr)
      .forEach(t => {
        cats[t.category] = (cats[t.category] || 0) + t.amount;
      });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [transactions, monthStartStr]);

  const COLORS = ['#00E479', '#00FF88', '#9af7b0', '#7eda96', '#3b4b3d'];

  const budgetProgress = Math.min(100, (monthExpenses / parseFloat(monthlyBudget || '1')) * 100);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-headline font-black text-white uppercase tracking-tight">Finanças</h2>
          <StreakBadge pillar="financas" current={userProfile?.streaks?.financas?.current || 0} />
        </div>
      </div>

      {/* Financial Summary Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Balance: Main Feature */}
        <div className="md:col-span-2 bg-surface-container-low rounded-[1.5rem] p-8 relative overflow-hidden group">
          <div className="relative z-10 flex justify-between">
            <div>
              <p className="text-on-surface-variant text-[10px] font-medium tracking-widest uppercase mb-1">Saldo Total</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
              </h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center text-primary-container text-sm font-bold bg-primary-container/10 px-2 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                  Hoje
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsConfigOpen(true)}
              className="text-[#B9CBB9] hover:bg-[#2A2A2A] transition-colors p-2 rounded-full self-start active:scale-95"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
          {/* Abstract visual element */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-gradient-to-br from-[#00E479] to-[#00FF88] opacity-10 blur-3xl rounded-full"></div>
        </div>

        {/* Income & Expenses Stack */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
          <div className="bg-surface-container-high rounded-[1.5rem] p-5">
            <p className="text-on-surface-variant text-[10px] font-medium tracking-widest uppercase mb-2">Renda Hoje</p>
            <p className="text-xl font-bold text-white tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeToday)}
            </p>
          </div>
          <div className="bg-surface-container-high rounded-[1.5rem] p-5">
            <p className="text-on-surface-variant text-[10px] font-medium tracking-widest uppercase mb-2">Despesas Hoje</p>
            <p className="text-xl font-bold text-white tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expensesToday)}
            </p>
          </div>
        </div>
      </section>

      {/* Spending Insights Chart */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white">Desempenho de Gastos</h3>
            <p className="text-xs text-on-surface-variant">Gastos mensais por categoria</p>
          </div>
          <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span className="w-2 h-2 rounded-full bg-surface-container-highest"></span>
          </div>
        </div>
        
        <div className="bg-surface-container-low rounded-xl p-6 h-64">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1d2b3d', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                  itemStyle={{ color: '#00FF88' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant italic">
               Nenhum dado de gasto este mês.
             </div>
          )}
        </div>
      </section>

      {/* Transactions List */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-medium tracking-widest uppercase text-on-surface-variant">Transações Recentes</h3>
        </div>
        <div className="space-y-3">
          {transactions.map((item) => (
            <div 
              key={item.id}
              className="group relative bg-surface-container-high rounded-xl p-4 flex items-center gap-4 transition-transform hover:-translate-x-2 cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.type === 'credit' ? 'bg-primary-container/10 text-primary-container' : 'bg-surface-container-highest text-primary-container'}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-white tracking-tight">{item.name}</p>
                <p className="text-xs text-on-surface-variant">{item.category} • {item.time}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${item.type === 'credit' ? 'text-primary-container' : 'text-white'}`}>
                  {item.type === 'credit' ? '+' : '-'}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                </p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">
                  {item.type === 'credit' ? 'Crédito' : 'Débito'}
                </p>
              </div>
              {/* Swipe indicator (Hidden by default) */}
              <div 
                className="absolute -right-12 top-0 bottom-0 flex items-center px-4 text-error opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(item.id); }}
              >
                <span className="material-symbols-outlined hover:bg-error/10 p-2 rounded-full">delete</span>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-10 text-on-surface-variant text-sm">
              Nenhuma transação registrada.
            </div>
          )}
        </div>
      </section>

      {/* FAB: Add Transaction */}
      <button 
        onClick={() => setIsAdding(true)}
        className="fixed right-6 bottom-28 w-14 h-14 bg-gradient-to-br from-[#00E479] to-[#00FF88] rounded-xl shadow-[0_12px_24px_rgba(0,255,136,0.3)] flex items-center justify-center text-[#131313] z-50 active:scale-90 transition-transform duration-150"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container rounded-2xl shadow-2xl overflow-hidden border border-white/5"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-xl font-bold font-headline">Nova Transação</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Descrição</label>
                  <input 
                    type="text" 
                    value={newTransaction.name}
                    onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-white/5 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary-container outline-none"
                    placeholder="Ex: Apple Store"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Valor (R$)</label>
                    <input 
                      type="number" 
                      value={newTransaction.amount || ''}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
                      className="w-full bg-surface-container-lowest border border-white/5 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary-container outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Tipo</label>
                    <div className="flex bg-surface-container-lowest p-1 rounded-xl border border-white/5">
                      <button 
                        onClick={() => setNewTransaction({ ...newTransaction, type: 'credit' })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newTransaction.type === 'credit' ? 'bg-primary-container text-[#131313]' : 'text-on-surface-variant'}`}
                      >
                        Entrada
                      </button>
                      <button 
                        onClick={() => setNewTransaction({ ...newTransaction, type: 'debit' })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newTransaction.type === 'debit' ? 'bg-surface-container-highest text-white' : 'text-on-surface-variant'}`}
                      >
                        Saída
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Categoria</label>
                  <select 
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-white/5 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary-container outline-none"
                  >
                    <option value="Geral">Geral</option>
                    <option value="Alimentação">Alimentação</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Assinaturas">Assinaturas</option>
                    <option value="Lazer">Lazer</option>
                    <option value="Trabalho">Trabalho</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button 
                    onClick={handleAddTransaction}
                    className="w-full py-4 bg-primary-container text-[#131313] font-bold rounded-xl shadow-[0_12px_24px_rgba(0,255,136,0.3)] active:scale-[0.98] transition-transform"
                  >
                    Salvar Transação
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Config Modal */}
      <AnimatePresence>
        {isConfigOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container rounded-2xl shadow-2xl p-6 border border-white/5 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-headline">Configurações Financeiras</h2>
                <button onClick={() => setIsConfigOpen(false)} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Meta de Gasto Mensal (R$)</label>
                  <div className="bg-surface-container-lowest rounded-xl p-4 border border-white/5">
                    <input 
                      type="number" 
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-3xl font-black text-white outline-none"
                    />
                  </div>
                  <p className="text-xs text-outline italic">Este valor pode ser usado para relatórios futuros.</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsConfigOpen(false)}
                    className="flex-1 py-3 bg-surface-container-highest text-white font-bold rounded-xl active:scale-[0.98] transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveBudget}
                    className="flex-1 py-3 bg-primary-container text-[#131313] font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all text-sm flex justify-center items-center gap-2"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
