import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';

export default function PWAUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registrado:', r);
    },
    onRegisterError(error) {
      console.error('Erro ao registrar SW:', error);
    },
  });

  const handleClose = () => {
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-4 left-4 right-4 z-[400] max-w-sm mx-auto bg-[#2A2A2A] border-l-3 border-[#00FF88] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 flex items-center justify-between gap-3 border border-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00FF88]/10 flex items-center justify-center shrink-0 text-[#00FF88]">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Nova versão disponível!</p>
              <button
                onClick={() => updateServiceWorker(true)}
                className="text-[#00FF88] text-xs font-semibold hover:underline mt-0.5 text-left bg-transparent border-0 cursor-pointer p-0 block"
              >
                Atualizar agora ✦
              </button>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/5 rounded-full text-[#B9CBB9] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
