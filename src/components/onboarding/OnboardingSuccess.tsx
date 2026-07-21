import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface Props {
  onStart: () => void;
}

export default function OnboardingSuccess({ onStart }: Props) {
  // Simple checkmark path animation variants
  const checkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        delay: 0.4, 
        duration: 0.6, 
        ease: "easeInOut" 
      } 
    }
  };

  const containerVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 200, 
        damping: 15,
        delay: 0.1
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#131313] z-[500] flex flex-col items-center justify-center p-6 select-none">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.06)_0%,transparent_60%)] pointer-events-none" />

      {/* Checkmark Circle with spring entrance */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-24 h-24 bg-gradient-to-tr from-[#00E479]/20 to-[#00FF88]/20 border border-[#00FF88]/30 rounded-full flex items-center justify-center mb-8 relative"
      >
        {/* Multi-layered rings */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 border border-[#00FF88]/10 rounded-full scale-110"
        />
        
        {/* Check Icon with draw animation */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
          className="bg-gradient-to-tr from-[#00E479] to-[#00FF88] w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-[#00FF88]/25"
        >
          <Check className="w-8 h-8 text-[#003919] stroke-[3]" />
        </motion.div>
      </motion.div>

      {/* Text Group */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-center mb-10 max-w-sm"
      >
        <h2 className="text-3xl font-black text-white font-sans tracking-tight mb-3">
          Perfil criado com sucesso!
        </h2>
        <p className="text-[#B9CBB9] text-[15px] font-medium leading-relaxed">
          Tudo pronto pra você dominar os seus objetivos com precisão.
        </p>
      </motion.div>

      {/* Button CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
        className="w-full max-w-sm"
      >
        <button
          onClick={onStart}
          className="w-full py-4 bg-gradient-to-r from-[#00E479] to-[#00FF88] text-[#131313] font-black tracking-widest uppercase text-[12px] rounded-2xl shadow-[0_12px_30px_rgba(0,255,136,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10"
        >
          Acessar o PulseOS
        </button>
      </motion.div>
    </div>
  );
}
