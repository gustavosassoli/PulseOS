import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AgendaItem, UserProfile, RecurringTemplate } from '../types';
import { subscribeToAgenda, toggleAgendaItem, addAgendaItem, updateAgendaItem, deleteAgendaItem, subscribeToUserProfile } from '../services/firestore';
import { suggestProductivityTask } from '../services/aiService';
import { recalculateAndSave } from '../services/lifeScoreService';
import { auth, db } from '../firebase';
import { useLifeScoreStore } from '../stores/useLifeScoreStore';
import { updateStreak } from '../services/streakService';
import StreakBadge from './streaks/StreakBadge';
import { generateTodayInstances, createRecurringTemplate, deleteTemplate, toggleTemplateStatus } from '../services/recurringService';
import RecurringTasksScreen from '../screens/RecurringTasksScreen';
import RecurrenceSelector from './agenda/RecurrenceSelector';
import TaskContextMenu from './agenda/TaskContextMenu';
import PriorityFilterChips from './agenda/PriorityFilterChips';
import PrioritySelector from './agenda/PrioritySelector';
import PriorityTag from './agenda/PriorityTag';
import OverdueUrgentSection from './agenda/OverdueUrgentSection';
import { sortAgendaItems } from '../utils/sortAgendaItems';
import { isOverdueUrgent } from '../utils/getOverdueUrgentTasks';
import { Repeat, Droplets, CheckSquare } from 'lucide-react';
import HydrationAlerts from './agenda/HydrationAlerts';

export default function Agenda() {
  const [subTab, setSubTab] = useState<'protocols' | 'hydration'>('protocols');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [editingItem, setEditingItem] = useState<Partial<AgendaItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showRecurringTasks, setShowRecurringTasks] = useState(false);
  
  // Filtering
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Recurrence states for modal
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily'|'weekly'|'weekdays'|'weekends'>('daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([1,3,5]);
  const [selectedPriority, setSelectedPriority] = useState<'urgent'|'important'|'normal'>('normal');

  // Context Menu State
  const [contextMenuTarget, setContextMenuTarget] = useState<AgendaItem | null>(null);
  
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (auth.currentUser) {
      generateTodayInstances(auth.currentUser.uid).catch(console.error);
    }
  }, [today]);

  useEffect(() => {
    const unsubProfile = subscribeToUserProfile(setUserProfile);
    const interval = setInterval(() => {
      const current = new Date().toISOString().split('T')[0];
      if (current !== today) {
        setToday(current);
      }
    }, 1000 * 60);
    return () => {
      clearInterval(interval);
      unsubProfile();
    };
  }, [today]);

  useEffect(() => {
    const unsubscribe = subscribeToAgenda(setItems, today);
    return () => unsubscribe();
  }, [today]);

  const handleToggle = async (id: string, completed: boolean) => {
    await toggleAgendaItem(id, !completed);
    if (!completed) {
      useLifeScoreStore.getState().showToast('Tarefa concluída', 'CheckSquare', 0);
    }
    if (auth.currentUser) {
      if (userProfile && !completed) {
        updateStreak(auth.currentUser.uid, userProfile, 'agenda');
      }
      recalculateAndSave(auth.currentUser.uid);
    }
  };

  const handleAddNew = () => {
    setEditingItem({
      title: '',
      category: 'Pessoal',
      time: '09:00',
      location: '',
      completed: false,
      duration: '1h',
      categoryColor: 'primary-container',
      icon: 'check',
      date: today,
      priority: 'normal'
    });
    setSelectedPriority('normal');
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este protocolo?')) {
      try {
        await deleteAgendaItem(id);
        if (editingItem?.id === id) {
          setIsModalOpen(false);
          setEditingItem(null);
        }
      } catch (error) {
        console.error("Erro ao excluir item:", error);
      }
    }
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingTemplateId && auth.currentUser) {
      const { updateTemplate } = await import('../services/recurringService');
      await updateTemplate(auth.currentUser.uid, editingTemplateId, {
        title: editingItem.title || '',
        time: editingItem.time || '09:00',
        category: (editingItem.category as any) || 'Pessoal',
        icon: editingItem.icon || 'check',
        priority: selectedPriority,
        ...(isRecurring ? {
          recurrence: {
            type: recurrenceType,
            ...(recurrenceType === 'weekly' ? { days: recurrenceDays } : {})
          }
        } : {})
      });
      useLifeScoreStore.getState().showToast('Template atualizado!', 'Check', 0);
    } else if (isEditMode && editingItem.id) {
      const { id, ...updates } = editingItem as AgendaItem;
      await updateAgendaItem(id, { ...updates, priority: selectedPriority });
    } else {
      if (isRecurring && auth.currentUser) {
        // Create recurring template
        await createRecurringTemplate(auth.currentUser.uid, {
          title: editingItem.title || '',
          time: editingItem.time || '09:00',
          category: (editingItem.category as any) || 'Pessoal',
          icon: editingItem.icon || 'check',
          priority: selectedPriority,
          active: true,
          recurrence: {
            type: recurrenceType,
            ...(recurrenceType === 'weekly' ? { days: recurrenceDays } : {})
          }
        });
        useLifeScoreStore.getState().showToast('Tarefa recorrente criada! ✦', 'Repeat', 0);
        // And safely generate today
        generateTodayInstances(auth.currentUser.uid).catch(console.error);
      } else {
        await addAgendaItem({ 
          ...editingItem as Omit<AgendaItem, 'id'>,
          priority: selectedPriority
        });
      }
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
    setEditingTemplateId(null);
  };

  const handleEdit = (item: AgendaItem) => {
    setEditingItem({ ...item });
    setSelectedPriority(item.priority || 'normal');
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleLongPress = (item: AgendaItem) => {
    setContextMenuTarget(item);
  };

  const completedCount = items.filter(i => i.completed).length;
  const completionPercentage = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  if (showRecurringTasks) {
    return (
      <RecurringTasksScreen 
        onBack={() => setShowRecurringTasks(false)} 
        onEditToken={(template) => { 
          setEditingItem({
            title: template.title,
            time: template.time,
            category: template.category,
            icon: template.icon
          });
          setEditingTemplateId(template.id);
          setIsRecurring(true);
          setRecurrenceType(template.recurrence.type);
          if (template.recurrence.days) setRecurrenceDays(template.recurrence.days);
          setIsEditMode(true);
          setIsModalOpen(true);
          setShowRecurringTasks(false);
        }}
        onCreateNew={() => { setShowRecurringTasks(false); handleAddNew(); setIsRecurring(true); setEditingTemplateId(null); }}
      />
    );
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Dashboard Header */}
      <section className="mb-10">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant">IMPULSO DIÁRIO</span>
            <button onClick={() => setShowRecurringTasks(true)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors flex items-center gap-2 text-[#B9CBB9] hover:text-primary-container">
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Gerenciar Recorrentes</span>
              <Repeat className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-white tracking-tighter italic">MANTENHA O RITMO.</h2>
            <StreakBadge pillar="agenda" current={userProfile?.streaks?.agenda?.current || 0} />
          </div>
        </div>
        
        {/* Bento Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary-container">SEQUÊNCIA ATIVA</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{userProfile?.streaks?.agenda?.current || '--'}</span>
              <span className="text-on-surface-variant text-sm font-bold tracking-tight">DIAS</span>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            </div>
          </div>
          <div className="bg-surface-container-high p-6 rounded-xl flex flex-col justify-between h-32 border-l-4 border-primary-container">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">CONCLUSÃO</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{completionPercentage}</span>
              <span className="text-primary-container font-bold text-xl">%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-tab Navigation */}
      <div className="flex p-1 bg-surface-container-low rounded-xl border border-white/5 my-6">
        <button
          onClick={() => setSubTab('protocols')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'protocols'
              ? 'bg-primary-container text-[#00210C] shadow-sm'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Protocolos & Hábitos
        </button>
        <button
          onClick={() => setSubTab('hydration')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'hydration'
              ? 'bg-primary-container text-[#00210C] shadow-sm'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <Droplets className="w-4 h-4" />
          Alertas de Hidratação
        </button>
      </div>

      {subTab === 'hydration' ? (
        <HydrationAlerts />
      ) : (
        <>
          {/* Priority Filter */}
          <PriorityFilterChips selectedPriority={priorityFilter} onChange={setPriorityFilter} />

          {/* Habits Checklist Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-end mb-6 mt-4">
              <h3 className="font-label text-[12px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Protocolos Atuais</h3>
              <span className="text-on-surface-variant text-xs">{completedCount} de {items.length} concluídos</span>
            </div>

            <div className="space-y-4">
              {(() => {
                let displayItems = priorityFilter === 'all' 
                  ? items 
                  : items.filter(i => (i.priority || 'normal') === priorityFilter);
                
                displayItems = sortAgendaItems(displayItems);
                
                const overdueItems = displayItems.filter(isOverdueUrgent);
                const regularItems = displayItems.filter(i => !isOverdueUrgent(i));
                
                return (
                  <>
                    <OverdueUrgentSection 
                      items={overdueItems}
                      onToggle={handleToggle}
                      onLongPress={handleLongPress}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />

                    {regularItems.map((item) => (
                      <div 
                        key={item.id} 
                        onContextMenu={(e) => { e.preventDefault(); handleLongPress(item); }}
                        className={`group flex flex-col sm:flex-row items-start sm:items-center bg-surface-container-low p-5 rounded-xl transition-all duration-300 hover:bg-surface-container-high relative
                          ${item.priority === 'urgent' && !item.completed ? 'border-l-[3px] border-l-[#FF4D4D]' : ''}
                          ${item.priority === 'important' && !item.completed ? 'border-l-[3px] border-l-[#FFD166]' : ''}
                        `}
                      >
                        <div className="flex-shrink-0 mr-5 mb-3 sm:mb-0">
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggle(item.id, item.completed)}
                            className={`relative overflow-hidden w-10 h-10 rounded-[1rem] flex items-center justify-center transition-all duration-300 cursor-pointer ${
                              item.completed 
                                ? "text-[#00210C] shadow-[0_0_20px_rgba(0,255,136,0.2)] border-2 border-transparent" 
                                : "border-2 border-outline-variant text-transparent hover:border-primary-container hover:text-primary-container"
                            }`}
                          >
                            <AnimatePresence>
                              {item.completed && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                  className="absolute inset-0 bg-primary-container"
                                />
                              )}
                            </AnimatePresence>
                            <motion.span 
                              initial={false}
                              animate={{ scale: item.completed ? 1 : 0.5, opacity: item.completed ? 1 : 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 25, delay: item.completed ? 0.1 : 0 }}
                              className="material-symbols-outlined text-xl font-bold relative z-10"
                            >
                              check
                            </motion.span>
                          </motion.button>
                        </div>
                        <div className="flex-grow">
                          <h4 className={`text-on-surface font-bold text-lg tracking-tight ${item.completed ? "line-through opacity-40" : ""}`}>
                            {item.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <PriorityTag priority={item.priority} />
                            <span className="material-symbols-outlined text-[16px] text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                              history
                            </span>
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mr-2 flex items-center gap-1">
                              {item.time}
                              {item.fromTemplate && <Repeat className="w-3 h-3 text-[#B9CBB9] ml-1" title="Tarefa recorrente" />}
                            </span>
                            {item.location && (
                              <>
                                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">location_on</span>
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{item.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Context menu actions */}
                        <div className="absolute right-4 top-4 sm:relative sm:right-auto sm:top-auto flex gap-2 opacity-100 sm:opacity-20 sm:group-hover:opacity-100 transition-opacity ml-auto">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-1 hover:text-primary-container hover:bg-surface-container-highest rounded"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1 hover:text-error hover:bg-error/10 rounded"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                
                    {displayItems.length === 0 && (
                      <div className="text-center py-10 text-on-surface-variant">
                        Nenhum protocolo cadastrado para este dia ou filtro.
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </section>

          {/* FAB: Add Habit */}
          <button 
            onClick={handleAddNew}
            className="fixed right-6 bottom-28 w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-[#00E479] to-[#00FF88] text-[#003919] shadow-[0_12px_24px_rgba(0,255,136,0.3)] z-50 flex items-center justify-center transition-transform active:scale-90 duration-150"
          >
            <span className="material-symbols-outlined text-3xl font-bold">add</span>
          </button>
        </>
      )}

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {isModalOpen && editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container rounded-[1.5rem] shadow-2xl overflow-hidden border border-white/5"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-xl font-bold font-headline">{isEditMode ? 'Editar Protocolo' : 'Novo Protocolo'}</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-surface-container-highest rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Título</label>
                  <input 
                    type="text" 
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-white/5 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-on-surface-variant/50"
                    placeholder="Ex: Leitura Profunda"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Horário</label>
                    <input 
                      type="time" 
                      value={editingItem.time || '09:00'}
                      onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-white/5 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary-container outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Categoria</label>
                    <select 
                      value={editingItem.category || 'Pessoal'}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                      className="w-full bg-surface-container-lowest border border-white/5 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary-container outline-none transition-all"
                    >
                      <option value="Trabalho">Trabalho</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Pessoal">Pessoal</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Prioridade
                  </label>
                  <PrioritySelector 
                    value={selectedPriority} 
                    onChange={setSelectedPriority} 
                  />
                </div>
                
                {!isEditMode && (
                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Repetir esta tarefa?</span>
                      <button
                        type="button"
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isRecurring ? 'bg-primary-container' : 'bg-[#2A2A2A]'}`}
                      >
                        <motion.div
                          className="w-5 h-5 rounded-full bg-white absolute top-0.5"
                          initial={false}
                          animate={{ left: isRecurring ? 'calc(100% - 22px)' : '2px' }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isRecurring && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-4"
                        >
                          <select 
                            value={recurrenceType}
                            onChange={(e) => setRecurrenceType(e.target.value as any)}
                            className="w-full bg-[#2A2A2A] rounded-xl py-3 px-4 text-white hover:bg-[#353534] transition-colors outline-none cursor-pointer appearance-none font-medium"
                          >
                            <option value="daily">Todos os dias</option>
                            <option value="weekdays">Dias úteis (Seg–Sex)</option>
                            <option value="weekends">Fim de semana (Sáb–Dom)</option>
                            <option value="weekly">Dias específicos...</option>
                          </select>

                          {recurrenceType === 'weekly' && (
                            <div className="pt-2">
                              <RecurrenceSelector selectedDays={recurrenceDays} onChange={setRecurrenceDays} />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-surface-container-highest/80 transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-primary-container text-[#00210C] font-bold rounded-xl shadow-[0_4px_12px_rgba(0,255,136,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                  >
                    {isEditMode ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TaskContextMenu
        isOpen={contextMenuTarget !== null}
        onClose={() => setContextMenuTarget(null)}
        isRecurring={!!contextMenuTarget?.fromTemplate}
        onEditToday={() => {
          if (contextMenuTarget) handleEdit(contextMenuTarget);
        }}
        onEditAlways={() => {
          if (contextMenuTarget && contextMenuTarget.templateId && auth.currentUser) {
            import('firebase/firestore').then(async ({ doc, getDoc }) => {
              if(!auth.currentUser) return;
              const ref = doc(db, `users/${auth.currentUser.uid}/recurringTemplates/${contextMenuTarget.templateId}`);
              const snap = await getDoc(ref);
              if (snap.exists()) {
                const template = { id: snap.id, ...snap.data() } as RecurringTemplate;
                setEditingItem({
                  title: template.title,
                  time: template.time,
                  category: template.category,
                  icon: template.icon
                });
                setSelectedPriority(template.priority || 'normal');
                setEditingTemplateId(template.id);
                setIsRecurring(true);
                setRecurrenceType(template.recurrence.type);
                if (template.recurrence.days) setRecurrenceDays(template.recurrence.days);
                setIsEditMode(true);
                setIsModalOpen(true);
              }
            });
          }
        }}
        onPauseTemplate={async () => {
          if (contextMenuTarget?.templateId && auth.currentUser) {
             await toggleTemplateStatus(auth.currentUser.uid, contextMenuTarget.templateId, true);
             useLifeScoreStore.getState().showToast('Tarefa pausada', 'PauseCircle', 0);
          }
        }}
        onDeleteToday={() => {
           if (contextMenuTarget) handleDelete(contextMenuTarget.id);
        }}
        onDeleteAlways={async () => {
          if (contextMenuTarget?.templateId && auth.currentUser) {
             if (window.confirm('Excluir este template? Não será mais gerado.')) {
               await deleteTemplate(auth.currentUser.uid, contextMenuTarget.templateId);
               useLifeScoreStore.getState().showToast('Template excluído', 'Trash2', 0);
             }
          }
        }}
      />
    </div>
  );
}
