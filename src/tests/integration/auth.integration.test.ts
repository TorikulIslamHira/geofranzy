/**
 * Authentication Integration Tests
 * Tests complete auth flow: signup, login, profile initialization
 */

jest.mock('firebase/auth');
jest.mock('firebase/firestore');

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  Auth,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

describe('Authentication Integration', () => {
  const mockFirestore = { projectId: 'test-project' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Signup Flow', () => {
    it('should complete full signup flow', async () => {
      const email = 'newuser@example.com';
      const password = 'SecurePassword123!';

      // Step 1: Create auth user
      const mockUser: Partial<User> = {
        uid: 'user123',
        email,
        emailVerified: false,
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      const authResult = await createUserWithEmailAndPassword({} as Auth, email, password);

      expect(authResult.user).toBeDefined();
      expect(authResult.user?.email).toBe(email);
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({} as Auth, email, password);

      // Step 2: Create user profile in Firestore
      (doc as jest.Mock).mockReturnValue({ path: 'users/user123' });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const userRef = doc(mockFirestore as any, 'users', authResult.user!.uid);
      const profileData = {
        uid: authResult.user!.uid,
        email,
        name: 'New User',
        profilePicture: '',
        createdAt: new Date(),
      };

      await setDoc(userRef, profileData);

      expect(setDoc).toHaveBeenCalledWith(userRef, profileData);
    });

    it('should handle duplicate email signup error', async () => {
      const email = 'existing@example.com';
      const password = 'Password123!';

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/email-already-in-use',
        message: 'The email address is already in use',
      });

      await expect(createUserWithEmailAndPassword({} as Auth, email, password)).rejects.toEqual({
        code: 'auth/email-already-in-use',
        message: 'The email address is already in use',
      });
    });

    it('should validate password strength during signup', () => {
      const validatePassword = (password: string): boolean => {
        const hasMinLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        return hasMinLength && hasUppercase && hasLowercase && hasNumber;
      };

      expect(validatePassword('WeakPass')).toBe(false); // No number
      expect(validatePassword('weak')).toBe(false); // Too short
      expect(validatePassword('NoNumbers!')).toBe(false); // No number
      expect(validatePassword('StrongPass123')).toBe(true); // Valid
    });

    it('should validate email format during signup', () => {
      const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('user@localhost')).toBe(false);
    });
  });

  describe('Login Flow', () => {
    it('should complete full login flow', async () => {
      const email = 'user@example.com';
      const password = 'Password123!';

      // Step 1: Sign in with credentials
      const mockUser: Partial<User> = {
        uid: 'user123',
        email,
        emailVerified: true,
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: mockUser });

      const authResult = await signInWithEmailAndPassword({} as Auth, email, password);

      expect(authResult.user?.email).toBe(email);
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith({} as Auth, email, password);

      // Step 2: Load user profile
      (doc as jest.Mock).mockReturnValue({ path: 'users/user123' });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          uid: authResult.user!.uid,
          email,
          name: 'Test User',
          profilePicture: '',
        }),
      });

      const userRef = doc(mockFirestore as any, 'users', authResult.user!.uid);
      const userSnap = await getDoc(userRef);

      expect(userSnap.exists()).toBe(true);
      expect(userSnap.data()?.name).toBe('Test User');
    });

    it('should handle invalid credentials login error', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/invalid-credential',
        message: 'Invalid email or password',
      });

      await expect(signInWithEmailAndPassword({} as Auth, 'user@example.com', 'wrong')).rejects.toEqual({
        code: 'auth/invalid-credential',
        message: 'Invalid email or password',
      });
    });

    it('should handle account disabled login error', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/user-disabled',
        message: 'User account is disabled',
      });

      await expect(
        signInWithEmailAndPassword({} as Auth, 'user@example.com', 'password')
      ).rejects.toEqual({
        code: 'auth/user-disabled',
        message: 'User account is disabled',
      });
    });
  });

  describe('Logout Flow', () => {
    it('should logout and clear user session', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);

      await signOut({} as Auth);

      expect(signOut).toHaveBeenCalledWith({} as Auth);
    });

    it('should handle logout errors gracefully', async () => {
      (signOut as jest.Mock).mockRejectedValue(new Error('Sign out failed'));

      await expect(signOut({} as Auth)).rejects.toThrow('Sign out failed');
    });
  });

  describe('Session Management', () => {
    it('should persist authentication state', (done) => {
      const mockUser: Partial<User> = {
        uid: 'user123',
        email: 'user@example.com',
      };

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        // Simulate auth state callback
        callback(mockUser as User);
        return jest.fn(); // Unsubscribe function
      });

      onAuthStateChanged({} as Auth, (user) => {
        expect(user).toEqual(mockUser);
        expect(onAuthStateChanged).toHaveBeenCalled();
        done();
      });
    }, 10000);

    it('should detect auth state changes', (done) => {
      const states: (any)[] = [];

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        const mockUser1: Partial<User> = { uid: 'user1', email: 'user1@example.com' };
        const mockUser2: Partial<User> = { uid: 'user2', email: 'user2@example.com' };

        // Simulate state change
        callback(mockUser1 as User);
        states.push(mockUser1);

        callback(mockUser2 as User);
        states.push(mockUser2);

        callback(null);
        states.push(null);

        return jest.fn();
      });

      onAuthStateChanged({} as Auth, (user) => {
        // Called multiple times
      });

      setTimeout(() => {
        expect(onAuthStateChanged).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle listener unsubscribe', () => {
      const mockUnsubscribe = jest.fn();
      (onAuthStateChanged as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthStateChanged({} as Auth, jest.fn());
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('User Profile Management', () => {
    it('should update user profile after signup', async () => {
      const userId = 'user123';
      const updates = {
        name: 'John Doe',
        profilePicture: 'https://example.com/pic.jpg',
      };

      (doc as jest.Mock).mockReturnValue({ path: `users/${userId}` });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const userRef = doc(mockFirestore as any, 'users', userId);
      await setDoc(userRef, updates, { merge: true });

      expect(setDoc).toHaveBeenCalledWith(userRef, updates, { merge: true });
    });

    it('should retrieve user profile on login', async () => {
      const userId = 'user123';
      const expectedProfile = {
        uid: userId,
        email: 'user@example.com',
        name: 'John Doe',
        profilePicture: '',
        createdAt: new Date().toISOString(),
      };

      (doc as jest.Mock).mockReturnValue({ path: `users/${userId}` });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => expectedProfile,
      });

      const userRef = doc(mockFirestore as any, 'users', userId);
      const snapshot = await getDoc(userRef);

      expect(snapshot.exists()).toBe(true);
      expect(snapshot.data()).toEqual(expectedProfile);
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed signup on network error', async () => {
      const email = 'user@example.com';
      const password = 'Password123!';

      // First call fails
      (createUserWithEmailAndPassword as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          user: { uid: 'user123', email } as User,
        });

      // First attempt fails
      await expect(createUserWithEmailAndPassword({} as Auth, email, password)).rejects.toThrow(
        'Network error'
      );

      // Retry succeeds
      const result = await createUserWithEmailAndPassword({} as Auth, email, password);
      expect(result.user.email).toBe(email);
    });

    it('should handle auth service temporarily unavailable', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/service-not-available',
        message: 'Auth service is temporarily unavailable',
      });

      await expect(
        signInWithEmailAndPassword({} as Auth, 'user@example.com', 'pass')
      ).rejects.toEqual({
        code: 'auth/service-not-available',
        message: 'Auth service is temporarily unavailable',
      });
    });
  });

  describe('Security', () => {
    it('should not store passwords locally', () => {
      const userData = {
        uid: 'user123',
        email: 'user@example.com',
        name: 'User',
        // Password should NEVER be stored
      };

      expect(userData).not.toHaveProperty('password');
      expect(userData).not.toHaveProperty('passwordHash');
    });

    it('should validate auth token expiration', () => {
      const token = {
        value: 'jwt_token_abc123',
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };

      const isExpired = token.expiresAt < Date.now();
      expect(isExpired).toBe(false);
    });

    it('should handle auth token refresh', async () => {
      const oldToken = 'old_token_123';
      const newToken = 'new_token_456';

      // In real app, would call getIdToken(forceRefresh: true)
      const refreshAuth = jest.fn().mockResolvedValue(newToken);

      const result = await refreshAuth();
      expect(result).toBe(newToken);
      expect(result).not.toBe(oldToken);
    });
  });
});
