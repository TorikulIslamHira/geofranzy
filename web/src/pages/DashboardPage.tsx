import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore, useLocationStore, useSOSStore } from '@store';
import { useLocation } from '@hooks/useLocation';
import { getFriendsList, getActiveSOSAlerts, subscribeToSOSAlerts } from '@services/firestoreService';
import { calculateDistance, formatDistance } from '@utils/location';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue with webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function DashboardPage() {
  const { user } = useAuthStore();
  const { currentLocation, friendsLocations } = useLocationStore();
  const { activeAlerts, setActiveAlerts } = useSOSStore();
  const { } = useLocation(); // Initialize location tracking
  const [stats, setStats] = useState({
    totalFriends: 0,
    nearbyFriends: 0,
    activeAlerts: 0,
  });

  useEffect(() => {
    if (!user) return;

    // Load initial data
    const loadData = async () => {
      try {
        const friends = await getFriendsList(user.uid);
        const alerts = await getActiveSOSAlerts();
        
        const nearbyCount = currentLocation
          ? friends.filter((friend) => {
              const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                friend.latitude,
                friend.longitude
              );
              return distance <= 500;
            }).length
          : 0;

        setStats({
          totalFriends: friends.length,
          nearbyFriends: nearbyCount,
          activeAlerts: alerts.length,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();

    // Subscribe to SOS alerts
    const unsubscribe = subscribeToSOSAlerts((alerts) => {
      setActiveAlerts(alerts);
      setStats((prev) => ({ ...prev, activeAlerts: alerts.length }));
      
      if (alerts.length > 0) {
        const latestAlert = alerts[0];
        if (latestAlert.timestamp > Date.now() - 5000) {
          toast.error(`🆘 ${latestAlert.userName} sent an SOS alert!`, {
            duration: 10000,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [user, currentLocation, setActiveAlerts]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">Total Friends</p>
              <p className="text-4xl font-bold mt-2">{stats.totalFriends}</p>
            </div>
            <div className="text-primary-200 text-5xl">👥</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Nearby Friends</p>
              <p className="text-4xl font-bold mt-2">{stats.nearbyFriends}</p>
            </div>
            <div className="text-green-200 text-5xl">📍</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Active SOS Alerts</p>
              <p className="text-4xl font-bold mt-2">{stats.activeAlerts}</p>
            </div>
            <div className="text-red-200 text-5xl">🆘</div>
          </div>
        </div>
      </div>

      {/* Quick Map Preview */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Location</h2>
        {currentLocation ? (
          <div className="h-96 rounded-lg overflow-hidden">
            <MapContainer
              center={[currentLocation.latitude, currentLocation.longitude]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[currentLocation.latitude, currentLocation.longitude]}>
                <Popup>Your Location</Popup>
              </Marker>
              <Circle
                center={[currentLocation.latitude, currentLocation.longitude]}
                radius={500}
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
              />
              {friendsLocations.map((friend) => (
                <Marker
                  key={friend.uid}
                  position={[friend.latitude, friend.longitude]}
                >
                  <Popup>
                    <div>
                      <p className="font-bold">{friend.displayName}</p>
                      <p className="text-sm">
                        {formatDistance(
                          calculateDistance(
                            currentLocation.latitude,
                            currentLocation.longitude,
                            friend.latitude,
                            friend.longitude
                          )
                        )}{' '}
                        away
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        ) : (
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600">Getting your location...</p>
              <p className="text-sm text-gray-500 mt-2">
                Please allow location access in your browser
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="card mt-6 bg-red-50 border-2 border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-4">🆘 Active SOS Alerts</h2>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white p-4 rounded-lg border border-red-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-red-800">{alert.userName}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${alert.location.latitude},${alert.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm"
                  >
                    View on Map
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
