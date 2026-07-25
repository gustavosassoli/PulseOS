import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { HydrationSettings } from '../types';

export const DEFAULT_HYDRATION_SETTINGS: HydrationSettings = {
  enabled: true,
  mode: 'fixed',
  dailyGoalMl: 2500,
  containerVolumeMl: 250,
  fixedTimes: ['08:00', '10:30', '13:00', '15:30', '18:00', '20:30'],
  intervalHours: 2,
  intervalStart: '08:00',
  intervalEnd: '20:00',
  customMessage: 'Hora de se hidratar! 💧 Beba {volume}ml de água para bater sua meta diária.',
};

export function subscribeToHydrationSettings(
  userId: string,
  callback: (settings: HydrationSettings) => void
) {
  if (!userId) return () => {};
  const docRef = doc(db, `users/${userId}/settings/hydration`);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          ...DEFAULT_HYDRATION_SETTINGS,
          ...data,
        });
      } else {
        callback(DEFAULT_HYDRATION_SETTINGS);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/settings/hydration`);
    }
  );
}

export async function saveHydrationSettings(
  userId: string,
  settings: HydrationSettings
): Promise<void> {
  if (!userId) return;
  const docRef = doc(db, `users/${userId}/settings/hydration`);
  try {
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/settings/hydration`);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendTestNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });
  }
}
