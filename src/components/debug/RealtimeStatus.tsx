import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface RealtimeStatusProps {
  collageId?: string;
  showDetails?: boolean;
}

const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ collageId, showDetails = true }) => {
  const [status, setStatus] = useState<string>('Disconnected');
  const [events, setEvents] = useState<{type: string, time: string, id?: string}[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!collageId) return;

    console.log('🔍 DEBUG: Setting up realtime status monitor for collage:', collageId);
    
    // Set up realtime subscription
    const realtimeChannel = supabase
      .channel(`debug_photos_${collageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `collage_id=eq.${collageId}`
        },
        (payload) => {
          console.log('🔍 DEBUG: Realtime event received:', payload.eventType);
          
          const eventId = payload.new?.id || payload.old?.id;
          console.log('🔍 DEBUG: Event for ID:', eventId);
          
          // Add event to list
          setEvents(prev => [
            {
              type: payload.eventType, 
              time: new Date().toLocaleTimeString(),
              id: eventId
            },
            ...prev.slice(0, 9) // Keep only the last 10 events
          ]);
        }
      )
      .subscribe((status) => {
        console.log('🔍 DEBUG: Realtime status:', status);
        setStatus(status);
        
        // If we reconnect, clear events to start fresh
        if (status === 'SUBSCRIBED' && events.length > 0) {
          setEvents([{
            type: 'RECONNECTED',
            time: new Date().toLocaleTimeString()
          }]);
        }
      });

    setChannel(realtimeChannel);

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [collageId]);

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-white">Realtime Status</h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setEvents([])}
            className="text-xs text-gray-400 hover:text-white"
          >
            Clear
          </button>
          <div 
            className={`w-2 h-2 rounded-full ${
              status === 'SUBSCRIBED' ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <span className="text-xs text-gray-300">{status}</span>
        </div>
      </div>
      
      {events.length > 0 ? (
        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
          {events.map((event, index) => {
            const eventTypeColor = 
              event.type === 'INSERT' ? 'text-green-400' : 
              event.type === 'DELETE' ? 'text-red-400' : 
              event.type === 'RECONNECTED' ? 'text-yellow-400' :
              'text-blue-400';
            
            return (
              <div key={index} className="flex justify-between text-xs">
                <span className={eventTypeColor}>
                  {event.type}
                  {showDetails && event.id && (
                    <span className="text-gray-500 ml-1">
                      ({event.id.slice(-4)})
                    </span>
                  )}
                </span>
                <span className="text-gray-400">{event.time}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-gray-400 mt-2">
          No events received yet. Try uploading or deleting a photo.
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        Monitoring collage ID: {collageId || 'None'}
      </div>
    </div>
  );
};

export default RealtimeStatus;