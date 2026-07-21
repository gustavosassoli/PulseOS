import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getDay, parseISO, format } from 'date-fns';
import { db } from '../firebase';
import { RecurringTemplate, AgendaItem } from '../types';

export function templateAppliesToDate(template: RecurringTemplate, date: string): boolean {
  if (!template.active) return false;
  
  // Date must be yyyy-MM-dd
  const dateObj = parseISO(date);
  // Using UTC so that we don't have timezone offset issues causing wrong day?
  // Actually getDay uses local time, but parseISO('yyyy-MM-dd') assumes midnight local time, which is correct for checking local day of week.
  
  // To avoid parseISO timezone shift, let's create a date safely
  const [y, m, d] = date.split('-').map(Number);
  const localDate = new Date(y, m - 1, d);
  
  const day = localDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  switch (template.recurrence.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return day >= 1 && day <= 5;
    case 'weekends':
      return day === 0 || day === 6;
    case 'weekly':
      return template.recurrence.days?.includes(day) ?? false;
    default:
      return false;
  }
}

export async function generateInstance(userId: string, template: RecurringTemplate, dateStr: string): Promise<void> {
  const path = `users/${userId}/agenda`;
  
  const newItem: Omit<AgendaItem, 'id'> = {
    title: template.title,
    time: template.time,
    category: template.category,
    categoryColor: template.category === 'Trabalho' ? '#00FF88' : template.category === 'Saúde' ? '#00E479' : '#00C366',
    date: dateStr,
    duration: '1h',
    location: '',
    completed: false,
    icon: template.icon,
    fromTemplate: true,
    templateId: template.id
  };

  await addDoc(collection(db, path), {
    ...newItem,
    uid: userId,
    createdAt: serverTimestamp()
  });
}

export async function generateTodayInstances(userId: string): Promise<number> {
  const todayDateObj = new Date();
  const today = format(todayDateObj, 'yyyy-MM-dd');

  const templatesQuery = query(
    collection(db, `users/${userId}/recurringTemplates`),
    where('active', '==', true)
  );
  
  const templatesSnap = await getDocs(templatesQuery);

  const todayItemsQuery = query(
    collection(db, `users/${userId}/agenda`),
    where('date', '==', today),
    where('fromTemplate', '==', true)
  );
  
  const todayItemsSnap = await getDocs(todayItemsQuery);
  const existingTemplateIds = todayItemsSnap.docs.map(d => d.data().templateId);

  let created = 0;

  for (const templateDoc of templatesSnap.docs) {
    const template = { id: templateDoc.id, ...templateDoc.data() } as RecurringTemplate;

    // Skip if already generated today
    if (existingTemplateIds.includes(template.id)) continue;

    if (!templateAppliesToDate(template, today)) continue;

    await generateInstance(userId, template, today);

    // Update lastGeneratedDate on template
    await updateDoc(templateDoc.ref, {
      lastGeneratedDate: today,
      updatedAt: serverTimestamp()
    });

    created++;
  }

  return created;
}

export async function createRecurringTemplate(userId: string, templateArg: Omit<RecurringTemplate, 'id' | 'createdAt' | 'updatedAt' | 'lastGeneratedDate'>) {
  const path = `users/${userId}/recurringTemplates`;
  const docRef = await addDoc(collection(db, path), {
    ...templateArg,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastGeneratedDate: ''
  });
  
  return docRef.id;
}

export async function toggleTemplateStatus(userId: string, templateId: string, currentStatus: boolean) {
  const ref = doc(db, `users/${userId}/recurringTemplates/${templateId}`);
  await updateDoc(ref, {
    active: !currentStatus,
    updatedAt: serverTimestamp()
  });
}

export async function updateTemplate(userId: string, templateId: string, updates: Partial<RecurringTemplate>) {
  const ref = doc(db, `users/${userId}/recurringTemplates/${templateId}`);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteTemplate(userId: string, templateId: string) {
  const ref = doc(db, `users/${userId}/recurringTemplates/${templateId}`);
  await deleteDoc(ref);
}
