import { vi } from 'vitest';

// Mock Firebase Auth
export const mockAuth = {
  currentUser: {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
  },
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
};

// Mock Firestore
export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  GeoPoint: vi.fn((lat: number, lng: number) => ({ latitude: lat, longitude: lng })),
};

// Mock Firebase Storage
export const mockStorage = {
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
};

// Mock Firebase module
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => mockFirestore),
  collection: mockFirestore.collection,
  doc: mockFirestore.doc,
  getDoc: mockFirestore.getDoc,
  getDocs: mockFirestore.getDocs,
  setDoc: mockFirestore.setDoc,
  updateDoc: mockFirestore.updateDoc,
  deleteDoc: mockFirestore.deleteDoc,
  query: mockFirestore.query,
  where: mockFirestore.where,
  orderBy: mockFirestore.orderBy,
  limit: mockFirestore.limit,
  onSnapshot: mockFirestore.onSnapshot,
  serverTimestamp: mockFirestore.serverTimestamp,
  GeoPoint: mockFirestore.GeoPoint,
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => mockStorage),
  ref: mockStorage.ref,
  uploadBytes: mockStorage.uploadBytes,
  getDownloadURL: mockStorage.getDownloadURL,
  deleteObject: mockStorage.deleteObject,
}));

export default {
  mockAuth,
  mockFirestore,
  mockStorage,
};
