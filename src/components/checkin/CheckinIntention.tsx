import { useState } from "react";

interface Props {
  intention: string;
  onChange: (val: string) => void;
}

export default function CheckinIntention({ intention, onChange }: Props) {
  const suggestions = [
    "🎯 Foco total",
    "💪 Dar o meu melhor",
    "🧘 Equilíbrio",
    "🚀 Superar limites",
    "✨ Ser grato",
    "🔥 Manter a disciplina",
  ];

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          value={intention}
          onChange={(e) => {
            if (e.target.value.length <= 80) {
              onChange(e.target.value);
            }
          }}
          placeholder="Ex: Hoje vou focar no que realmente importa"
          className="w-full bg-[#2A2A2A] border border-[#3B4B3D] focus:border-[#00FF88] rounded-xl py-3 px-4 pb-7 text-white outline-none transition-colors font-medium text-[15px]"
        />
        <span className="absolute bottom-2 right-3 text-[#B9CBB9] text-[10px] font-mono">
          {intention.length}/80
        </span>
      </div>

      {/* Sugestões */}
      <div className="flex overflow-x-auto gap-2 mt-3 pb-2 no-scrollbar px-1">
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => onChange(sug)}
            className="whitespace-nowrap px-3 py-1.5 bg-[#2A2A2A] text-[#B9CBB9] text-[12px] font-medium rounded-full hover:bg-[#353534] transition-colors border border-transparent hover:border-[#3B4B3D]"
          >
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
}
