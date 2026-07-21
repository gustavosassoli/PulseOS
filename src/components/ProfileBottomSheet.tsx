import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, logout } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { subscribeToUserProfile } from '../services/firestore';

interface ProfileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export default function ProfileBottomSheet({ isOpen, onClose, onNavigate }: ProfileBottomSheetProps) {
  const [user] = useAuthState(auth);
  // Optional: Allow the sheet to be expanded manually. By default, it opens at 65%.
  const [isExpanded, setIsExpanded] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    const unsub = subscribeToUserProfile((data) => {
      if (data?.workoutXUsage) {
         if (data.workoutXUsage.month === new Date().toISOString().slice(0, 7)) {
            setUsageCount(data.workoutXUsage.count || 0);
         } else {
            setUsageCount(0);
         }
      }
    });
    return () => unsub();
  }, []);

  const usagePercent = Math.min((usageCount / 500) * 100, 100);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsExpanded(false);
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    onClose();
    onNavigate(path);
  };

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.y > 100) {
      onClose();
    } else if (info.offset.y < -50) {
      setIsExpanded(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isExpanded ? '8%' : '35%' }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 20, stiffness: 150 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 w-full bg-[#1C1B1B] rounded-t-[24px] z-[101] flex flex-col h-full shadow-[0_-20px_40px_rgba(0,0,0,0.5)] border-t border-white/5"
            style={{ touchAction: 'none' }}
          >
            {/* Handle Bar */}
            <div className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-[#353534] rounded-full" />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-20 safe-pb no-scrollbar">
              {/* Header */}
              <div className="flex flex-col items-center mt-2 mb-8">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-[#00E479] to-[#00FF88]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-surface-container">
                      <img 
                        src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuDegf1Z8KKAXK7YnelFyYDTZqL0h7VfoiT8hbkNODnBy5B9mYSuhf3OazYwDsCEKuKjW3EM2qjxO51vXJM5LPbgWjRnSps16HLdqlzicryXFfFML1IWO7vtdSBWMOgC1ZpZrLQqccDqo2N-Wu-clz9EvZNJRn9MBxQZikJqPq0w5HwWl-l1vEOnn-_E_ff26mZRhdLvTZ3r7HetGKb9lDpggsoTz06R5sCxqQ7ll1lVBkeLr9JigHSGXRhbaMlegU6AwnZYzyTXOc4"} 
                        alt="Profile" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="bg-gradient-to-r from-[#00E479] to-[#00FF88] text-[#003919] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      PRO
                    </span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white font-headline tracking-tight">{user?.displayName || "Curador Pulse"}</h2>
                <p className="text-[#B9CBB9] text-[13px] font-medium mt-0.5">{user?.email || "curador@pulse.os"}</p>
              </div>

              {/* Account Section */}
              <div className="mb-8">
                <span className="text-[10px] font-bold text-[#B9CBB9] uppercase tracking-widest block mb-3 px-2">Conta</span>
                <div className="bg-[#131313]/50 rounded-2xl overflow-hidden border border-white/5">
                  <MenuItem 
                    icon="account_circle" 
                    iconColor="text-[#00FF88]"
                    label="Conta" 
                    subtext="Detalhes pessoais" 
                    onClick={() => handleNavigate('account')} 
                  />
                  <MenuDivider />
                  <MenuItem 
                    icon="notifications" 
                    iconColor="text-[#FFD166]"
                    label="Notificações" 
                    subtext="Push e lembretes" 
                    onClick={() => handleNavigate('notifications')} 
                  />
                  <MenuDivider />
                  <MenuItem 
                    icon="lock" 
                    iconColor="text-[#00FF88]"
                    label="Privacidade" 
                    subtext="Segurança e dados" 
                    onClick={() => handleNavigate('privacy')} 
                  />
                  <MenuDivider />
                  <MenuItem 
                    icon="database" 
                    iconColor="text-[#B1B2FF]"
                    label="Exportar Dados" 
                    actionIcon="download"
                    onClick={() => handleNavigate('export')} 
                  />
                </div>
              </div>

              {/* API Integration Section */}
              <div className="mb-8">
                <span className="text-[10px] font-bold text-[#B9CBB9] uppercase tracking-widest block mb-3 px-2">Integrações</span>
                <div className="bg-[#131313]/50 rounded-2xl overflow-hidden border border-white/5 p-4">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-white text-sm font-bold">WorkoutX API</span>
                     <span className="text-[#B9CBB9] text-xs"><span className="text-white font-bold">{usageCount}</span>/500 requisições este mês</span>
                   </div>
                   <div className="h-2 w-full bg-[#353534] rounded-full overflow-hidden">
                     <div 
                       className="h-full transition-all duration-500"
                       style={{ 
                         width: `${usagePercent}%`, 
                         backgroundColor: usagePercent > 85 ? '#FF4D4D' : usagePercent > 60 ? '#FFD166' : '#00FF88'
                       }}
                     />
                   </div>
                </div>
              </div>

              {/* Plan Section */}
              <div className="mb-8">
                <span className="text-[10px] font-bold text-[#B9CBB9] uppercase tracking-widest block mb-3 px-2">Assinatura</span>
                <div className="bg-[#2A2A2A] rounded-xl p-4 flex flex-col items-center justify-center text-center border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF88]/10 blur-3xl rounded-full" />
                  <div className="relative z-10 w-full">
                    <h3 className="text-white font-bold text-lg">Curator Pro · Anual</h3>
                    <p className="text-[#B9CBB9] text-sm mt-1 mb-4">Próxima cobrança: 12 out 2025</p>
                    <button 
                      onClick={() => handleNavigate('plan')}
                      className="w-full py-3 bg-gradient-to-r from-[#00E479] to-[#00FF88] text-[#003919] font-bold rounded-xl active:scale-[0.98] transition-transform"
                    >
                      Gerenciar Plano
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center mt-6 gap-6">
                <button 
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="w-full py-3.5 bg-transparent border border-[#FF4D4D]/20 text-[#FF4D4D] font-bold rounded-xl hover:bg-[#FF4D4D]/10 active:scale-[0.98] transition-all"
                >
                  Sair de todos os dispositivos
                </button>
                <span className="text-[10px] font-mono text-[#B9CBB9]/40 tracking-widest text-center">
                  Version 2.4.0 (Build 892)
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MenuItem({ icon, iconColor, label, subtext, actionIcon = "chevron_right", onClick }: { icon: string, iconColor: string, label: string, subtext?: string, actionIcon?: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center p-4 min-touch hover:bg-white/5 active:bg-white/10 transition-colors text-left"
    >
      <span className={`material-symbols-outlined text-[24px] ${iconColor} mr-4`}>{icon}</span>
      <div className="flex-1">
        <span className="block text-white font-bold text-[15px]">{label}</span>
        {subtext && <span className="block text-[#B9CBB9] text-[12px]">{subtext}</span>}
      </div>
      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{actionIcon}</span>
    </button>
  );
}

function MenuDivider() {
  return <div className="h-[1px] bg-[#3B4B3D] mx-4" />;
}
