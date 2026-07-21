import { useState, useEffect, useRef } from 'react';
import { WorkoutXExercise, searchExercisesByName } from '../services/workoutXService';

interface Props {
  value: string;
  onChange: (name: string, muscles: string, gifUrl: string, calorieEstimate: number) => void;
}

export default function ExerciseSearchDropdown({ value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<WorkoutXExercise[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    // Sync external changes
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length >= 3 && isOpen) {
        setLoading(true);
        const data = await searchExercisesByName(query);
        setResults(data ? data.slice(0, 5) : []);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, isOpen]);

  const handleSelect = (item: WorkoutXExercise) => {
    onChange(item.name, item.target, item.gifUrl, item.calorieEstimate);
    setQuery(item.name);
    setIsOpen(false);
    setHighlighted(true);
    setTimeout(() => setHighlighted(false), 1000);
  };

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <input
        type="text"
        placeholder="Exercício"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          onChange(e.target.value, '', '', 0); // partial update when typing
        }}
        className={`w-full bg-transparent border-none text-sm text-white outline-none p-1 rounded-md transition-all ${highlighted ? 'ring-2 ring-[#00FF88]' : 'focus:ring-1 focus:ring-primary-container'}`}
      />

      {isOpen && query.length >= 3 && (
        <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-[#2A2A2A] border border-[#3B4B3D] rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.4)] max-h-64 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="p-4 text-center text-[#B9CBB9] text-xs">Buscando...</div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="flex items-center gap-3 p-2 hover:bg-[#353534] cursor-pointer transition-colors border-b border-white/5 last:border-0"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 shrink-0">
                  {item.gifUrl ? (
                    <img src={item.gifUrl} alt={item.name} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className="text-white text-[14px] font-bold truncate capitalize font-inter">{item.name}</p>
                  <div className="flex items-center gap-2">
                    {item.target && (
                      <span className="bg-[#00FF88]/10 text-[#00FF88] text-[11px] px-2 py-[2px] rounded-full uppercase truncate">
                        {item.target}
                      </span>
                    )}
                    {item.difficulty && (
                      <span className="bg-[#353534] text-[#B9CBB9] text-[11px] px-2 py-[2px] rounded-full uppercase truncate">
                        {item.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-[#B9CBB9] text-xs">Nenhum exercício encontrado.</div>
          )}
        </div>
      )}
    </div>
  );
}
