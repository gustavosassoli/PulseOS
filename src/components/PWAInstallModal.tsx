import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Plus, Check, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PWAInstallModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop Blur overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-[#1C1B1B] w-full max-w-[340px] rounded-2xl border border-white/5 shadow-2xl relative z-10 p-6 flex flex-col"
          >
            {/* Header & Close */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold text-lg leading-tight font-sans">Instale o PulseOS</h3>
                <p className="text-xs text-[#B9CBB9] mt-1">Acesse direto da sua tela de início</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-[#B9CBB9] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-4 my-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2A2A2A] flex items-center justify-center shrink-0 border border-white/5 text-[#00FF88]">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-[13px]">1. Toque no ícone Compartilhar</p>
                  <p className="text-[11px] text-[#B9CBB9] mt-0.5">Disponível na barra inferior do Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2A2A2A] flex items-center justify-center shrink-0 border border-white/5 text-[#00FF88]">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-[13px]">2. Adicionar à Tela de Início</p>
                  <p className="text-[11px] text-[#B9CBB9] mt-0.5">Role o menu para baixo e selecione.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2A2A2A] flex items-center justify-center shrink-0 border border-white/5 text-[#00FF88]">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-[13px]">3. Toque em "Adicionar"</p>
                  <p className="text-[11px] text-[#B9CBB9] mt-0.5">Confirmar no canto superior direito.</p>
                </div>
              </div>
            </div>

            {/* Call to action Button */}
            <button
              onClick={() => {
                onClose();
                localStorage.setItem('pwa_ios_modal_shown', 'true');
              }}
              className="mt-4 w-full py-3 bg-gradient-to-r from-[#00E479] to-[#00FF88] text-[#003919] rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-[#00FF88]/10 hover:brightness-110 active:scale-98 transition-all"
            >
              Entendido ✦
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
