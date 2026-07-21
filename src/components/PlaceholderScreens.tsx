import { FC } from 'react';

interface PlaceholderScreenProps {
  title: string;
  onBack: () => void;
}

export const PlaceholderScreen: FC<PlaceholderScreenProps> = ({ title, onBack }) => {
  return (
    <div className="min-h-screen bg-[#131313] flex flex-col w-full z-50 absolute inset-0">
      <header className="flex items-center px-4 py-4 border-b border-white/5">
        <button 
          onClick={onBack}
          className="p-2 mr-2 rounded-full hover:bg-white/5 active:bg-white/10 transition-colors text-[#00FF88]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-white font-bold text-lg font-headline flex-1 text-center pr-12">{title}</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#1C1B1B]">
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-[#B9CBB9]">construction</span>
        </div>
        <h2 className="text-white font-bold text-xl mb-2">Em breve</h2>
        <p className="text-[#B9CBB9] text-sm">
          A tela de {title} está em desenvolvimento e estará disponível na próxima atualização.
        </p>
      </div>
    </div>
  );
};
