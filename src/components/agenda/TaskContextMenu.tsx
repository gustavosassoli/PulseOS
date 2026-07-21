import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Trash2, PauseCircle, CalendarClock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isRecurring: boolean;
  onEditToday: () => void;
  onEditAlways: () => void;
  onPauseTemplate?: () => void;
  onDeleteToday: () => void;
  onDeleteAlways: () => void;
}

export default function TaskContextMenu({ 
  isOpen, 
  onClose, 
  isRecurring,
  onEditToday,
  onEditAlways,
  onPauseTemplate,
  onDeleteToday,
  onDeleteAlways 
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
           <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#131313]/80 backdrop-blur-sm"
              onClick={onClose}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-[#1C1B1B] rounded-t-3xl sm:rounded-3xl p-6 relative z-10"
            >
              <div className="w-12 h-1.5 bg-[#353534] rounded-full mx-auto mb-6" />
              
              <h3 className="text-white font-headline font-black text-xl mb-4">Opções da Tarefa</h3>

              <div className="space-y-2">
                 {isRecurring && (
                  <>
                    <button 
                      onClick={() => { onEditAlways(); onClose(); }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-[#353534] text-white transition-colors text-left font-medium"
                    >
                      <CalendarClock className="w-5 h-5 text-[#B9CBB9]" />
                      Editar sempre (Template)
                    </button>
                    <button 
                      onClick={() => { onPauseTemplate?.(); onClose(); }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-[#353534] text-white transition-colors text-left font-medium"
                    >
                      <PauseCircle className="w-5 h-5 text-[#B9CBB9]" />
                      Pausar recorrência
                    </button>
                  </>
                )}

                <button 
                  onClick={() => { onEditToday(); onClose(); }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-[#353534] text-white transition-colors text-left font-medium"
                >
                  <Pencil className="w-5 h-5 text-[#B9CBB9]" />
                  {isRecurring ? 'Editar apenas hoje' : 'Editar tarefa'}
                </button>

                <button 
                   onClick={() => { onDeleteToday(); onClose(); }}
                   className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-[#353534] text-white transition-colors text-left font-medium text-[#FF4D4D]"
                >
                  <Trash2 className="w-5 h-5" />
                  {isRecurring ? 'Excluir apenas hoje' : 'Excluir tarefa'}
                </button>

                 {isRecurring && (
                   <button 
                     onClick={() => { onDeleteAlways(); onClose(); }}
                     className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-[#353534] transition-colors text-left font-bold text-[#FF4D4D] bg-[#FF4D4D]/10"
                   >
                     <Trash2 className="w-5 h-5" />
                     Excluir sempre (Parar de gerar)
                   </button>
                 )}
              </div>
              
              <button
                 onClick={onClose}
                 className="w-full mt-6 py-4 bg-[#2A2A2A] text-white font-bold rounded-xl"
              >
                Cancelar
              </button>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
