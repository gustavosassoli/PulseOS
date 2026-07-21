import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { format } from 'date-fns';
import { DailyCheckin } from '../types';

export function useTodayCheckin() {
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!auth.currentUser) return;
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const checkinRef = doc(db, `users/${auth.currentUser.uid}/checkins/${today}`);
      
      try {
        const checkinSnap = await getDoc(checkinRef);
        if (checkinSnap.exists()) {
          const data = checkinSnap.data() as DailyCheckin;
          if (!data.skipped) {
            if (isMounted) setCheckin(data);
          }
        }
      } catch (e) {
        console.error("Error loading today checkin", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    
    return () => { isMounted = false; };
  }, []);

  return { checkin, loading };
}
