import { motion } from "motion/react";
import { Check } from "lucide-react";

interface Props {
  pointsEarned: number;
  newStreak: number;
}

export default function CheckinSuccess({ pointsEarned, newStreak }: Props) {
  return (
    <div className="absolute inset-0 z-50 bg-[#1C1B1B] rounded-t-[24px] flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#00E479] to-[#00FF88] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.3)] mb-6"
      >
        <Check className="w-8 h-8 text-[#003919] stroke-[3]" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-white font-black text-2xl tracking-tight mb-2"
      >
        Check-in feito!
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-1"
      >
        <p className="text-[#00FF88] font-bold text-lg">
          +{pointsEarned} pts no Life Score
        </p>
        <div className="flex items-center gap-1.5 text-[#FF9F43] font-bold text-sm bg-[#FF9F43]/10 px-3 py-1 rounded-full mt-1">
          <span>🔥</span>
          <span>{newStreak} dias seguidos</span>
        </div>
      </motion.div>
    </div>
  );
}
