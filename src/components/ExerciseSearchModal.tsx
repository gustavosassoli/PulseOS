import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkoutXExercise, searchExercisesByName } from '../services/workoutXService';
import { SearchX, Loader2 } from 'lucide-react';
import { useLifeScoreStore } from '../stores/useLifeScoreStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  onSelect: (gifUrl: string, muscles: string, calorieEstimate: number) => void;
}

export default function ExerciseSearchModal({ isOpen, onClose, initialQuery, onSelect }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<WorkoutXExercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      if (initialQuery.length >= 3) {
        handleSearch(initialQuery);
      }
    }
  }, [isOpen, initialQuery]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) return;
    setLoading(true);
    const data = await searchExercisesByName(searchQuery);
    setResults(data);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#1C1B1B] w-full max-w-[480px] w-[90vw] rounded-xl border border-white/10 shadow-2xl relative z-10 flex flex-col max-h-[80vh] overflow-hidden p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-bold font-headline">Buscar GIF para {initialQuery}</h2>
              <button onClick={onClose} className="p-2 bg-transparent rounded-full text-[#B9CBB9] hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                placeholder="Nome do exercício..."
                className="flex-1 bg-surface-container-low border border-white/5 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-[#00FF88]/50"
              />
              <button 
                onClick={() => handleSearch(query)}
                disabled={loading}
                className="bg-primary-container text-[#131313] px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center min-w-[80px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#131313]" /> : 'Buscar'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00FF88]" />
                  <p className="text-xs text-[#B9CBB9]">Buscando na WorkoutX API...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        onSelect(item.gifUrl, item.target, item.calorieEstimate);
                        useLifeScoreStore.getState().showToast('GIF adicionado! ✦', 'CheckCircle', 0);
                        onClose();
                      }}
                      className="bg-[#2A2A2A] p-2 rounded-xl flex flex-col gap-2 cursor-pointer hover:bg-[#353534] hover:ring-1 hover:ring-[#00FF88] transition-all"
                    >
                      <div className="aspect-video bg-[#0E0E0E] rounded-lg overflow-hidden flex items-center justify-center">
                        {item.gifUrl ? (
                          <img src={item.gifUrl} alt={item.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[#B9CBB9] text-[10px]">Sem visualização</span>
                        )}
                      </div>
                      <div className="flex-1 px-1">
                        <p className="text-white text-xs font-bold capitalize truncate mb-1">{item.name}</p>
                        <div className="flex flex-wrap items-center gap-1">
                          {item.target && (
                            <span className="text-[#00FF88] text-[9px] uppercase font-black truncate bg-[#00FF88]/10 px-1.5 py-0.5 rounded-full">{item.target}</span>
                          )}
                          {item.difficulty && (
                            <span className="text-[#B9CBB9] text-[9px] uppercase font-bold truncate bg-[#353534] px-1.5 py-0.5 rounded-full">{item.difficulty}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3 bg-surface-container-lowest rounded-xl border border-dashed border-white/10">
                  <SearchX className="w-8 h-8 text-[#353534]" />
                  <p className="text-sm font-medium text-[#B9CBB9]">Nenhum exercício encontrado</p>
                  <p className="text-xs text-[#353534]">Tente um nome diferente</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
