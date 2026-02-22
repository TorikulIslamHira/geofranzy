import { useState, useEffect } from 'react';
import { useAuthStore, useLocationStore } from '@store';
import { broadcastSOS, resolveSOSAlert, getActiveSOSAlerts } from '@services/firestoreService';
import type { SOSAlert } from '@types';
import toast from 'react-hot-toast';

function SOSPage() {
  const { user } = useAuthStore();
  const { currentLocation } = useLocationStore();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<SOSAlert[]>([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const alerts = await getActiveSOSAlerts();
      setActiveAlerts(alerts.filter((alert) => alert.userId === user?.uid));
    } catch (error) {
      console.error('Error loading SOS alerts:', error);
    }
  };

  const handleSendSOS = async () => {
    if (!user || !currentLocation) {
      toast.error('Location not available');
      return;
    }

    setLoading(true);
    try {
      await broadcastSOS(
        user.uid,
        user.displayName,
        currentLocation.latitude,
        currentLocation.longitude,
        message || 'Emergency SOS Alert!'
      );
      toast.success('🆘 SOS Alert sent to all friends!');
      setMessage('');
      loadAlerts();
    } catch (error) {
      toast.error('Failed to send SOS');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveSOSAlert(alertId);
      toast.success('SOS Alert resolved');
      loadAlerts();
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">🆘 Emergency SOS</h1>

      {/* Send SOS Card */}
      <div className="card bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 mb-8">
        <h2 className="text-2xl font-bold text-red-800 mb-4">Send Emergency Alert</h2>
        <p className="text-gray-700 mb-6">
          Click the button below to send an emergency SOS alert to all your friends with your current location.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Optional Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="Describe your emergency (optional)..."
          />
        </div>

        <button
          onClick={handleSendSOS}
          disabled={loading || !currentLocation}
          className="btn-danger w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '🆘 Sending SOS...' : '🆘 SEND SOS ALERT'}
        </button>

        {!currentLocation && (
          <p className="text-sm text-red-600 mt-2 text-center">
            Waiting for location...
          </p>
        )}
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Active Alerts</h2>
          <div className="space-y-4">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-red-50 p-4 rounded-lg border border-red-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-red-800">Emergency Alert</p>
                    <p className="text-sm text-gray-700">{alert.message}</p>
                  </div>
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="btn-secondary text-sm"
                  >
                    Mark Resolved
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  <p>Sent: {new Date(alert.timestamp).toLocaleString()}</p>
                  <p>
                    Location: {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                  </p>
                  {alert.recipients && (
                    <p>Notified: {alert.recipients.length} friend(s)</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Tips */}
      <div className="card mt-6 bg-blue-50">
        <h3 className="font-bold text-blue-800 mb-3">Safety Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Call emergency services (911) for immediate danger</li>
          <li>• SOS alerts are sent to ALL your friends simultaneously</li>
          <li>• Your exact location will be shared with your friends</li>
          <li>• Mark alert as resolved when you're safe</li>
          <li>• Friends can see your location on the map</li>
        </ul>
      </div>
    </div>
  );
}

export default SOSPage;
