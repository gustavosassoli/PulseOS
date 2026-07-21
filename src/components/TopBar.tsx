import { auth, logout } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useTodayCheckin } from '../hooks/useTodayCheckin';

interface TopBarProps {
  onProfileClick: () => void;
}

const energyEmojis: Record<number, string> = {
  1: '😫',
  2: '🥱',
  3: '😐',
  4: '🙂',
  5: '🔥'
};

export default function TopBar({ onProfileClick }: TopBarProps) {
  const [user] = useAuthState(auth);
  const [hasClicked, setHasClicked] = useState(false);
  const { checkin } = useTodayCheckin();

  const getFirstName = () => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0];
    }
    return 'Curador';
  };

  const getGreeting = () => {
    const name = getFirstName();
    if (checkin && checkin.energyLevel) {
      if (checkin.energyLevel <= 2) return `Vai com calma hoje, ${name}`;
      if (checkin.energyLevel === 3) return `Bom dia, ${name}!`;
      if (checkin.energyLevel >= 4) return `Bom dia, ${name}! Que energia! 🔥`;
    }
    return `Bom Dia, ${name}`;
  };

  return (
    <header className="bg-[#131313] flex justify-between items-center px-4 sm:px-6 py-4 safe-pt w-full sticky top-0 z-40 safe-pl safe-pr">
      <div className="flex items-center gap-3">
        <motion.button 
          onClick={() => {
            setHasClicked(true);
            onProfileClick();
          }}
          whileTap={{ scale: 0.95 }}
          className="relative min-touch rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary-container/20 group"
          style={{ width: '44px', height: '44px' }}
        >
          {/* Pulsing indicator */}
          {!hasClicked && (
            <motion.div 
              animate={{ opacity: [0, 0.6, 0], scale: [1, 1.2, 1.4] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute inset-0 rounded-full border-2 border-[#00FF88] pointer-events-none"
            />
          )}
          <img 
            alt="Perfil do Usuário" 
            className="absolute inset-0 w-full h-full object-cover" 
            src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuDegf1Z8KKAXK7YnelFyYDTZqL0h7VfoiT8hbkNODnBy5B9mYSuhf3OazYwDsCEKuKjW3EM2qjxO51vXJM5LPbgWjRnSps16HLdqlzicryXFfFML1IWO7vtdSBWMOgC1ZpZrLQqccDqo2N-Wu-clz9EvZNJRn9MBxQZikJqPq0w5HwWl-l1vEOnn-_E_ff26mZRhdLvTZ3r7HetGKb9lDpggsoTz06R5sCxqQ7ll1lVBkeLr9JigHSGXRhbaMlegU6AwnZYzyTXOc4"}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-white/0 group-active:bg-white/10 transition-colors z-10" />
        </motion.button>
        <div className="flex items-center gap-2">
          <h1 className="font-['Inter'] font-bold tracking-tight text-lg sm:text-xl lg:text-2xl text-white">
            {getGreeting()}
          </h1>
          {checkin && checkin.energyLevel > 0 && (
            <div className="bg-[#2A2A2A] rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-sm border border-[#353534]">
              {energyEmojis[checkin.energyLevel] || '☀️'}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="min-touch rounded-full hover:bg-[#2A2A2A] transition-colors text-on-surface-variant active:scale-95 duration-200" title="Notificações">
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">notifications</span>
        </button>
      </div>
    </header>
  );
}
