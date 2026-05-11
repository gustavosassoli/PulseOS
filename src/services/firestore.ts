import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  serverTimestamp,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { AgendaItem, Transaction, Meal, WorkoutSession, WorkoutDay, Badge, UserProfile } from '../types';

// User Profile
export async function ensureUserProfile(user: any) {
  const userRef = doc(db, 'users', user.uid);
  try {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function updateUserProfile(updates: any) {
  if (!auth.currentUser) return;
  const userRef = doc(db, 'users', auth.currentUser.uid);
  try {
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
  }
}

export function subscribeToUserProfile(callback: (data: any) => void) {
  if (!auth.currentUser) return () => {};
  const userRef = doc(db, 'users', auth.currentUser.uid);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser.uid}`);
  });
}

// Agenda
export function subscribeToAgenda(callback: (items: AgendaItem[]) => void, date?: string) {
  if (!auth.currentUser) return () => {};
  
  const filterDate = date || new Date().toISOString().split('T')[0];
  const path = `users/${auth.currentUser.uid}/agenda`;
  const q = query(
    collection(db, path), 
    where('date', '==', filterDate),
    orderBy('time', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgendaItem));
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export function subscribeToAgendaHistory(callback: (items: AgendaItem[]) => void, days: number = 30) {
  if (!auth.currentUser) return () => {};
  
  const path = `users/${auth.currentUser.uid}/agenda`;
  const q = query(
    collection(db, path),
    orderBy('date', 'desc'),
    orderBy('time', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgendaItem));
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function addAgendaItem(item: Omit<AgendaItem, 'id'>) {
  if (!auth.currentUser) return;
  const today = new Date().toISOString().split('T')[0];
  const path = `users/${auth.currentUser.uid}/agenda`;
  try {
    await addDoc(collection(db, path), {
      ...item,
      date: item.date || today,
      uid: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleAgendaItem(itemId: string, completed: boolean) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}/agenda/${itemId}`;
  try {
    await updateDoc(doc(db, path), { completed });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateAgendaItem(itemId: string, updates: Partial<Omit<AgendaItem, 'id'>>) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}/agenda/${itemId}`;
  try {
    await updateDoc(doc(db, path), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAgendaItem(itemId: string) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}/agenda/${itemId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Finances
export function subscribeToTransactions(callback: (items: Transaction[]) => void) {
  if (!auth.currentUser) return () => {};
  
  const path = `users/${auth.currentUser.uid}/transactions`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>) {
  if (!auth.currentUser) return;
  const today = new Date().toISOString().split('T')[0];
  const path = `users/${auth.currentUser.uid}/transactions`;
  try {
    await addDoc(collection(db, path), {
      ...transaction,
      date: transaction.date || today,
      uid: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteTransaction(transactionId: string) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}/transactions/${transactionId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Meals
export function subscribeToMeals(callback: (items: Meal[]) => void, date?: string) {
  if (!auth.currentUser) return () => {};
  
  const filterDate = date || new Date().toISOString().split('T')[0];
  const path = `users/${auth.currentUser.uid}/meals`;
  const q = query(
    collection(db, path), 
    where('date', '==', filterDate),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meal));
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export function subscribeToMealsHistory(callback: (items: Meal[]) => void, days: number = 30) {
  if (!auth.currentUser) return () => {};
  
  const path = `users/${auth.currentUser.uid}/meals`;
  const q = query(
    collection(db, path),
    orderBy('date', 'desc'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meal));
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function addMeal(meal: Omit<Meal, 'id'>) {
  if (!auth.currentUser) return;
  const today = new Date().toISOString().split('T')[0];
  const path = `users/${auth.currentUser.uid}/meals`;
  try {
    await addDoc(collection(db, path), {
      ...meal,
      date: meal.date || today,
      uid: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateMeal(mealId: string, updates: Partial<Meal>) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}/meals/${mealId}`;
  try {
    await updateDoc(doc(db, path), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMeal(mealId: string) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}/meals/${mealId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Workouts
export function subscribeToWorkoutSessions(callback: (items: WorkoutSession[]) => void) {
  if (!auth.currentUser) return () => {};
  
  const path = `users/${auth.currentUser.uid}/workoutSessions`;
  const q = query(collection(db, path), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutSession));
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function addWorkoutSession(session: Omit<WorkoutSession, 'id'>) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}/workoutSessions`;
  try {
    await addDoc(collection(db, path), {
      ...session,
      uid: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateWorkoutSession(sessionId: string, updates: Partial<WorkoutSession>) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}/workoutSessions/${sessionId}`;
  try {
    await updateDoc(doc(db, path), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function awardBadge(badge: Omit<Badge, 'earnedAt'>) {
  if (!auth.currentUser) return;
  const userRef = doc(db, 'users', auth.currentUser.uid);
  try {
    const userDoc = await getDocFromServer(userRef);
    if (!userDoc.exists()) return;
    
    const userData = userDoc.data() as UserProfile;
    const currentBadges = userData.badges || [];
    
    if (currentBadges.some(b => b.id === badge.id)) return; // Already earned
    
    const newBadge: Badge = {
      ...badge,
      earnedAt: new Date().toISOString()
    };
    
    await updateDoc(userRef, {
      badges: [...currentBadges, newBadge]
    });
    
    return newBadge;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
  }
}
