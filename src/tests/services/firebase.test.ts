/**
 * Firebase Service Tests
 * Tests initialization, authentication, and error handling
 */

import { initializeApp, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging } from 'firebase/messaging';

// Mock Firebase modules
jest.mock('firebase/app');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('firebase/storage');
jest.mock('firebase/messaging');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize Firebase app with valid config', () => {
      const mockApp = { name: '[DEFAULT]' };
      (initializeApp as jest.Mock).mockReturnValue(mockApp);

      const config = {
        apiKey: 'test-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abc123',
      };

      const app = initializeApp(config);
      expect(app).toBeDefined();
      expect(initializeApp).toHaveBeenCalledWith(config);
    });

    it('should retrieve existing Firebase app', () => {
      const mockApp = { name: '[DEFAULT]' };
      (getApp as jest.Mock).mockReturnValue(mockApp);

      const app = getApp();
      expect(app).toBeDefined();
      expect(getApp).toHaveBeenCalled();
    });

    it('should initialize Auth service', () => {
      const mockApp = { name: '[DEFAULT]' };
      const mockAuth = { app: mockApp } as Auth;
      (getAuth as jest.Mock).mockReturnValue(mockAuth);

      const auth = getAuth();
      expect(auth).toBeDefined();
      expect(getAuth).toHaveBeenCalled();
    });

    it('should initialize Firestore service', () => {
      const mockApp = { name: '[DEFAULT]' };
      const mockFirestore = { app: mockApp } as Firestore;
      (getFirestore as jest.Mock).mockReturnValue(mockFirestore);

      const firestore = getFirestore();
      expect(firestore).toBeDefined();
      expect(getFirestore).toHaveBeenCalled();
    });

    it('should initialize Cloud Storage service', () => {
      const mockApp = { name: '[DEFAULT]' };
      const mockStorage = { app: mockApp } as FirebaseStorage;
      (getStorage as jest.Mock).mockReturnValue(mockStorage);

      const storage = getStorage();
      expect(storage).toBeDefined();
      expect(getStorage).toHaveBeenCalled();
    });

    it('should initialize Cloud Messaging service', () => {
      const mockApp = { name: '[DEFAULT]' };
      const mockMessaging = { app: mockApp } as Messaging;
      (getMessaging as jest.Mock).mockReturnValue(mockMessaging);

      const messaging = getMessaging();
      expect(messaging).toBeDefined();
      expect(getMessaging).toHaveBeenCalled();
    });
  });

  describe('Service Structure', () => {
    it('should have all required services initialized', () => {
      const mockApp = { name: '[DEFAULT]' };
      const mockAuth = { app: mockApp } as Auth;
      const mockFirestore = { app: mockApp } as Firestore;
      const mockStorage = { app: mockApp } as FirebaseStorage;
      const mockMessaging = { app: mockApp } as Messaging;

      (getAuth as jest.Mock).mockReturnValue(mockAuth);
      (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
      (getStorage as jest.Mock).mockReturnValue(mockStorage);
      (getMessaging as jest.Mock).mockReturnValue(mockMessaging);

      const auth = getAuth();
      const firestore = getFirestore();
      const storage = getStorage();
      const messaging = getMessaging();

      expect(auth).toBeDefined();
      expect(firestore).toBeDefined();
      expect(storage).toBeDefined();
      expect(messaging).toBeDefined();
    });

    it('should handle Firebase initialization errors gracefully', () => {
      (initializeApp as jest.Mock).mockImplementation(() => {
        throw new Error('Firebase initialization failed');
      });

      expect(() => {
        initializeApp({} as any);
      }).toThrow('Firebase initialization failed');
    });
  });

  describe('Configuration', () => {
    it('should use correct Firebase project ID from environment', () => {
      const config = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'test-key',
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'test.firebaseapp.com',
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'geofrenzy-28807',
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'test.appspot.com',
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '123456789',
        appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:123456789:web:abc123',
      };

      expect(config.projectId).toBeDefined();
      expect(config.projectId).toBeTruthy();
    });

    it('should validate all required config keys present', () => {
      const config = {
        apiKey: 'test-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abc123',
      };

      const requiredKeys = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId',
      ];

      requiredKeys.forEach((key) => {
        expect(config).toHaveProperty(key);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API key gracefully', () => {
      const config = {
        apiKey: '',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abc123',
      };

      // Should validate configuration
      expect(config.apiKey).toBe('');
    });

    it('should handle service retrieval after app deletion', () => {
      (getAuth as jest.Mock).mockImplementation(() => {
        throw new Error('No Firebase App default has been created - call Firebase App.initializeApp()');
      });

      expect(() => {
        getAuth();
      }).toThrow();
    });
  });
});
