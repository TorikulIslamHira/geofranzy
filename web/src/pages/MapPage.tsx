import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useLocationStore } from '@store';
import { useLocation } from '@hooks/useLocation';
import { calculateDistance, formatDistance } from '@utils/location';

function MapPage() {
  const { currentLocation, friendsLocations } = useLocationStore();
  useLocation();

  if (!currentLocation) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="card h-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Map</h1>
          <div className="text-sm text-gray-600">
            {friendsLocations.length} friend{friendsLocations.length !== 1 ? 's' : ''} visible
          </div>
        </div>

        <div className="h-[calc(100%-4rem)] rounded-lg overflow-hidden">
          <MapContainer
            center={[currentLocation.latitude, currentLocation.longitude]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* User's location */}
            <Marker position={[currentLocation.latitude, currentLocation.longitude]}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold">📍 You are here</p>
                </div>
              </Popup>
            </Marker>

            {/* Proximity circle (500m) */}
            <Circle
              center={[currentLocation.latitude, currentLocation.longitude]}
              radius={500}
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
            />

            {/* Friends' locations */}
            {friendsLocations.map((friend) => {
              if (friend.isGhostMode) return null;

              const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                friend.latitude,
                friend.longitude
              );

              return (
                <Marker
                  key={friend.uid}
                  position={[friend.latitude, friend.longitude]}
                  icon={L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                  })}
                >
                  <Popup>
                    <div>
                      <p className="font-bold text-primary-700">{friend.displayName}</p>
                      <p className="text-sm text-gray-600">
                        {formatDistance(distance)} away
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last seen: {new Date(friend.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default MapPage;
