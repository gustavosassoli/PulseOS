import { useState, useEffect } from 'react';
import { useStreakStore } from '../../stores/useStreakStore';
import StreakMilestoneModal from './StreakMilestoneModal';
import StreakRiskToast from './StreakRiskToast';
import { PillarType } from '../../types';

export default function GlobalStreakOverlay({ onNavigate }: { onNavigate?: (pillar: PillarType) => void }) {
  const { milestones, popMilestone, riskPillars } = useStreakStore();
  const [currentMilestone, setCurrentMilestone] = useState<{ pillar: any, days: number } | null>(null);

  useEffect(() => {
    if (!currentMilestone && milestones.length > 0) {
      setCurrentMilestone(popMilestone());
    }
  }, [milestones, currentMilestone, popMilestone]);

  const handleCloseMilestone = () => {
    setCurrentMilestone(null);
  };

  const currentRisk = riskPillars.length > 0 ? riskPillars[0] : null;

  return (
    <>
      {currentMilestone && (
        <StreakMilestoneModal
          pillar={currentMilestone.pillar}
          days={currentMilestone.days}
          message="Incrível! Você desbloqueou uma sequência poderosa."
          onClose={handleCloseMilestone}
        />
      )}
      
      {currentRisk && (
        <StreakRiskToast
          pillar={currentRisk.pillar}
          days={currentRisk.days}
          onNavigate={() => {
             if (onNavigate) onNavigate(currentRisk.pillar);
             useStreakStore.getState().removeRisk(currentRisk.pillar);
          }}
          onClose={() => {
            useStreakStore.getState().removeRisk(currentRisk.pillar);
          }}
        />
      )}
    </>
  );
}
