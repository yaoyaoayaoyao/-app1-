/**
 * notes.service 单元测试
 * 所有 Firebase 相关调用均使用 mock
 */

// Mock Firebase 模块
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({ name: 'test-app' }),
  getApps: jest.fn().mockReturnValue([]),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue({
    currentUser: { uid: 'test-uid-123', email: 'test@example.com' },
  }),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn().mockReturnValue({}),
  collection: jest.fn().mockReturnValue({}),
  doc: jest.fn().mockReturnValue({ id: 'test-doc' }),
  query: jest.fn().mockReturnValue({}),
  orderBy: jest.fn().mockReturnValue({}),
  onSnapshot: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn().mockReturnValue({ seconds: 1234567890 }),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn().mockReturnValue({}),
}));

// Mock id 生成器
jest.mock('@/utils/id', () => ({
  generateId: jest.fn().mockReturnValue('note-id-123'),
  generatePartnerCode: jest.fn().mockReturnValue('ABC123'),
}));

import { getAuth } from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  orderBy,
} from 'firebase/firestore';
import { generateId } from '@/utils/id';
import {
  createNote,
  subscribeToNotes,
  updateNote,
  deleteNote,
  togglePin,
  updateChecklistItem,
} from '@/services/notes.service';
import type { Note, ChecklistItem, NoteTag } from '@/types';

const mockUid = 'test-uid-123';

const mockChecklistItems: ChecklistItem[] = [
  { id: 'item-1', text: '任务1', done: false },
  { id: 'item-2', text: '任务2', done: true },
];

const mockNote: Note = {
  id: 'note-id-123',
  userId: mockUid,
  title: '测试便签',
  content: '测试内容',
  colorIndex: 0,
  tag: 'todo' as NoteTag,
  pinned: false,
  checklistItems: mockChecklistItems,
  createdAt: expect.any(Number),
  updatedAt: expect.any(Number),
};

describe('Notes Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 currentUser 为已登录状态
    const auth = getAuth();
    (auth as any).currentUser = { uid: mockUid, email: 'test@example.com' };
  });

  describe('createNote', () => {
    it('should create a note with correct fields', async () => {
      (setDoc as jest.Mock).mockResolvedValue(undefined);
      (generateId as jest.Mock).mockReturnValue('note-id-123');

      const result = await createNote(
        '测试便签',
        '测试内容',
        0,
        'todo',
        mockChecklistItems,
      );

      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('note-id-123');
      expect(result.userId).toBe(mockUid);
      expect(result.title).toBe('测试便签');
      expect(result.content).toBe('测试内容');
      expect(result.colorIndex).toBe(0);
      expect(result.tag).toBe('todo');
      expect(result.pinned).toBe(false);
      expect(result.checklistItems).toEqual(mockChecklistItems);
      expect(typeof result.createdAt).toBe('number');
      expect(typeof result.updatedAt).toBe('number');
    });

    it('should use serverTimestamp for Firestore createdAt and updatedAt', async () => {
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await createNote('测试便签', '测试内容', 0, 'todo', null);

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('should handle null checklistItems', async () => {
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await createNote('测试便签', '测试内容', 0, 'plain', null);

      expect(result.checklistItems).toBeNull();
    });

    it('should throw error when user is not logged in', async () => {
      const auth = getAuth();
      (auth as any).currentUser = null;

      await expect(
        createNote('测试便签', '测试内容', 0, 'todo', null),
      ).rejects.toThrow('用户未登录');
    });

    it('should propagate Firestore errors', async () => {
      const mockError = new Error('Permission denied');
      (setDoc as jest.Mock).mockRejectedValue(mockError);

      await expect(
        createNote('测试便签', '测试内容', 0, 'todo', null),
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('subscribeToNotes', () => {
    it('should return unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = subscribeToNotes(jest.fn());

      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call callback with sorted notes (pinned first, then by updatedAt desc)', () => {
      let snapshotCallback: any = null;
      (onSnapshot as jest.Mock).mockImplementation((_q, callback) => {
        snapshotCallback = callback;
        return jest.fn();
      });

      const notesData: Note[] = [
        {
          id: 'note-1',
          userId: mockUid,
          title: '普通便签1',
          content: '',
          colorIndex: 0,
          tag: 'plain',
          pinned: false,
          checklistItems: null,
          createdAt: 1000,
          updatedAt: 3000,
        },
        {
          id: 'note-2',
          userId: mockUid,
          title: '置顶便签',
          content: '',
          colorIndex: 0,
          tag: 'plain',
          pinned: true,
          checklistItems: null,
          createdAt: 1000,
          updatedAt: 2000,
        },
        {
          id: 'note-3',
          userId: mockUid,
          title: '普通便签2',
          content: '',
          colorIndex: 0,
          tag: 'plain',
          pinned: false,
          checklistItems: null,
          createdAt: 1000,
          updatedAt: 4000,
        },
      ];

      const mockSnapshot = {
        docs: notesData.map((n) => ({
          data: () => n,
        })),
      };

      const callback = jest.fn();
      subscribeToNotes(callback);

      // 触发 snapshot 回调
      snapshotCallback(mockSnapshot);

      expect(callback).toHaveBeenCalledTimes(1);
      const sortedNotes = callback.mock.calls[0][0];
      // 置顶的应该排在最前面
      expect(sortedNotes[0].id).toBe('note-2');
      // 然后按 updatedAt 倒序
      expect(sortedNotes[1].id).toBe('note-3');
      expect(sortedNotes[2].id).toBe('note-1');
    });

    it('should use query with orderBy updatedAt desc', () => {
      (onSnapshot as jest.Mock).mockReturnValue(jest.fn());

      subscribeToNotes(jest.fn());

      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
    });

    it('should throw error when user is not logged in', () => {
      const auth = getAuth();
      (auth as any).currentUser = null;

      expect(() => subscribeToNotes(jest.fn())).toThrow('用户未登录');
    });
  });

  describe('updateNote', () => {
    it('should update note with provided updates', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateNote('note-id-123', { title: '新标题', content: '新内容' });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: '新标题',
          content: '新内容',
          updatedAt: expect.any(Number),
        }),
      );
    });

    it('should always update updatedAt', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateNote('note-id-123', { title: '新标题' });

      const callArgs = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(typeof callArgs.updatedAt).toBe('number');
    });

    it('should throw error when user is not logged in', async () => {
      const auth = getAuth();
      (auth as any).currentUser = null;

      await expect(updateNote('note-id-123', { title: '新标题' })).rejects.toThrow(
        '用户未登录',
      );
    });

    it('should propagate update errors', async () => {
      const mockError = new Error('Network error');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);

      await expect(updateNote('note-id-123', { title: '新标题' })).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('deleteNote', () => {
    it('should delete note by id', async () => {
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await deleteNote('note-id-123');

      expect(deleteDoc).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user is not logged in', async () => {
      const auth = getAuth();
      (auth as any).currentUser = null;

      await expect(deleteNote('note-id-123')).rejects.toThrow('用户未登录');
    });

    it('should propagate delete errors', async () => {
      const mockError = new Error('Permission denied');
      (deleteDoc as jest.Mock).mockRejectedValue(mockError);

      await expect(deleteNote('note-id-123')).rejects.toThrow('Permission denied');
    });
  });

  describe('togglePin', () => {
    it('should toggle pin from false to true', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await togglePin('note-id-123', false);

      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { pinned: true });
    });

    it('should toggle pin from true to false', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await togglePin('note-id-123', true);

      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { pinned: false });
    });

    it('should throw error when user is not logged in', async () => {
      const auth = getAuth();
      (auth as any).currentUser = null;

      await expect(togglePin('note-id-123', false)).rejects.toThrow('用户未登录');
    });

    it('should propagate toggle errors', async () => {
      const mockError = new Error('Network error');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);

      await expect(togglePin('note-id-123', false)).rejects.toThrow('Network error');
    });
  });

  describe('updateChecklistItem', () => {
    it('should update checklist items for a note', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const newItems: ChecklistItem[] = [
        { id: 'item-1', text: '任务1', done: true },
        { id: 'item-2', text: '任务2', done: true },
      ];

      await updateChecklistItem('note-id-123', newItems);

      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          checklistItems: newItems,
          updatedAt: expect.any(Number),
        }),
      );
    });

    it('should update updatedAt when checklist changes', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateChecklistItem('note-id-123', []);

      const callArgs = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(typeof callArgs.updatedAt).toBe('number');
    });

    it('should throw error when user is not logged in', async () => {
      const auth = getAuth();
      (auth as any).currentUser = null;

      await expect(updateChecklistItem('note-id-123', [])).rejects.toThrow(
        '用户未登录',
      );
    });

    it('should propagate update errors', async () => {
      const mockError = new Error('Permission denied');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);

      await expect(updateChecklistItem('note-id-123', [])).rejects.toThrow(
        'Permission denied',
      );
    });
  });
});
