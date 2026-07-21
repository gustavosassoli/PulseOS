import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PWAInstallModal from './PWAInstallModal';

export default function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // 1. Detect environment
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true;

    // If already installed/in standalone, do nothing
    if (isInStandaloneMode) return;

    // Check if dismissed before
    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    if (dismissed) return;

    // 2. iOS Manual Flow
    if (isIOS && isMobile) {
      const timer = setTimeout(() => {
        const iosShown = localStorage.getItem('pwa_ios_modal_shown');
        if (!iosShown) {
          setShowIosModal(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 3. Android / standard PWA flow
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);

      // Delay showing the banner by 3 seconds for better UX
      const timer = setTimeout(() => {
        if (isMobile) {
          setShowBanner(true);
        }
      }, 3000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      localStorage.setItem('pwa_installed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-[88px] left-4 right-4 z-[250] max-w-md mx-auto bg-[#1C1B1B] border-t border-[#3B4B3D] rounded-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.4)] p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-4">
              {/* App Icon */}
              <img 
                src="/apple-touch-icon.png" 
                alt="PulseOS Icon" 
                className="w-12 h-12 rounded-xl object-cover shrink-0 bg-[#131313] border border-white/5"
              />
              
              {/* Text content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-[15px] font-sans leading-snug">Instalar PulseOS</h4>
                <p className="text-[#B9CBB9] text-[13px] font-medium leading-relaxed mt-0.5">
                  Acesse mais rápido, como um app nativo.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 mt-1">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-xs font-semibold text-[#B9CBB9] hover:text-white transition-colors"
              >
                Agora não
              </button>
              <button
                onClick={handleInstall}
                className="px-5 py-2.5 bg-gradient-to-r from-[#00E479] to-[#00FF88] text-[#003919] rounded-xl font-bold text-[13px] tracking-wide shadow-md shadow-[#00FF88]/10 hover:brightness-110 active:scale-95 transition-all"
              >
                Instalar ✦
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PWAInstallModal 
        isOpen={showIosModal} 
        onClose={() => {
          setShowIosModal(false);
          localStorage.setItem('pwa_ios_modal_shown', 'true');
        }} 
      />
    </>
  );
}
