import { motion } from 'motion/react';

interface Props {
  name: string;
  onChangeName: (value: string) => void;
}

export default function OnboardingStep1({ name, onChangeName }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-2 text-center h-full">
      {/* Animating Logo */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-20 h-20 bg-gradient-to-tr from-[#00E479] to-[#00FF88] rounded-2xl flex items-center justify-center shadow-xl shadow-[#00FF88]/15 mb-8"
      >
        <span className="material-symbols-outlined text-[44px] text-[#003919] font-black">monitoring</span>
      </motion.div>

      {/* Texts */}
      <h1 className="text-3xl font-black text-white font-sans tracking-tight mb-3">
        Olá! Eu sou o PulseOS.
      </h1>
      <p className="text-[#B9CBB9] text-[15px] font-medium max-w-sm mb-10 leading-relaxed">
        Seu sistema operacional pessoal. Vamos configurar tudo em menos de 2 minutos.
      </p>

      {/* Input Field */}
      <div className="w-full max-w-sm text-left">
        <label className="block text-xs font-bold text-[#B9CBB9] uppercase tracking-widest mb-3 ml-1">
          Como posso te chamar?
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Seu nome ou apelido"
          className="w-full bg-[#1C1B1B] border border-[#3B4B3D] focus:border-[#00FF88] rounded-xl py-4 px-5 text-white placeholder:text-[#B9CBB9]/40 outline-none transition-colors font-medium text-base h-[54px]"
          autoFocus
        />
      </div>
    </div>
  );
}
