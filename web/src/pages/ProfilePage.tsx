import { useState, useEffect } from 'react';
import { useAuthStore } from '@store';
import { toggleGhostMode, updateUserProfile, getFriendsList, sendFriendRequest, getPendingFriendRequests, acceptFriendRequest, removeFriend } from '@services/firestoreService';
import type { UserLocation, FriendRequest } from '@types';
import toast from 'react-hot-toast';

function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [ghostMode, setGhostModeState] = useState(user?.ghostMode || false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [friends, setFriends] = useState<UserLocation[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadFriendsData();
  }, [user]);

  const loadFriendsData = async () => {
    if (!user) return;
    setLoadingFriends(true);
    try {
      const [friendsList, requests] = await Promise.all([
        getFriendsList(user.uid),
        getPendingFriendRequests(user.uid),
      ]);
      setFriends(friendsList);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleToggleGhost = async () => {
    if (!user) return;
    try {
      await toggleGhostMode(user.uid, !ghostMode);
      setGhostModeState(!ghostMode);
      setUser({ ...user, ghostMode: !ghostMode });
      toast.success(`Ghost mode ${!ghostMode ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to toggle ghost mode');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !displayName.trim()) return;
    try {
      await updateUserProfile(user.uid, { displayName });
      setUser({ ...user, displayName });
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !friendEmail.trim()) return;
    try {
      await sendFriendRequest(user.uid, friendEmail);
      toast.success('Friend request sent!');
      setFriendEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (friendId: string) => {
    if (!user) return;
    try {
      await acceptFriendRequest(user.uid, friendId);
      toast.success('Friend request accepted!');
      loadFriendsData();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await removeFriend(user.uid, friendId);
      toast.success('Friend removed');
      loadFriendsData();
    } catch (error) {
      toast.error('Failed to remove friend');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Profile</h1>

      <div className="space-y-6">
        {/* Profile Info */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field flex-1"
                />
                <button onClick={handleUpdateProfile} className="btn-primary">
                  Update
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="input-field bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Ghost Mode */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">👻 Ghost Mode</h3>
              <p className="text-sm text-gray-600">
                Hide your location from all friends
              </p>
            </div>
            <button
              onClick={handleToggleGhost}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                ghostMode ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  ghostMode ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Add Friend */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add Friend</h2>
          <form onSubmit={handleSendRequest} className="flex gap-2">
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="friend@email.com"
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary">
              Send Request
            </button>
          </form>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="card bg-blue-50">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Pending Friend Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white p-4 rounded-lg flex justify-between items-center"
                >
                  <span className="font-medium">Friend Request</span>
                  <button
                    onClick={() => handleAcceptRequest(request.userId)}
                    className="btn-primary text-sm"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Friends ({friends.length})
          </h2>
          {loadingFriends ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : friends.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No friends yet. Add some friends to get started!
            </p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.uid}
                  className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{friend.displayName}</p>
                    <p className="text-sm text-gray-600">
                      {friend.isGhostMode ? '👻 Ghost Mode' : '🟢 Active'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friend.uid)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
