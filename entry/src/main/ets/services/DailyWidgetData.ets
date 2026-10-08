import { common } from '@kit.AbilityKit';
import { preferences } from '@kit.ArkData';
import { formBindingData, formProvider } from '@kit.FormKit';

interface WidgetMeal {
  id: string;
  name: string;
  time: string;
  calories: number;
  status: string;
}

interface WidgetSnapshot {
  date: string;
  dateLabel: string;
  calories: number;
  targetCalories: number;
  carbs: number;
  protein: number;
  fat: number;
  hasRecorded: boolean;
  meals: WidgetMeal[];
}

class WidgetFormData {
  dateLabel: string = todayLabel();
  calories: string = '0';
  targetCalories: string = '—';
  carbs: string = '0';
  protein: string = '0';
  fat: string = '0';
  status: string = '打开应用同步今日目标';
  meal1Id: string = ''; meal1Name: string = ''; meal1Status: string = '';
  meal2Id: string = ''; meal2Name: string = ''; meal2Status: string = '';
  meal3Id: string = ''; meal3Name: string = ''; meal3Status: string = '';
  meal4Id: string = ''; meal4Name: string = ''; meal4Status: string = '';
  meal5Id: string = ''; meal5Name: string = ''; meal5Status: string = '';
}

const STORE_NAME: string = 'daily_nutrition_widget';
const SNAPSHOT_KEY: string = 'snapshot';
const FORM_IDS_KEY: string = 'form_ids';

function store(context: common.Context): preferences.Preferences {
  return preferences.getPreferencesSync(context, { name: STORE_NAME });
}

function todayKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function todayLabel(): string {
  const today = new Date();
  return `${today.getMonth() + 1}月${today.getDate()}日`;
}

function safeNumber(value: number): string {
  return String(Math.max(0, Math.min(99999, Math.round(Number(value) || 0))));
}

function cleanText(value: string, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 24) : fallback;
}

export function widgetFormData(context: common.Context): WidgetFormData {
  const data = new WidgetFormData();
  try {
    const raw = store(context).getSync(SNAPSHOT_KEY, '') as string;
    if (!raw) return data;
    const snapshot = JSON.parse(raw) as WidgetSnapshot;
    if (snapshot.date !== todayKey()) return data;
    data.dateLabel = cleanText(snapshot.dateLabel, todayLabel());
    data.calories = safeNumber(snapshot.calories);
    data.targetCalories = safeNumber(snapshot.targetCalories);
    data.carbs = safeNumber(snapshot.carbs);
    data.protein = safeNumber(snapshot.protein);
    data.fat = safeNumber(snapshot.fat);
    data.status = snapshot.hasRecorded ? '已记录' : '待记录';
    const meals = Array.isArray(snapshot.meals) ? snapshot.meals.slice(0, 5) : [];
    meals.forEach((meal: WidgetMeal, index: number) => {
      const slot = String(index + 1);
      const id = cleanText(meal.id, '');
      const name = cleanText(meal.name, `第${slot}餐`);
      const status = meal.status === '已记录' ? `${safeNumber(meal.calories)} kcal` : meal.status === '待打卡' ? '待打卡' : '待记录';
      if (index === 0) { data.meal1Id = id; data.meal1Name = name; data.meal1Status = status; }
      if (index === 1) { data.meal2Id = id; data.meal2Name = name; data.meal2Status = status; }
      if (index === 2) { data.meal3Id = id; data.meal3Name = name; data.meal3Status = status; }
      if (index === 3) { data.meal4Id = id; data.meal4Name = name; data.meal4Status = status; }
      if (index === 4) { data.meal5Id = id; data.meal5Name = name; data.meal5Status = status; }
    });
  } catch (_) {
    return data;
  }
  return data;
}

export function saveWidgetSnapshot(context: common.Context, raw: string): boolean {
  if (typeof raw !== 'string' || raw.length > 12000) return false;
  try {
    const parsed = JSON.parse(raw) as WidgetSnapshot;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date) || !Array.isArray(parsed.meals)) return false;
    const current = store(context);
    if (current.getSync(SNAPSHOT_KEY, '') === raw) return false;
    current.putSync(SNAPSHOT_KEY, raw);
    current.flushSync();
    return true;
  } catch (_) {
    return false;
  }
}

export function widgetFormIds(context: common.Context): string[] {
  try {
    const value = JSON.parse(store(context).getSync(FORM_IDS_KEY, '[]') as string) as string[];
    return Array.isArray(value) ? value.filter(id => typeof id === 'string' && /^\d+$/.test(id)) : [];
  } catch (_) {
    return [];
  }
}

export function rememberWidgetForm(context: common.Context, formId: string): void {
  const ids = widgetFormIds(context);
  if (!/^\d+$/.test(formId) || ids.includes(formId)) return;
  try {
    const current = store(context);
    current.putSync(FORM_IDS_KEY, JSON.stringify([...ids, formId]));
    current.flushSync();
  } catch (_) {
    // The widget remains usable even when the form ID cannot be persisted.
  }
}

export function forgetWidgetForm(context: common.Context, formId: string): void {
  try {
    const current = store(context);
    current.putSync(FORM_IDS_KEY, JSON.stringify(widgetFormIds(context).filter(id => id !== formId)));
    current.flushSync();
  } catch (_) {
    // No user records are changed if preferences are temporarily unavailable.
  }
}

export function refreshWidgetForms(context: common.Context, onlyId?: string): void {
  const data = formBindingData.createFormBindingData(widgetFormData(context));
  const ids = onlyId ? [onlyId] : widgetFormIds(context);
  ids.forEach(id => { formProvider.updateForm(id, data).catch(() => {}); });
}
