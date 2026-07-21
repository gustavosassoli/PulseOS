import { Tab } from '../types';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'life', label: 'Início', icon: 'grid_view' },
    { id: 'finances', label: 'Finanças', icon: 'payments' },
    { id: 'diet', label: 'Dieta', icon: 'restaurant' },
    { id: 'workout', label: 'Treino', icon: 'fitness_center' },
    { id: 'agenda', label: 'Hábitos', icon: 'auto_awesome' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-2 safe-pb bg-[#131313]/60 backdrop-blur-xl border-t border-white/5 rounded-t-[1.5rem] shadow-[0_-12px_24px_rgba(0,0,0,0.4)] safe-pl safe-pr">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as Tab)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center min-touch py-2 px-1 sm:px-4 transition-all active:scale-95 duration-150",
              isActive 
                ? "bg-[#00FF88] text-[#131313] rounded-[1rem] shadow-lg shadow-[#00FF88]/20" 
                : "text-[#B9CBB9] hover:text-white"
            )}
          >
            <span 
              className={cn("material-symbols-outlined text-[24px] mb-0.5")} 
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
            <span className="font-['Inter'] text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
