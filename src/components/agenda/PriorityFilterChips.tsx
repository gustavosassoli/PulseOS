import { Circle, AlertCircle, AlertTriangle } from 'lucide-react';

interface Props {
  selectedPriority: string;
  onChange: (priority: string) => void;
}

export default function PriorityFilterChips({ selectedPriority, onChange }: Props) {
  const filters = [
    { id: 'all', label: 'Todas', color: 'bg-white text-[#131313]' },
    { id: 'urgent', label: 'Urgentes', icon: AlertCircle, color: 'bg-[#FF4D4D] text-white', dot: '🔴' },
    { id: 'important', label: 'Importantes', icon: AlertTriangle, color: 'bg-[#FFD166] text-[#131313]', dot: '🟡' },
    { id: 'normal', label: 'Normais', icon: Circle, color: 'bg-[#00FF88] text-[#131313]', dot: '🟢' },
  ];

  return (
    <div className="flex overflow-x-auto no-scrollbar gap-2 py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {filters.map(filter => {
        const isSelected = selectedPriority === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onChange(filter.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors flex-shrink-0
              ${isSelected ? filter.color : 'bg-[#2A2A2A] text-[#B9CBB9] hover:bg-[#353534]'}`}
          >
            {filter.dot && <span>{filter.dot}</span>}
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
