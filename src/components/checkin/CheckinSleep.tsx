import { motion } from "motion/react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  sleepHours: number;
  sleepQuality: number;
  onChangeHours: (val: number) => void;
  onChangeQuality: (val: number) => void;
}

export default function CheckinSleep({
  sleepHours,
  sleepQuality,
  onChangeHours,
  onChangeQuality,
}: Props) {
  const handleDecHours = () => {
    if (sleepHours > 3) onChangeHours(sleepHours - 0.5);
  };

  const handleIncHours = () => {
    if (sleepHours < 12) onChangeHours(sleepHours + 0.5);
  };

  return (
    <div className="flex gap-4 w-full">
      {/* Horas Dormidas */}
      <div className="flex-1 bg-[#2A2A2A] rounded-xl p-4 flex flex-col items-center justify-center relative">
        <span className="text-[#B9CBB9] text-[11px] font-bold uppercase tracking-widest absolute top-3">
          Horas
        </span>

        <div className="flex items-center justify-between w-full mt-5">
          <button
            onClick={handleDecHours}
            className="w-8 h-8 flex items-center justify-center text-[#00FF88] hover:bg-white/5 rounded-full transition-colors active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-white font-sans font-black text-2xl tracking-tighter">
            {sleepHours}h
          </span>

          <button
            onClick={handleIncHours}
            className="w-8 h-8 flex items-center justify-center text-[#00FF88] hover:bg-white/5 rounded-full transition-colors active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Qualidade do sono */}
      <div className="flex-1 bg-[#2A2A2A] rounded-xl p-4 flex flex-col items-center justify-center relative">
        <span className="text-[#B9CBB9] text-[11px] font-bold uppercase tracking-widest absolute top-3">
          Qualidade
        </span>

        <div className="flex items-center gap-1 mt-5">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileTap={{ scale: 0.8 }}
              onClick={() => onChangeQuality(star)}
              className="focus:outline-none p-0.5"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  star <= sleepQuality
                    ? "fill-[#FFD166] text-[#FFD166]"
                    : "fill-transparent text-[#353534]"
                }`}
              />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
