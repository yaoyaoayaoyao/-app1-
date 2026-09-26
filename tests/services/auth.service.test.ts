/**
 * auth.service 单元测试
 * 所有 Firebase 相关调用均使用 mock
 */

// Mock Firebase 模块
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({ name: 'test-app' }),
  getApps: jest.fn().mockReturnValue([]),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue({}),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn().mockReturnValue({}),
  doc: jest.fn().mockReturnValue({ id: 'test-doc' }),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn().mockReturnValue({ seconds: 1234567890 }),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn().mockReturnValue({}),
}));

// Mock id 生成器
jest.mock('@/utils/id', () => ({
  generatePartnerCode: jest.fn().mockReturnValue('ABC123'),
}));

// Mock theme colors
jest.mock('@/theme', () => ({
  colors: {
    accentWarm: '#FFB5C5',
    accentMint: '#A8E6CF',
    accentLavender: '#C3B1E1',
    accentLemon: '#FFF5BA',
    primary: '#7EC8E3',
    primaryLight: '#B8E0F5',
  },
}));

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { generatePartnerCode } from '@/utils/id';
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  onAuthChange,
  updateUserDisplayName,
  createUserDocument,
} from '@/services/auth.service';
import type { AppUser } from '@/types';

const mockFirebaseUser = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: null,
} as any;

const mockAppUser: AppUser = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  avatarColor: '#FFB5C5',
  partnerId: null,
  partnerCode: 'ABC123',
  createdAt: expect.any(Number),
};

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserDocument', () => {
    it('should create user document with correct fields', async () => {
      (generatePartnerCode as jest.Mock).mockReturnValue('ABC123');

      const result = await createUserDocument(mockFirebaseUser, 'Test User');

      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(updateProfile).toHaveBeenCalledWith(mockFirebaseUser, {
        displayName: 'Test User',
      });
      expect(result.uid).toBe('test-uid-123');
      expect(result.email).toBe('test@example.com');
      expect(result.displayName).toBe('Test User');
      expect(result.partnerCode).toBe('ABC123');
      expect(result.partnerId).toBeNull();
      expect(typeof result.createdAt).toBe('number');
    });

    it('should generate a partner code', async () => {
      await createUserDocument(mockFirebaseUser, 'Test User');
      expect(generatePartnerCode).toHaveBeenCalledTimes(1);
    });

    it('should use serverTimestamp for Firestore createdAt', async () => {
      await createUserDocument(mockFirebaseUser, 'Test User');
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          createdAt: serverTimestamp(),
        }),
      );
    });

    it('should assign one of the avatar colors', async () => {
      const result = await createUserDocument(mockFirebaseUser, 'Test User');
      const validColors = [
        '#FFB5C5',
        '#A8E6CF',
        '#C3B1E1',
        '#FFF5BA',
        '#7EC8E3',
        '#B8E0F5',
      ];
      expect(validColors).toContain(result.avatarColor);
    });
  });

  describe('signUp', () => {
    it('should create user with email, password and displayName', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockFirebaseUser,
      });

      const result = await signUp('test@example.com', 'password123', 'Test User');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123',
      );
      expect(result.displayName).toBe('Test User');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error when createUserWithEmailAndPassword fails', async () => {
      const mockError = new Error('Email already in use');
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      await expect(
        signUp('existing@example.com', 'password123', 'Test User'),
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('signIn', () => {
    it('should sign in user and return AppUser from Firestore', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockFirebaseUser,
      });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockAppUser,
      });

      const result = await signIn('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123',
      );
      expect(getDoc).toHaveBeenCalled();
      expect(result).toEqual(mockAppUser);
    });

    it('should throw error when user document does not exist', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockFirebaseUser,
      });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      await expect(signIn('test@example.com', 'password123')).rejects.toThrow(
        '用户文档不存在',
      );
    });

    it('should throw error when signInWithEmailAndPassword fails', async () => {
      const mockError = new Error('Invalid email or password');
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      await expect(
        signIn('wrong@example.com', 'wrongpass'),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('signOut', () => {
    it('should call firebase signOut', async () => {
      (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);

      await signOut();

      expect(firebaseSignOut).toHaveBeenCalledTimes(1);
    });

    it('should propagate signOut errors', async () => {
      const mockError = new Error('Network error');
      (firebaseSignOut as jest.Mock).mockRejectedValue(mockError);

      await expect(signOut()).rejects.toThrow('Network error');
    });
  });

  describe('getCurrentUser', () => {
    it('should return AppUser when document exists', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockAppUser,
      });

      const result = await getCurrentUser('test-uid-123');

      expect(getDoc).toHaveBeenCalled();
      expect(result).toEqual(mockAppUser);
    });

    it('should return null when document does not exist', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const result = await getCurrentUser('nonexistent-uid');

      expect(result).toBeNull();
    });
  });

  describe('onAuthChange', () => {
    it('should call callback with AppUser when firebase user is authenticated', async () => {
      let authCallback: any = null;
      (onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback) => {
        authCallback = callback;
        return jest.fn(); // unsubscribe function
      });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockAppUser,
      });

      const callback = jest.fn();
      const unsubscribe = onAuthChange(callback);

      expect(typeof unsubscribe).toBe('function');

      // 触发认证状态变化 - 用户已登录
      await authCallback(mockFirebaseUser);

      expect(callback).toHaveBeenCalledWith(mockAppUser);
    });

    it('should call callback with null when firebase user is not authenticated', async () => {
      let authCallback: any = null;
      (onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback) => {
        authCallback = callback;
        return jest.fn();
      });

      const callback = jest.fn();
      onAuthChange(callback);

      // 触发认证状态变化 - 用户未登录
      await authCallback(null);

      expect(callback).toHaveBeenCalledWith(null);
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      (onAuthStateChanged as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthChange(jest.fn());

      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('updateUserDisplayName', () => {
    it('should update display name in Firestore', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateUserDisplayName('test-uid-123', 'New Name');

      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
        displayName: 'New Name',
      });
    });

    it('should propagate update errors', async () => {
      const mockError = new Error('Permission denied');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);

      await expect(
        updateUserDisplayName('test-uid-123', 'New Name'),
      ).rejects.toThrow('Permission denied');
    });
  });
});
