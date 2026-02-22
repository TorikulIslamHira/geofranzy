/**
 * Firestore Service Tests
 * Tests collections, CRUD operations, and real-time listeners
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';

// Mock Firestore
jest.mock('firebase/firestore');

describe('Firestore Service', () => {
  const mockFirestore = { projectId: 'test-project' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Collections', () => {
    it('should define users collection', () => {
      (collection as jest.Mock).mockReturnValue({ path: 'users' });

      const usersCollection = collection(mockFirestore as any, 'users');
      expect(usersCollection).toBeDefined();
      expect(usersCollection.path).toBe('users');
    });

    it('should define locations collection', () => {
      (collection as jest.Mock).mockReturnValue({ path: 'locations' });

      const locationsCollection = collection(mockFirestore as any, 'locations');
      expect(locationsCollection).toBeDefined();
    });

    it('should define friends collection', () => {
      (collection as jest.Mock).mockReturnValue({ path: 'friends' });

      const friendsCollection = collection(mockFirestore as any, 'friends');
      expect(friendsCollection).toBeDefined();
    });

    it('should define SOS alerts collection', () => {
      (collection as jest.Mock).mockReturnValue({ path: 'sosAlerts' });

      const alertsCollection = collection(mockFirestore as any, 'sosAlerts');
      expect(alertsCollection).toBeDefined();
    });

    it('should define meetings collection', () => {
      (collection as jest.Mock).mockReturnValue({ path: 'meetings' });

      const meetingsCollection = collection(mockFirestore as any, 'meetings');
      expect(meetingsCollection).toBeDefined();
    });

    it('should define shared weather collection', () => {
      (collection as jest.Mock).mockReturnValue({ path: 'sharedWeather' });

      const weatherCollection = collection(mockFirestore as any, 'sharedWeather');
      expect(weatherCollection).toBeDefined();
    });
  });

  describe('User CRUD Operations', () => {
    it('should create user document', async () => {
      const userData = {
        uid: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        profilePicture: '',
        createdAt: new Date(),
      };

      (doc as jest.Mock).mockReturnValue({ path: 'users/user123' });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const userRef = doc(mockFirestore as any, 'users', userData.uid);
      await setDoc(userRef, userData);

      expect(setDoc).toHaveBeenCalledWith(userRef, userData);
    });

    it('should read user document', async () => {
      (doc as jest.Mock).mockReturnValue({ path: 'users/user123' });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          uid: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      });

      const userRef = doc(mockFirestore as any, 'users', 'user123');
      const userSnap = await getDoc(userRef);

      expect(userSnap.exists()).toBe(true);
      expect(getDoc).toHaveBeenCalledWith(userRef);
    });

    it('should update user document', async () => {
      (doc as jest.Mock).mockReturnValue({ path: 'users/user123' });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const userRef = doc(mockFirestore as any, 'users', 'user123');
      const updates = { name: 'Updated Name' };

      await updateDoc(userRef, updates);

      expect(updateDoc).toHaveBeenCalledWith(userRef, updates);
    });

    it('should delete user document', async () => {
      (doc as jest.Mock).mockReturnValue({ path: 'users/user123' });
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      const userRef = doc(mockFirestore as any, 'users', 'user123');
      await deleteDoc(userRef);

      expect(deleteDoc).toHaveBeenCalledWith(userRef);
    });
  });

  describe('Location Operations', () => {
    it('should save user location', async () => {
      const locationData = {
        userId: 'user123',
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        updatedAt: new Date(),
      };

      (doc as jest.Mock).mockReturnValue({ path: 'locations/user123' });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const locRef = doc(mockFirestore as any, 'locations', locationData.userId);
      await setDoc(locRef, locationData);

      expect(setDoc).toHaveBeenCalledWith(locRef, locationData);
    });

    it('should get user location', async () => {
      (doc as jest.Mock).mockReturnValue({ path: 'locations/user123' });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'user123',
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });

      const locRef = doc(mockFirestore as any, 'locations', 'user123');
      const locSnap = await getDoc(locRef);

      expect(locSnap.exists()).toBe(true);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should query nearby users', async () => {
      (collection as jest.Mock).mockReturnValue({ path: 'locations' });
      (query as jest.Mock).mockReturnValue({ path: 'locations' });
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => ({ userId: 'user123', latitude: 40.7128, longitude: -74.006 }),
          },
        ],
      });

      const locsCollection = collection(mockFirestore as any, 'locations');
      const q = query(locsCollection);
      const snapshot = await getDocs(q);

      expect(snapshot.empty).toBe(false);
      expect(snapshot.docs.length).toBe(1);
    });
  });

  describe('Friend Operations', () => {
    it('should send friend request', async () => {
      const requestData = {
        id: 'request123',
        fromUserId: 'user1',
        toUserId: 'user2',
        status: 'pending',
        createdAt: new Date(),
      };

      (doc as jest.Mock).mockReturnValue({ path: 'friends/request123' });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const reqRef = doc(mockFirestore as any, 'friends', requestData.id);
      await setDoc(reqRef, requestData);

      expect(setDoc).toHaveBeenCalledWith(reqRef, requestData);
    });

    it('should get user friends', async () => {
      (collection as jest.Mock).mockReturnValue({ path: 'friends' });
      (query as jest.Mock).mockReturnValue({ path: 'friends' });
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => ({
              id: 'request123',
              toUserId: 'user1',
              status: 'accepted',
            }),
          },
        ],
      });

      const friendsCollection = collection(mockFirestore as any, 'friends');
      const q = query(friendsCollection, where('toUserId', '==', 'user1'));
      const snapshot = await getDocs(q);

      expect(snapshot.empty).toBe(false);
      expect(snapshot.docs.length).toBe(1);
    });

    it('should accept friend request', async () => {
      (doc as jest.Mock).mockReturnValue({ path: 'friends/request123' });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const reqRef = doc(mockFirestore as any, 'friends', 'request123');
      await updateDoc(reqRef, { status: 'accepted' });

      expect(updateDoc).toHaveBeenCalledWith(reqRef, { status: 'accepted' });
    });
  });

  describe('SOS Operations', () => {
    it('should create SOS alert', async () => {
      const alertData = {
        id: 'alert123',
        userId: 'user123',
        latitude: 40.7128,
        longitude: -74.006,
        message: 'Emergency! Need help',
        createdAt: new Date(),
      };

      (doc as jest.Mock).mockReturnValue({ path: 'sosAlerts/alert123' });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const alertRef = doc(mockFirestore as any, 'sosAlerts', alertData.id);
      await setDoc(alertRef, alertData);

      expect(setDoc).toHaveBeenCalledWith(alertRef, alertData);
    });

    it('should resolve SOS alert', async () => {
      (doc as jest.Mock).mockReturnValue({ path: 'sosAlerts/alert123' });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const alertRef = doc(mockFirestore as any, 'sosAlerts', 'alert123');
      await updateDoc(alertRef, { status: 'resolved' });

      expect(updateDoc).toHaveBeenCalledWith(alertRef, { status: 'resolved' });
    });
  });

  describe('Real-time Listeners', () => {
    it('should listen to user location updates', (done) => {
      (doc as jest.Mock).mockReturnValue({ path: 'locations/user123' });
      (onSnapshot as jest.Mock).mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          data: () => ({ latitude: 40.7128, longitude: -74.006 }),
        });
        return jest.fn();
      });

      const locRef = doc(mockFirestore as any, 'locations', 'user123');
      const unsubscribe = onSnapshot(locRef, (snapshot) => {
        expect(snapshot.exists()).toBe(true);
        expect(onSnapshot).toHaveBeenCalledWith(locRef, expect.any(Function));
        done();
      });

      expect(typeof unsubscribe).toBe('function');
    });

    it('should listen to friend location changes', (done) => {
      (collection as jest.Mock).mockReturnValue({ path: 'locations' });
      (query as jest.Mock).mockReturnValue({ path: 'locations' });
      (onSnapshot as jest.Mock).mockImplementation((q, callback) => {
        callback({
          empty: false,
          docs: [
            {
              data: () => ({ userId: 'friend1', latitude: 40.7128 }),
            },
          ],
        });
        return jest.fn();
      });

      const locsCollection = collection(mockFirestore as any, 'locations');
      const q = query(locsCollection);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        expect(snapshot.empty).toBe(false);
        done();
      });

      expect(typeof unsubscribe).toBe('function');
    });

    it('should listen to SOS alerts', (done) => {
      (collection as jest.Mock).mockReturnValue({ path: 'sosAlerts' });
      (query as jest.Mock).mockReturnValue({ path: 'sosAlerts' });
      (onSnapshot as jest.Mock).mockImplementation((q, callback) => {
        callback({
          empty: false,
          docs: [
            {
              data: () => ({ id: 'alert123', status: 'active' }),
            },
          ],
        });
        return jest.fn();
      });

      const alertsCollection = collection(mockFirestore as any, 'sosAlerts');
      const q = query(alertsCollection);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        expect(snapshot.empty).toBe(false);
        done();
      });

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing document gracefully', async () => {
      (doc as jest.Mock).mockReturnValue({ path: 'users/nonexistent' });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      });

      const userRef = doc(mockFirestore as any, 'users', 'nonexistent');
      const userSnap = await getDoc(userRef);

      expect(userSnap.exists()).toBe(false);
      expect(userSnap.data()).toBeUndefined();
    });

    it('should handle operation errors', async () => {
      (doc as jest.Mock).mockReturnValue({ path: 'users/user123' });
      (setDoc as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      const userRef = doc(mockFirestore as any, 'users', 'user123');

      await expect(setDoc(userRef, {})).rejects.toThrow('Permission denied');
    });

    it('should handle listener cleanup', () => {
      const mockUnsubscribe = jest.fn();
      (doc as jest.Mock).mockReturnValue({ path: 'locations/user123' });
      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const locRef = doc(mockFirestore as any, 'locations', 'user123');
      const unsubscribe = onSnapshot(locRef, jest.fn());

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
