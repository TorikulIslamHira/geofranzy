import { useState, useEffect } from 'react';
import { useAuthStore } from '@store';
import { getMeetingHistory } from '@services/firestoreService';
import type { MeetingRecord } from '@types';
import { formatDistance } from '@utils/location';

function HistoryPage() {
  const { user } = useAuthStore();
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    try {
      const history = await getMeetingHistory(user.uid);
      setMeetings(history);
    } catch (error) {
      console.error('Error loading meeting history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Meeting History</h1>

      {meetings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-xl text-gray-600 mb-2">No meetings yet</p>
          <p className="text-sm text-gray-500">
            Meetings are automatically logged when you're near friends for 5+ minutes
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => {
            const friendName =
              meeting.user1Id === user?.uid
                ? meeting.user2Name
                : meeting.user1Name;
            const meetingDate = new Date(meeting.meetingTime);

            return (
              <div key={meeting.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-primary-100 p-3 rounded-full">
                      <svg
                        className="w-6 h-6 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Met with {friendName}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>
                          📅{' '}
                          {meetingDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p>🕐 {meetingDate.toLocaleTimeString()}</p>
                        {meeting.duration && (
                          <p>⏱️ Duration: {formatDuration(meeting.duration)}</p>
                        )}
                        <p>
                          📍 Location: {meeting.location.latitude.toFixed(4)},{' '}
                          {meeting.location.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps?q=${meeting.location.latitude},${meeting.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm whitespace-nowrap"
                  >
                    View on Map
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meetings.length > 0 && (
        <div className="card mt-6 bg-blue-50">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Total meetings recorded:</span> {meetings.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Meetings are automatically logged when you're within 50m of a friend for 5+ minutes
          </p>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
