import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RecurringTemplate } from '../types';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toggleTemplateStatus, deleteTemplate } from '../services/recurringService';
import { ArrowLeft, Plus, Pencil, Trash2, Repeat, Clock } from 'lucide-react';
import { useLifeScoreStore } from '../stores/useLifeScoreStore';

const CatColors = {
  'Trabalho': '#00FF88',
  'Saúde': '#00E479',
  'Pessoal': '#00C366'
};

interface Props {
  onBack: () => void;
  onEditToken: (template: RecurringTemplate) => void;
  onCreateNew: () => void;
}

export default function RecurringTasksScreen({ onBack, onEditToken, onCreateNew }: Props) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateToDelete, setTemplateToDelete] = useState<RecurringTemplate | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/recurringTemplates`),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as RecurringTemplate)));
      setLoading(false);
    });
    
    return () => unsub();
  }, []);

  const handleToggle = async (template: RecurringTemplate) => {
    if (!auth.currentUser) return;
    await toggleTemplateStatus(auth.currentUser.uid, template.id, template.active);
    
    if (template.active) {
      useLifeScoreStore.getState().showToast('Tarefa pausada. Não vai aparecer nos próximos dias.', 'PauseCircle', 0);
    } else {
      useLifeScoreStore.getState().showToast('Tarefa reativada! Volta amanhã. ✦', 'PlayCircle', 0);
    }
  };

  const confirmDelete = async () => {
    if (!auth.currentUser || !templateToDelete) return;
    await deleteTemplate(auth.currentUser.uid, templateToDelete.id);
    setTemplateToDelete(null);
    useLifeScoreStore.getState().showToast('Template excluído', 'Trash2', 0);
  };

  const formatRecurrence = (rec: RecurringTemplate['recurrence']) => {
    switch (rec.type) {
      case 'daily': return 'Diária';
      case 'weekdays': return 'Dias úteis';
      case 'weekends': return 'Fim de semana';
      case 'weekly':
        const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return rec.days?.map(d => daysMap[d]).join(', ') || 'Semanal';
      default: return '';
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full min-h-screen flex flex-col p-4 sm:p-6 pb-24 relative">
        <header className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white font-bold hover:text-primary-container transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <h1 className="text-xl font-headline tracking-tight">Tarefas Recorrentes</h1>
          </button>
          
          <button
            onClick={onCreateNew}
            className="w-10 h-10 rounded-full bg-primary-container text-[#131313] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,136,0.2)]"
          >
            <Plus className="w-5 h-5" />
          </button>
        </header>

        {templates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-[#1C1B1B] border border-[#2A2A2A] flex items-center justify-center">
              <Repeat className="w-10 h-10 text-[#353534]" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-black text-white mb-2">Nenhuma tarefa recorrente</h2>
              <p className="text-[#B9CBB9] max-w-sm mx-auto">
                Crie tarefas que se repetem automaticamente e nunca esqueça sua rotina
              </p>
            </div>
            <button
               onClick={onCreateNew}
               className="px-6 py-4 bg-primary-container text-[#131313] font-bold rounded-xl shadow-[0_12px_24px_rgba(0,255,136,0.3)] active:scale-[0.98] transition-transform"
            >
              Criar primeira tarefa recorrente
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map(template => (
              <div key={template.id} className="bg-[#1C1B1B] rounded-2xl p-4 sm:p-5 flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center"
                    style={{ backgroundColor: `${CatColors[template.category]}20`, color: CatColors[template.category] }}
                  >
                    <span className="material-symbols-outlined text-2xl">{template.icon || 'task_alt'}</span>
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 leading-tight ${template.active ? 'text-white' : 'text-[#B9CBB9]/60 line-through'}`}>
                      {template.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[#B9CBB9] text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{template.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Repeat className="w-3.5 h-3.5" />
                        <span>{formatRecurrence(template.recurrence)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Custom Toggle Switch */}
                  <button
                    onClick={() => handleToggle(template)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${template.active ? 'bg-primary-container' : 'bg-[#353534]'}`}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5"
                      initial={false}
                      animate={{
                        left: template.active ? 'calc(100% - 22px)' : '2px'
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                  
                  {/* Menu buttons */}
                  <div className="flex items-center gap-1">
                     <button
                       onClick={() => onEditToken(template)}
                       className="p-2 rounded-full hover:bg-[#2A2A2A] text-[#B9CBB9] transition-colors"
                     >
                       <Pencil className="w-4 h-4" />
                     </button>
                     <button
                       onClick={() => setTemplateToDelete(template)}
                       className="p-2 rounded-full hover:bg-[#FF4D4D]/10 text-[#FF4D4D] transition-colors"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {templateToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#131313]/80 backdrop-blur-sm"
              onClick={() => setTemplateToDelete(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1C1B1B] rounded-3xl p-6 relative z-10 w-full max-w-sm"
            >
              <h3 className="text-xl font-headline font-black text-white mb-2">Excluir {templateToDelete.title}?</h3>
              <p className="text-[#B9CBB9] text-sm mb-6 leading-relaxed">
                Ela não vai mais aparecer nos próximos dias. As tarefas já geradas em dias anteriores não serão afetadas.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTemplateToDelete(null)}
                  className="flex-1 py-3 bg-[#2A2A2A] text-white font-bold rounded-xl"
                >
                  Manter
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-[#FF4D4D]/10 text-[#FF4D4D] font-bold rounded-xl border border-[#FF4D4D]/20"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
