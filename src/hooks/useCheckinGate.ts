import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { format } from 'date-fns';
import { UserProfile } from '../types';

export function useCheckinGate(userProfile: UserProfile | null) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function check() {
      if (!userProfile || !auth.currentUser) {
        if (isMounted) {
          setShouldShow(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Calcular janela de exibição
        // wakeUpTime vem do UserProfile (ex: "06:30")
        const wakeTimeStr = userProfile.wakeUpTime || "06:00";
        const [wakeHour, wakeMinute] = wakeTimeStr.split(':').map(Number);

        const wakeInMinutes = wakeHour * 60 + wakeMinute;
        const nowInMinutes = currentHour * 60 + currentMinute;
        const windowEnd = wakeInMinutes + 180; // + 3 horas

        // Check if the current time crosses midnight logic?
        // Since it's a morning checkin, wakeInMinutes + 180 is likely within the same day.
        const isInWindow = nowInMinutes >= wakeInMinutes && nowInMinutes <= windowEnd;

        if (!isInWindow) {
          if (isMounted) {
            setShouldShow(false);
            setIsLoading(false);
          }
          return;
        }

        // Verificar se já fez checkin hoje
        const checkinRef = doc(db, `users/${auth.currentUser.uid}/checkins/${today}`);
        const checkinSnap = await getDoc(checkinRef);
        const alreadyDone = checkinSnap.exists();

        if (isMounted) {
          setShouldShow(!alreadyDone);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error checking checkin gate:", error);
        // Fail silent
        if (isMounted) {
          setShouldShow(false);
          setIsLoading(false);
        }
      }
    }

    check();

    return () => {
      isMounted = false;
    };
  }, [userProfile]);

  return { shouldShow, isLoading, setShouldShow };
}
