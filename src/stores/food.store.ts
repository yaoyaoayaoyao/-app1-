import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FoodEntry, MealPlanItem, FoodInsights, Meal } from '@/types';
import { generateId } from '@/utils/id';
import {
  getTodayString,
  getWeekRange,
  getMonthRange,
  formatDate,
  calculateStreak,
} from '@/utils/date';

interface FoodState {
  entries: FoodEntry[];
  plans: MealPlanItem[];

  // 饮食记录操作
  addEntry: (data: Omit<FoodEntry, 'id' | 'createdAt'>) => FoodEntry;
  updateEntry: (id: string, updates: Partial<FoodEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => FoodEntry | null;
  getEntriesByDate: (date: string) => FoodEntry[];
  getEntriesByMonth: (year: number, month: number) => FoodEntry[];
  getEntriesByWeek: (weekStart: string) => FoodEntry[];
  getInsights: (period: 'week' | 'month') => FoodInsights;

  // 饮食计划操作
  addPlan: (data: Omit<MealPlanItem, 'id' | 'sortOrder'>) => MealPlanItem;
  togglePlan: (id: string) => void;
  removePlan: (id: string) => void;
  getPlansByDate: (date: string) => MealPlanItem[];

  // 数据管理
  importSeedData: (entries: FoodEntry[], plans: MealPlanItem[]) => void;
  clearAllData: () => void;
}

function sortEntries(entries: FoodEntry[]): FoodEntry[] {
  const mealOrder: Record<Meal, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
  return [...entries].sort((a, b) => {
    const mo = mealOrder[a.meal] - mealOrder[b.meal];
    if (mo !== 0) return mo;
    return a.createdAt - b.createdAt;
  });
}

/** 由三大营养素计算热量：碳水*4 + 蛋白*4 + 脂肪*9 */
export function calcKcal(entry: FoodEntry): number {
  if (entry.kcal != null && entry.kcal > 0) return entry.kcal;
  const carbs = entry.carbs || 0;
  const fat = entry.fat || 0;
  const protein = entry.protein || 0;
  return Math.round(carbs * 4 + protein * 4 + fat * 9);
}

export const useFoodStore = create<FoodState>()(
  persist(
    (set, get) => ({
      entries: [],
      plans: [],

      // === 饮食记录操作 ===
      addEntry: (data) => {
        const newEntry: FoodEntry = {
          ...data,
          id: generateId(),
          createdAt: Date.now(),
        };
        set((state) => ({
          entries: [...state.entries, newEntry],
        }));
        return newEntry;
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      getEntry: (id) => {
        return get().entries.find((e) => e.id === id) || null;
      },

      getEntriesByDate: (date) => {
        return sortEntries(get().entries.filter((e) => e.date === date));
      },

      getEntriesByMonth: (year, month) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const [start, end] = getMonthRange(dateStr);
        return get().entries.filter((e) => e.date >= start && e.date <= end);
      },

      getEntriesByWeek: (weekStart) => {
        const [start, end] = getWeekRange(weekStart);
        return get().entries.filter((e) => e.date >= start && e.date <= end);
      },

      getInsights: (period) => {
        const today = getTodayString();
        let periodEntries: FoodEntry[];
        if (period === 'week') {
          const [start] = getWeekRange(today);
          periodEntries = get().getEntriesByWeek(start);
        } else {
          const now = new Date();
          periodEntries = get().getEntriesByMonth(now.getFullYear(), now.getMonth() + 1);
        }

        // 有记录的天数
        const dateSet = new Set(periodEntries.map((e) => e.date));
        const recordedDays = dateSet.size;

        // 总餐次
        const totalMeals = periodEntries.length;

        // 热量统计
        let totalKcal = 0;
        const kcalDays = new Set<string>();
        let carbsKcal = 0;
        let fatKcal = 0;
        let proteinKcal = 0;
        periodEntries.forEach((e) => {
          const kcal = calcKcal(e);
          if (kcal > 0) {
            totalKcal += kcal;
            kcalDays.add(e.date);
          }
          carbsKcal += (e.carbs || 0) * 4;
          proteinKcal += (e.protein || 0) * 4;
          fatKcal += (e.fat || 0) * 9;
        });

        const daysWithKcal = kcalDays.size;
        const avgKcal = daysWithKcal > 0 ? Math.round(totalKcal / daysWithKcal) : 0;

        // top3 食物
        const foodCounts: Record<string, number> = {};
        periodEntries.forEach((e) => {
          const name = e.name.trim();
          if (name) foodCounts[name] = (foodCounts[name] || 0) + 1;
        });
        const topFoods = Object.entries(foodCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        // 餐别计数
        const mealCounts = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
        periodEntries.forEach((e) => {
          mealCounts[e.meal]++;
        });

        // 连续记录天数（基于全部 entries，截止今天）
        const allDates = [...new Set(get().entries.map((e) => e.date))].sort();
        const streak = calculateStreak(allDates, today);

        // 智能点评
        const { headline, tips } = buildInsightsText(
          recordedDays,
          totalMeals,
          avgKcal,
          streak,
          mealCounts,
          period
        );

        return {
          recordedDays,
          totalMeals,
          daysWithKcal,
          totalKcal,
          avgKcal,
          topFoods,
          mealCounts,
          streak,
          carbsKcal: Math.round(carbsKcal),
          fatKcal: Math.round(fatKcal),
          proteinKcal: Math.round(proteinKcal),
          headline,
          tips,
        };
      },

      // === 饮食计划操作 ===
      addPlan: (data) => {
        const datePlans = get().plans.filter((p) => p.date === data.date);
        const sortOrder = datePlans.length;
        const newPlan: MealPlanItem = {
          ...data,
          id: generateId(),
          sortOrder,
        };
        set((state) => ({
          plans: [...state.plans, newPlan],
        }));
        return newPlan;
      },

      togglePlan: (id) => {
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === id ? { ...p, done: !p.done } : p
          ),
        }));
      },

      removePlan: (id) => {
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== id),
        }));
      },

      getPlansByDate: (date) => {
        const mealOrder: Record<Meal, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
        return get()
          .plans.filter((p) => p.date === date)
          .sort((a, b) => {
            const mo = mealOrder[a.meal] - mealOrder[b.meal];
            if (mo !== 0) return mo;
            return a.sortOrder - b.sortOrder;
          });
      },

      // === 数据管理 ===
      importSeedData: (entries, plans) => {
        set({ entries, plans });
      },

      clearAllData: () => {
        set({ entries: [], plans: [] });
      },
    }),
    {
      name: 'cinnamoroll-food',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ entries: state.entries, plans: state.plans }),
    },
  ),
);

/** 生成智能点评文案 */
function buildInsightsText(
  recordedDays: number,
  totalMeals: number,
  avgKcal: number,
  streak: number,
  mealCounts: { breakfast: number; lunch: number; dinner: number; snack: number },
  period: 'week' | 'month'
): { headline: string; tips: string[] } {
  const tips: string[] = [];
  const periodLabel = period === 'week' ? '本周' : '本月';

  if (recordedDays === 0) {
    return {
      headline: `${periodLabel}还没有记录哦，从记一餐开始吧~`,
      tips: ['坚持记录能帮助你更好地了解饮食习惯', '每餐拍张照片，玉桂狗帮你留住美好瞬间'],
    };
  }

  // headline
  let headline = '';
  if (streak >= 7) {
    headline = `连续记录${streak}天，太棒啦！玉桂狗为你骄傲~`;
  } else if (streak >= 3) {
    headline = `已连续记录${streak}天，继续保持就会越来越棒！`;
  } else if (recordedDays >= 3) {
    headline = `${periodLabel}已记录${recordedDays}天${totalMeals}餐，继续加油~`;
  } else {
    headline = `${periodLabel}已记录${totalMeals}餐，多记几餐看看趋势吧~`;
  }

  // 热量点评
  if (avgKcal > 0) {
    if (avgKcal < 1200) {
      tips.push(`日均${avgKcal}kcal，热量偏低，记得吃饱才有力气呀`);
    } else if (avgKcal > 2400) {
      tips.push(`日均${avgKcal}kcal，热量偏高，可以适当减少高油食物`);
    } else {
      tips.push(`日均${avgKcal}kcal，热量在合理范围内，赞！`);
    }
  }

  // 早餐点评
  if (mealCounts.breakfast === 0 && recordedDays > 0) {
    tips.push('还没有记录早餐，早餐是一天活力的来源哦~');
  } else if (mealCounts.breakfast >= recordedDays * 0.8 && recordedDays > 0) {
    tips.push('早餐记录很规律，继续保持！');
  }

  // 加餐点评
  if (mealCounts.snack > totalMeals * 0.4 && totalMeals > 0) {
    tips.push(`加餐记录较多(${mealCounts.snack}次)，注意控制零食量~`);
  }

  if (tips.length === 0) {
    tips.push('饮食记录很均衡，继续保持规律饮食！');
  }

  return { headline, tips };
}

/** 餐别元数据 */
export const MEAL_META: Record<Meal, { label: string; emoji: string }> = {
  breakfast: { label: '早餐', emoji: '🌅' },
  lunch: { label: '午餐', emoji: '☀️' },
  dinner: { label: '晚餐', emoji: '🌙' },
  snack: { label: '加餐', emoji: '🍪' },
};

/** 照片边框样式 */
export const FRAME_STYLES = [
  { id: 'none', label: '原图', emoji: '🔲' },
  { id: 'cream', label: '奶油边', emoji: '🤍' },
  { id: 'dots', label: '波点', emoji: '🔵' },
  { id: 'candy', label: '糖果边', emoji: '🍬' },
  { id: 'cloud', label: '云朵边', emoji: '☁️' },
] as const;

export { formatDate };
