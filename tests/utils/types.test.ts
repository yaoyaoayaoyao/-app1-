import type {
  AppUser,
  Habit,
  CheckInRecord,
  Note,
  SummaryResult,
} from '@/types';

describe('Type Definitions', () => {
  it('should create a valid AppUser', () => {
    const user: AppUser = {
      uid: 'test-uid',
      email: 'test@test.com',
      displayName: '测试用户',
      avatarColor: '#FFB5C5',
      partnerId: null,
      partnerCode: 'ABC123',
      createdAt: Date.now(),
    };
    expect(user.uid).toBe('test-uid');
  });

  it('should create a valid Habit', () => {
    const habit: Habit = {
      id: 'habit-1',
      userId: 'test-uid',
      title: '喝水',
      category: 'health',
      icon: 'water',
      color: '#B8E0F5',
      targetDays: 30,
      reminderTime: '09:00',
      createdAt: Date.now(),
      archived: false,
    };
    expect(habit.category).toBe('health');
  });

  it('should create a valid Note with checklist', () => {
    const note: Note = {
      id: 'note-1',
      userId: 'test-uid',
      title: '购物清单',
      content: '',
      colorIndex: 2,
      tag: 'todo',
      pinned: false,
      checklistItems: [
        { id: 'item-1', text: '牛奶', done: false },
        { id: 'item-2', text: '面包', done: true },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(note.checklistItems).toHaveLength(2);
  });
});
