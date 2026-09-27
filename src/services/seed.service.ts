import { seedHabits, seedCheckIns, seedNotes, seedFoodEntries, seedMealPlans } from '@/data/seedData';
import { useCheckInStore } from '@/stores/checkin.store';
import { useNotesStore } from '@/stores/notes.store';
import { useFoodStore } from '@/stores/food.store';
import type { Habit, CheckInRecord, Note, FoodEntry, MealPlanItem } from '@/types';

/**
 * 检查是否已导入过数据（通过检查 habits 数量判断）
 */
export function hasSeedData(): boolean {
  const habits = useCheckInStore.getState().habits;
  return habits.length > 0;
}

/**
 * 导入所有种子数据（习惯 + 打卡记录 + 便签 + 饮食记录 + 饮食计划）
 */
export async function importAllSeedData(): Promise<{
  habits: number;
  checkIns: number;
  notes: number;
  foodEntries: number;
  mealPlans: number;
}> {
  const userId = 'local_user';

  // 为种子数据替换 userId
  const habits: Habit[] = seedHabits.map((h) => ({ ...h, userId, mode: h.mode ?? 'required' }));
  const checkIns: CheckInRecord[] = seedCheckIns.map((c) => ({ ...c, userId }));
  const notes: Note[] = seedNotes.map((n) => ({ ...n, userId }));

  // 饮食数据（不需要 userId）
  const foodEntries: FoodEntry[] = [...seedFoodEntries];
  const mealPlans: MealPlanItem[] = [...seedMealPlans];

  // 写入 store
  useCheckInStore.getState().importSeedData(habits, checkIns);
  useNotesStore.getState().importSeedData(notes);
  useFoodStore.getState().importSeedData(foodEntries, mealPlans);

  return {
    habits: seedHabits.length,
    checkIns: seedCheckIns.length,
    notes: seedNotes.length,
    foodEntries: seedFoodEntries.length,
    mealPlans: seedMealPlans.length,
  };
}

/**
 * 清空所有用户数据（用于重置）
 */
export async function clearAllUserData(): Promise<void> {
  useCheckInStore.getState().clearAllData();
  useNotesStore.getState().clearAllData();
  useFoodStore.getState().clearAllData();
}
