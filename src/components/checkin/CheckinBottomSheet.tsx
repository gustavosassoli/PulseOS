import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame } from "lucide-react";
import CheckinEnergy from "./CheckinEnergy";
import CheckinSleep from "./CheckinSleep";
import CheckinIntention from "./CheckinIntention";
import CheckinSuccess from "./CheckinSuccess";

import { submitMorningCheckin } from "../../services/checkinService";
import { auth } from "../../firebase";
import { UserProfile } from "../../types";

interface Props {
  userProfile: UserProfile;
  onComplete: () => void;
  onSkip: () => void;
}

export default function CheckinBottomSheet({
  userProfile,
  onComplete,
  onSkip,
}: Props) {
  const [energyLevel, setEnergyLevel] = useState(0);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(0);
  const [intention, setIntention] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState({
    pointsEarned: 0,
    newStreak: 0,
  });

  const canSubmit = energyLevel > 0 && sleepQuality > 0;
  const currentStreak = userProfile.currentStreak || 0;

  const handleSubmit = async () => {
    if (!canSubmit || !auth.currentUser) return;
    setIsSubmitting(true);

    try {
      const data = await submitMorningCheckin(
        auth.currentUser.uid,
        {
          energyLevel,
          sleepHours,
          sleepQuality,
          intention,
        },
        false,
        userProfile,
      );

      setSuccessData(data);
      setShowSuccess(true);

      // Auto close after 1.5s
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      onSkip(); // fallback on error
    }
  };

  const handleSkip = async () => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    try {
      await submitMorningCheckin(
        auth.currentUser.uid,
        {
          energyLevel: 0,
          sleepHours: 0,
          sleepQuality: 0,
          intention: "",
        },
        true,
        userProfile,
      );
      onSkip();
    } catch (err) {
      onSkip();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end">
      {/* Overlay Escuro */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full h-[85vh] bg-[#1C1B1B] rounded-t-[24px] flex flex-col shadow-2xl safe-pb"
      >
        <AnimatePresence>
          {showSuccess && (
            <CheckinSuccess
              pointsEarned={successData.pointsEarned}
              newStreak={successData.newStreak}
            />
          )}
        </AnimatePresence>

        {/* Handle bar */}
        <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-[#353534] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex justify-between items-start px-6 pt-4 pb-2 shrink-0">
          <div className="flex flex-col gap-1">
            <h2 className="text-white text-[22px] font-black font-sans tracking-tight">
              Bom dia, {userProfile.displayName ? userProfile.displayName.split(" ")[0] : "Você"}! ☀️
            </h2>

            {currentStreak > 0 && (
              <div className="flex items-center gap-1.5 bg-[#FF9F43]/10 px-3 py-1 rounded-full self-start">
                <Flame className="w-3.5 h-3.5 text-[#FF9F43]" />
                <span className="text-[#FF9F43] text-[11px] font-bold">
                  {currentStreak} dias seguidos de check-in!
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-[#B9CBB9] text-[13px] font-medium hover:text-white transition-colors mt-1"
          >
            Pular
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8 no-scrollbar">
          {/* Pergunta 1: Energia */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <h3 className="text-white font-bold text-base">
                Como está sua energia agora?
              </h3>
              <p className="text-[#B9CBB9] text-[12px]">
                Seja honesto — isso ajuda a montar seu dia
              </p>
            </div>
            <CheckinEnergy energy={energyLevel} onChange={setEnergyLevel} />
          </div>

          {/* Pergunta 2: Sono */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-bold text-base">
              Como você dormiu?
            </h3>
            <CheckinSleep
              sleepHours={sleepHours}
              sleepQuality={sleepQuality}
              onChangeHours={setSleepHours}
              onChangeQuality={setSleepQuality}
            />
          </div>

          {/* Pergunta 3: Intenção */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex flex-col">
              <h3 className="text-white font-bold text-base">
                Qual é sua intenção para hoje?
              </h3>
              <p className="text-[#B9CBB9] text-[12px]">
                Uma frase curta para focar sua energia
              </p>
            </div>
            <CheckinIntention intention={intention} onChange={setIntention} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/5 shrink-0 bg-[#1C1B1B]">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`w-full flex items-center justify-center py-[16px] rounded-xl font-bold text-[16px] transition-all
              ${
                canSubmit
                  ? "bg-gradient-to-r from-[#00E479] to-[#00FF88] text-[#003919] shadow-[0_4px_20px_rgba(0,255,136,0.15)] active:scale-95"
                  : "bg-white/5 text-[#B9CBB9]/40 cursor-not-allowed"
              }
            `}
          >
            <span className="mb-0.5">Começar o dia ✦</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
