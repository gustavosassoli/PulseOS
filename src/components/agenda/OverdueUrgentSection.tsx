import { motion } from 'motion/react';
import { AgendaItem } from '../../types';
import PriorityTag from './PriorityTag';
import { Repeat } from 'lucide-react';

interface Props {
  items: AgendaItem[];
  onToggle: (id: string, completed: boolean) => void;
  onLongPress: (item: AgendaItem) => void;
  onEdit: (item: AgendaItem) => void;
  onDelete: (id: string) => void;
}

export default function OverdueUrgentSection({ items, onToggle, onLongPress, onEdit, onDelete }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <div className="text-[11px] font-bold tracking-widest text-[#FF4D4D] mb-4">
        ⚠️ TAREFAS URGENTES ATRASADAS ({items.length})
      </div>
      {items.map((item) => (
        <div 
          key={item.id} 
          onContextMenu={(e) => { e.preventDefault(); onLongPress(item); }}
          className="group flex flex-col sm:flex-row items-start sm:items-center bg-[#FF4D4D]/8 border border-[#FF4D4D]/40 p-5 rounded-xl transition-all duration-300 relative"
        >
          <motion.div 
            animate={{ opacity: [0.4, 0.8, 0.4] }} 
            transition={{ repeat: Infinity, duration: 2 }} 
            className="absolute inset-0 border border-[#FF4D4D] rounded-xl pointer-events-none" 
          />
          <div className="absolute right-4 top-[-10px] bg-[#FF4D4D] text-white text-[10px] font-bold uppercase rounded-full px-2 py-0.5">
            ⏰ Atrasada
          </div>
          
          <div className="flex-shrink-0 mr-5 mb-3 sm:mb-0 relative z-10">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggle(item.id, item.completed)}
              className="relative overflow-hidden w-10 h-10 rounded-[1rem] flex items-center justify-center transition-all duration-300 cursor-pointer border-2 border-outline-variant text-transparent hover:border-primary-container hover:text-primary-container"
            >
              <motion.span 
                initial={false}
                animate={{ scale: 0.5, opacity: 0 }}
                className="material-symbols-outlined text-xl font-bold relative z-10"
              >
                check
              </motion.span>
            </motion.button>
          </div>
          <div className="flex-grow z-10">
            <h4 className="text-on-surface font-bold text-lg tracking-tight">
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
          <div className="absolute right-4 top-4 sm:relative sm:right-auto sm:top-auto flex gap-2 opacity-100 sm:opacity-20 sm:group-hover:opacity-100 transition-opacity ml-auto z-10">
            <button 
              onClick={() => onEdit(item)}
              className="p-1 hover:text-primary-container hover:bg-surface-container-highest rounded"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button 
              onClick={() => onDelete(item.id)}
              className="p-1 hover:text-error hover:bg-error/10 rounded"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
