import type { Habit, CheckInRecord, Note, FoodEntry, MealPlanItem } from '../types';

// 种子数据 - 从习惯明细总表导入
// 共 22 个习惯（18 活跃 + 4 归档），153 次打卡记录

export const seedHabits: Habit[] = [
  {
    id: 'habit_1',
    userId: 'seed_user_1',
    title: 'q10+B12',
    category: 'health',
    icon: 'pill',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789056000000,
    archived: false
  },
  {
    id: 'habit_2',
    userId: 'seed_user_1',
    title: 'trae、workbuddy astudio 百度网盘 签到',
    category: 'health',
    icon: 'calendar-check',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789315200000,
    archived: false
  },
  {
    id: 'habit_3',
    userId: 'seed_user_1',
    title: 'va+d',
    category: 'health',
    icon: 'pill',
    color: '#9aa7b0',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789142400000,
    archived: false
  },
  {
    id: 'habit_4',
    userId: 'seed_user_1',
    title: 'vc',
    category: 'health',
    icon: 'pill',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789315200000,
    archived: false
  },
  {
    id: 'habit_5',
    userId: 'seed_user_1',
    title: '亚麻籽油',
    category: 'health',
    icon: 'pill',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1788969600000,
    archived: false
  },
  {
    id: 'habit_6',
    userId: 'seed_user_1',
    title: '双萃精华',
    category: 'health',
    icon: 'pill',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789488000000,
    archived: false
  },
  {
    id: 'habit_7',
    userId: 'seed_user_1',
    title: '叶黄素',
    category: 'health',
    icon: 'pill',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789142400000,
    archived: false
  },
  {
    id: 'habit_8',
    userId: 'seed_user_1',
    title: '奶茶',
    category: 'health',
    icon: 'coffee',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789142400000,
    archived: false
  },
  {
    id: 'habit_9',
    userId: 'seed_user_1',
    title: '打扫拖地',
    category: 'health',
    icon: 'broom',
    color: '#9fae8c',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789920000000,
    archived: false
  },
  {
    id: 'habit_10',
    userId: 'seed_user_1',
    title: '氮泵',
    category: 'health',
    icon: 'run',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1788192000000,
    archived: false
  },
  {
    id: 'habit_11',
    userId: 'seed_user_1',
    title: '综合维b',
    category: 'health',
    icon: 'pill',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789142400000,
    archived: false
  },
  {
    id: 'habit_12',
    userId: 'seed_user_1',
    title: '肌酸（含锌镁牛磺酸）',
    category: 'health',
    icon: 'run',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789488000000,
    archived: false
  },
  {
    id: 'habit_13',
    userId: 'seed_user_1',
    title: '蔬菜',
    category: 'life',
    icon: 'silverware-fork-knife',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789142400000,
    archived: false
  },
  {
    id: 'habit_14',
    userId: 'seed_user_1',
    title: '运动',
    category: 'health',
    icon: 'run',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789056000000,
    archived: false
  },
  {
    id: 'habit_15',
    userId: 'seed_user_1',
    title: '酸奶',
    category: 'health',
    icon: 'coffee',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789056000000,
    archived: false
  },
  {
    id: 'habit_16',
    userId: 'seed_user_1',
    title: '铁＋叶酸',
    category: 'health',
    icon: 'pill',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789747200000,
    archived: false
  },
  {
    id: 'habit_17',
    userId: 'seed_user_1',
    title: '锌',
    category: 'health',
    icon: 'pill',
    color: '#e0d8c8',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1790092800000,
    archived: false
  },
  {
    id: 'habit_18',
    userId: 'seed_user_1',
    title: '鸡蛋或牛奶等蛋白质',
    category: 'health',
    icon: 'silverware-fork-knife',
    color: '#a7adb3',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789142400000,
    archived: false
  },
  {
    id: 'habit_19',
    userId: 'seed_user_1',
    title: 'vc+e+烟酰胺',
    category: 'health',
    icon: 'pill',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789142400000,
    archived: true
  },
  {
    id: 'habit_20',
    userId: 'seed_user_1',
    title: '移动app',
    category: 'custom',
    icon: 'laptop',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789142400000,
    archived: true
  },
  {
    id: 'habit_21',
    userId: 'seed_user_1',
    title: '钙片',
    category: 'health',
    icon: 'pill',
    color: '#9fae8c',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789142400000,
    archived: true
  },
  {
    id: 'habit_22',
    userId: 'seed_user_1',
    title: '锌镁',
    category: 'health',
    icon: 'pill',
    color: '#c9ada7',
    targetDays: 30,
    reminderTime: null,
    createdAt: 1789142400000,
    archived: true
  }
];

export const seedCheckIns: CheckInRecord[] = [
  {
    id: 'habit_1_2026-09-11_1',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-11',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789084800000
  },
  {
    id: 'habit_1_2026-09-11_2',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-11',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789084801000
  },
  {
    id: 'habit_1_2026-09-11_3',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-11',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789084802000
  },
  {
    id: 'habit_1_2026-09-12_1',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_1_2026-09-12_2',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171201000
  },
  {
    id: 'habit_1_2026-09-13_1',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_1_2026-09-13_2',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257601000
  },
  {
    id: 'habit_1_2026-09-14_1',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_1_2026-09-14_2',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344001000
  },
  {
    id: 'habit_1_2026-09-15_1',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_1_2026-09-15_2',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430401000
  },
  {
    id: 'habit_1_2026-09-16_1',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_1_2026-09-17_1',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603200000
  },
  {
    id: 'habit_1_2026-09-17_2',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603201000
  },
  {
    id: 'habit_1_2026-09-18_1',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-18',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789689600000
  },
  {
    id: 'habit_1_2026-09-19_1',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_1_2026-09-19_2',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776001000
  },
  {
    id: 'habit_1_2026-09-21_1',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948800000
  },
  {
    id: 'habit_1_2026-09-21_2',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948801000
  },
  {
    id: 'habit_1_2026-09-21_3',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948802000
  },
  {
    id: 'habit_1_2026-09-22_1',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_1_2026-09-22_2',
    habitId: 'habit_1',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035201000
  },
  {
    id: 'habit_2_2026-09-14_1',
    habitId: 'habit_2',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_2_2026-09-15_1',
    habitId: 'habit_2',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_2_2026-09-16_1',
    habitId: 'habit_2',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_2_2026-09-17_1',
    habitId: 'habit_2',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603200000
  },
  {
    id: 'habit_2_2026-09-18_1',
    habitId: 'habit_2',
    userId: 'seed_user_1',
    date: '2026-09-18',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789689600000
  },
  {
    id: 'habit_2_2026-09-19_1',
    habitId: 'habit_2',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_2_2026-09-22_1',
    habitId: 'habit_2',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_2_2026-09-23_1',
    habitId: 'habit_2',
    userId: 'seed_user_1',
    date: '2026-09-23',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790121600000
  },
  {
    id: 'habit_3_2026-09-12_1',
    habitId: 'habit_3',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_3_2026-09-13_1',
    habitId: 'habit_3',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_3_2026-09-14_1',
    habitId: 'habit_3',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_3_2026-09-15_1',
    habitId: 'habit_3',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_3_2026-09-16_1',
    habitId: 'habit_3',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_3_2026-09-17_1',
    habitId: 'habit_3',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603200000
  },
  {
    id: 'habit_3_2026-09-18_1',
    habitId: 'habit_3',
    userId: 'seed_user_1',
    date: '2026-09-18',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789689600000
  },
  {
    id: 'habit_3_2026-09-19_1',
    habitId: 'habit_3',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_3_2026-09-21_1',
    habitId: 'habit_3',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948800000
  },
  {
    id: 'habit_3_2026-09-22_1',
    habitId: 'habit_3',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_3_2026-09-23_1',
    habitId: 'habit_3',
    userId: 'seed_user_1',
    date: '2026-09-23',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790121600000
  },
  {
    id: 'habit_4_2026-09-14_1',
    habitId: 'habit_4',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_4_2026-09-17_1',
    habitId: 'habit_4',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603200000
  },
  {
    id: 'habit_4_2026-09-19_1',
    habitId: 'habit_4',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_4_2026-09-21_1',
    habitId: 'habit_4',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948800000
  },
  {
    id: 'habit_4_2026-09-22_1',
    habitId: 'habit_4',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_5_2026-09-10_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-10',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1788998400000
  },
  {
    id: 'habit_5_2026-09-11_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-11',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789084800000
  },
  {
    id: 'habit_5_2026-09-12_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_5_2026-09-13_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_5_2026-09-14_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_5_2026-09-15_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_5_2026-09-16_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_5_2026-09-17_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603200000
  },
  {
    id: 'habit_5_2026-09-18_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-18',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789689600000
  },
  {
    id: 'habit_5_2026-09-19_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_5_2026-09-21_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948800000
  },
  {
    id: 'habit_5_2026-09-22_1',
    habitId: 'habit_5',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_6_2026-09-16_1',
    habitId: 'habit_6',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_6_2026-09-17_1',
    habitId: 'habit_6',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603200000
  },
  {
    id: 'habit_7_2026-09-12_1',
    habitId: 'habit_7',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_7_2026-09-13_1',
    habitId: 'habit_7',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_7_2026-09-14_1',
    habitId: 'habit_7',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_7_2026-09-15_1',
    habitId: 'habit_7',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_7_2026-09-19_1',
    habitId: 'habit_7',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_7_2026-09-21_1',
    habitId: 'habit_7',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948800000
  },
  {
    id: 'habit_7_2026-09-23_1',
    habitId: 'habit_7',
    userId: 'seed_user_1',
    date: '2026-09-23',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790121600000
  },
  {
    id: 'habit_8_2026-09-12_1',
    habitId: 'habit_8',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_8_2026-09-13_1',
    habitId: 'habit_8',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_8_2026-09-14_1',
    habitId: 'habit_8',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_8_2026-09-15_1',
    habitId: 'habit_8',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_8_2026-09-16_1',
    habitId: 'habit_8',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_8_2026-09-17_1',
    habitId: 'habit_8',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603200000
  },
  {
    id: 'habit_8_2026-09-18_1',
    habitId: 'habit_8',
    userId: 'seed_user_1',
    date: '2026-09-18',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789689600000
  },
  {
    id: 'habit_8_2026-09-19_1',
    habitId: 'habit_8',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_8_2026-09-21_1',
    habitId: 'habit_8',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948800000
  },
  {
    id: 'habit_8_2026-09-22_1',
    habitId: 'habit_8',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_9_2026-09-21_1',
    habitId: 'habit_9',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948800000
  },
  {
    id: 'habit_9_2026-09-22_1',
    habitId: 'habit_9',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_9_2026-09-23_1',
    habitId: 'habit_9',
    userId: 'seed_user_1',
    date: '2026-09-23',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790121600000
  },
  {
    id: 'habit_11_2026-09-12_1',
    habitId: 'habit_11',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_11_2026-09-13_1',
    habitId: 'habit_11',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_11_2026-09-14_1',
    habitId: 'habit_11',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_11_2026-09-15_1',
    habitId: 'habit_11',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_11_2026-09-16_1',
    habitId: 'habit_11',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_11_2026-09-17_1',
    habitId: 'habit_11',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603200000
  },
  {
    id: 'habit_11_2026-09-18_1',
    habitId: 'habit_11',
    userId: 'seed_user_1',
    date: '2026-09-18',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789689600000
  },
  {
    id: 'habit_11_2026-09-19_1',
    habitId: 'habit_11',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_11_2026-09-22_1',
    habitId: 'habit_11',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_11_2026-09-23_1',
    habitId: 'habit_11',
    userId: 'seed_user_1',
    date: '2026-09-23',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790121600000
  },
  {
    id: 'habit_12_2026-09-16_1',
    habitId: 'habit_12',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_13_2026-09-12_1',
    habitId: 'habit_13',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_13_2026-09-13_1',
    habitId: 'habit_13',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_13_2026-09-14_1',
    habitId: 'habit_13',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_13_2026-09-16_1',
    habitId: 'habit_13',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_13_2026-09-19_1',
    habitId: 'habit_13',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_13_2026-09-21_1',
    habitId: 'habit_13',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948800000
  },
  {
    id: 'habit_13_2026-09-22_1',
    habitId: 'habit_13',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_14_2026-09-11_1',
    habitId: 'habit_14',
    userId: 'seed_user_1',
    date: '2026-09-11',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789084800000
  },
  {
    id: 'habit_14_2026-09-12_1',
    habitId: 'habit_14',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_14_2026-09-14_1',
    habitId: 'habit_14',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_14_2026-09-15_1',
    habitId: 'habit_14',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_14_2026-09-16_1',
    habitId: 'habit_14',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_14_2026-09-17_1',
    habitId: 'habit_14',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603200000
  },
  {
    id: 'habit_14_2026-09-18_1',
    habitId: 'habit_14',
    userId: 'seed_user_1',
    date: '2026-09-18',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789689600000
  },
  {
    id: 'habit_14_2026-09-19_1',
    habitId: 'habit_14',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_14_2026-09-21_1',
    habitId: 'habit_14',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948800000
  },
  {
    id: 'habit_14_2026-09-22_1',
    habitId: 'habit_14',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_14_2026-09-23_1',
    habitId: 'habit_14',
    userId: 'seed_user_1',
    date: '2026-09-23',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790121600000
  },
  {
    id: 'habit_15_2026-09-11_1',
    habitId: 'habit_15',
    userId: 'seed_user_1',
    date: '2026-09-11',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789084800000
  },
  {
    id: 'habit_15_2026-09-12_1',
    habitId: 'habit_15',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_15_2026-09-13_1',
    habitId: 'habit_15',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_15_2026-09-14_1',
    habitId: 'habit_15',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_15_2026-09-15_1',
    habitId: 'habit_15',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_16_2026-09-19_1',
    habitId: 'habit_16',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_16_2026-09-22_1',
    habitId: 'habit_16',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_17_2026-09-23_1',
    habitId: 'habit_17',
    userId: 'seed_user_1',
    date: '2026-09-23',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790121600000
  },
  {
    id: 'habit_18_2026-09-12_1',
    habitId: 'habit_18',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_18_2026-09-13_1',
    habitId: 'habit_18',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_18_2026-09-14_1',
    habitId: 'habit_18',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_18_2026-09-15_1',
    habitId: 'habit_18',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_18_2026-09-16_1',
    habitId: 'habit_18',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_18_2026-09-18_1',
    habitId: 'habit_18',
    userId: 'seed_user_1',
    date: '2026-09-18',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789689600000
  },
  {
    id: 'habit_18_2026-09-21_1',
    habitId: 'habit_18',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948800000
  },
  {
    id: 'habit_18_2026-09-22_1',
    habitId: 'habit_18',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_18_2026-09-23_1',
    habitId: 'habit_18',
    userId: 'seed_user_1',
    date: '2026-09-23',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790121600000
  },
  {
    id: 'habit_19_2026-09-12_1',
    habitId: 'habit_19',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_19_2026-09-13_1',
    habitId: 'habit_19',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_19_2026-09-14_1',
    habitId: 'habit_19',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_20_2026-09-12_1',
    habitId: 'habit_20',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_20_2026-09-13_1',
    habitId: 'habit_20',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_20_2026-09-14_1',
    habitId: 'habit_20',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_20_2026-09-15_1',
    habitId: 'habit_20',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_20_2026-09-16_1',
    habitId: 'habit_20',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_20_2026-09-17_1',
    habitId: 'habit_20',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603200000
  },
  {
    id: 'habit_20_2026-09-18_1',
    habitId: 'habit_20',
    userId: 'seed_user_1',
    date: '2026-09-18',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789689600000
  },
  {
    id: 'habit_21_2026-09-12_1',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_21_2026-09-13_1',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257600000
  },
  {
    id: 'habit_21_2026-09-13_2',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-13',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789257601000
  },
  {
    id: 'habit_21_2026-09-14_1',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  },
  {
    id: 'habit_21_2026-09-15_1',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-15',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789430400000
  },
  {
    id: 'habit_21_2026-09-16_1',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-16',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789516800000
  },
  {
    id: 'habit_21_2026-09-17_1',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603200000
  },
  {
    id: 'habit_21_2026-09-17_2',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-17',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789603201000
  },
  {
    id: 'habit_21_2026-09-18_1',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-18',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789689600000
  },
  {
    id: 'habit_21_2026-09-19_1',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776000000
  },
  {
    id: 'habit_21_2026-09-19_2',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-19',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789776001000
  },
  {
    id: 'habit_21_2026-09-21_1',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948800000
  },
  {
    id: 'habit_21_2026-09-21_2',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948801000
  },
  {
    id: 'habit_21_2026-09-21_3',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-21',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789948802000
  },
  {
    id: 'habit_21_2026-09-22_1',
    habitId: 'habit_21',
    userId: 'seed_user_1',
    date: '2026-09-22',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1790035200000
  },
  {
    id: 'habit_22_2026-09-12_1',
    habitId: 'habit_22',
    userId: 'seed_user_1',
    date: '2026-09-12',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789171200000
  },
  {
    id: 'habit_22_2026-09-14_1',
    habitId: 'habit_22',
    userId: 'seed_user_1',
    date: '2026-09-14',
    completed: true,
    note: null,
    mood: null,
    createdAt: 1789344000000
  }
];

export const seedNotes: Note[] = [
  {
    id: 'note_1',
    userId: 'seed_user_1',
    title: '本周目标',
    content: '坚持每天运动和补充维生素，保持健康作息。',
    colorIndex: 0,
    tag: 'todo',
    pinned: true,
    checklistItems: [
      { id: 'ci_1', text: '每天运动30分钟', done: true },
      { id: 'ci_2', text: '按时吃保健品', done: true },
      { id: 'ci_3', text: '多吃蔬菜水果', done: false }
    ],
    createdAt: 1789869600000,
    updatedAt: 1790062200000
  },
  {
    id: 'note_2',
    userId: 'seed_user_1',
    title: '今日心情',
    content: '今天状态不错，完成了大部分习惯打卡。继续加油！',
    colorIndex: 2,
    tag: 'diary',
    pinned: false,
    checklistItems: null,
    createdAt: 1790164800000,
    updatedAt: 1790164800000
  }
];

// === 饮食记录种子数据 ===
// 共 8 条记录，覆盖 3 天（2026-09-22 ~ 2026-09-24）

export const seedFoodEntries: FoodEntry[] = [
  {
    id: 'food_1',
    date: '2026-09-22',
    meal: 'breakfast',
    name: '全麦吐司配牛油果',
    kcal: 320,
    carbs: 35,
    fat: 18,
    protein: 8,
    portion: 150,
    image: '',
    frame: 'cream',
    createdAt: 1790064000000
  },
  {
    id: 'food_2',
    date: '2026-09-22',
    meal: 'lunch',
    name: '鸡胸肉沙拉',
    kcal: 450,
    carbs: 20,
    fat: 15,
    protein: 40,
    portion: 300,
    image: '',
    frame: 'none',
    createdAt: 1790085600000
  },
  {
    id: 'food_3',
    date: '2026-09-22',
    meal: 'dinner',
    name: '番茄意面',
    kcal: 580,
    carbs: 75,
    fat: 18,
    protein: 15,
    portion: 250,
    image: '',
    frame: 'dots',
    createdAt: 1790107200000
  },
  {
    id: 'food_4',
    date: '2026-09-23',
    meal: 'breakfast',
    name: '燕麦粥',
    kcal: 280,
    carbs: 48,
    fat: 6,
    protein: 8,
    portion: 200,
    image: '',
    frame: 'cloud',
    createdAt: 1790150400000
  },
  {
    id: 'food_5',
    date: '2026-09-23',
    meal: 'lunch',
    name: '鸡胸肉沙拉',
    kcal: 430,
    carbs: 18,
    fat: 14,
    protein: 38,
    portion: 280,
    image: '',
    frame: 'none',
    createdAt: 1790172000000
  },
  {
    id: 'food_6',
    date: '2026-09-23',
    meal: 'snack',
    name: '草莓酸奶',
    kcal: 150,
    carbs: 22,
    fat: 3,
    protein: 6,
    portion: 120,
    image: '',
    frame: 'candy',
    createdAt: 1790186400000
  },
  {
    id: 'food_7',
    date: '2026-09-24',
    meal: 'breakfast',
    name: '全麦吐司配牛油果',
    kcal: 310,
    carbs: 34,
    fat: 17,
    protein: 8,
    portion: 145,
    image: '',
    frame: 'cream',
    createdAt: 1790236800000
  },
  {
    id: 'food_8',
    date: '2026-09-24',
    meal: 'lunch',
    name: '三文鱼便当',
    kcal: 520,
    carbs: 45,
    fat: 20,
    protein: 28,
    portion: 350,
    image: '',
    frame: 'none',
    createdAt: 1790258400000
  }
];

// === 饮食计划种子数据 ===

export const seedMealPlans: MealPlanItem[] = [
  {
    id: 'plan_1',
    date: '2026-09-24',
    meal: 'breakfast',
    name: '全麦吐司+牛奶',
    emoji: '🍞',
    done: true,
    sortOrder: 0
  },
  {
    id: 'plan_2',
    date: '2026-09-24',
    meal: 'lunch',
    name: '鸡胸肉+糙米饭',
    emoji: '🍗',
    done: false,
    sortOrder: 0
  },
  {
    id: 'plan_3',
    date: '2026-09-24',
    meal: 'dinner',
    name: '蔬菜汤+杂粮饭',
    emoji: '🥗',
    done: false,
    sortOrder: 0
  },
  {
    id: 'plan_4',
    date: '2026-09-24',
    meal: 'snack',
    name: '水果+坚果',
    emoji: '🍎',
    done: false,
    sortOrder: 0
  }
];
