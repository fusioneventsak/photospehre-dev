import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Trash, Plus, AlertTriangle, X } from 'lucide-react';

interface RealtimeDebugPanelProps {
  collageId?: string;
  onClose?: () => void;
}

const RealtimeDebugPanel: React.FC<RealtimeDebugPanelProps> = ({ collageId, onClose }) => {
  const [status, setStatus] = useState<string>('Disconnected');
  const [events, setEvents] = useState<{type: string, time: string, id?: string}[]>([]);
  const [channel, setChannel] = useState<any>(null);
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!collageId) {
      console.log('🔍 DEBUG PANEL: No collage ID provided');
      return;
    }

    console.log('🔍 DEBUG PANEL: Setting up realtime monitor for collage:', collageId);
    
    // Use a unique channel name with timestamp to avoid conflicts with main subscription
    const channelName = `debug_photos_${collageId}_${Date.now()}`;
    console.log('🔍 DEBUG PANEL: Creating channel:', channelName);

    // Clear any existing events when setting up a new subscription
    setEvents([]);
    
    // Set up realtime subscription
    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `collage_id=eq.${collageId}`
        },
        (payload) => {
          console.log('🔍 DEBUG PANEL: EVENT RECEIVED:', payload.eventType);
          
          const eventId = payload.new?.id || payload.old?.id;
          console.log('🔍 DEBUG PANEL: Event for ID:', eventId?.slice(-6), 'Type:', payload.eventType);
          
          // Update photo count based on event type
          if (payload.eventType === 'INSERT') {
            console.log('🔍 DEBUG PANEL: Photo added, incrementing count');
            setPhotoCount(count => count + 1);
          } else if (payload.eventType === 'DELETE') {
            console.log('🔍 DEBUG PANEL: Photo deleted, decrementing count');
            setPhotoCount(count => Math.max(0, count - 1));
          }
          
          // Add event to list
          setEvents(prev => [
            {
              type: payload.eventType,
              time: new Date().toLocaleTimeString(),
              id: eventId
            },
            ...prev.slice(0, 19) // Keep only the last 20 events
          ]);
        }
      )
      .subscribe((status) => {
        console.log('🔍 DEBUG PANEL: Subscription status changed to:', status);
        setStatus(status);

        // Get initial photo count when connected
        if (status === 'SUBSCRIBED') {
          console.log('🔍 DEBUG PANEL: Subscription active, fetching initial photo count');
          supabase
            .from('photos')
            .select('count', { count: 'exact', head: true })
            .eq('collage_id', collageId)
            .then(({ count, error }) => {
              if (!error && count !== null) {
                console.log('🔍 DEBUG PANEL: Initial photo count:', count);
                setPhotoCount(count);
              } else if (error) {
                console.error('🔍 DEBUG PANEL: Error fetching photo count:', error);
                setLastError(`Error fetching count: ${error.message}`);
              }
            });
        }
        
        // If we reconnect, add a reconnection event
        if (status === 'SUBSCRIBED') {
          console.log('🔍 DEBUG PANEL: Reconnected, adding reconnection event');
          setEvents(prevEvents => [{
            type: 'RECONNECTED',
            time: new Date().toLocaleTimeString()
          }, ...prevEvents]);
        }
      });

    setChannel(realtimeChannel);

    return () => {
      console.log('🔍 DEBUG PANEL: Cleaning up subscription');
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [collageId]);

  return (
    <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md p-3 flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="font-medium text-white/90 text-sm">Realtime Debug</h3>
          <div className={`ml-2 w-2 h-2 rounded-full ${
            status === 'SUBSCRIBED' ? 'bg-green-500/80' : 'bg-yellow-500/80'
          }`} />
          <span className="ml-2 text-xs text-white/70">{status}</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded backdrop-blur-md"
          >
            <X size={14} />
          </button>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="px-3 py-2 bg-white/5 backdrop-blur-md flex justify-between items-center text-xs">
        <div className="text-white/70">Channel: {channel?.topic?.slice(0, 20) || 'None'}{channel?.topic?.length > 20 ? '...' : ''}</div>
        <div className="text-white/70">Photos: {photoCount}</div>
      </div>
      
      {/* Error Display */}
      {lastError && (
        <div className="p-2 bg-red-500/20 backdrop-blur-md border-t border-b border-red-500/30 text-xs text-red-200 flex items-start">
          <AlertTriangle size={12} className="mr-1 mt-0.5 flex-shrink-0" />
          <div className="flex-1">{lastError}</div>
        </div>
      )}
      
      {/* Events List */}
      <div className="max-h-60 overflow-y-auto p-2 space-y-1 bg-black/20 backdrop-blur-sm">
        {events.length > 0 ? (
          events.map((event, index) => {
            const eventTypeColor = 
              event.type === 'INSERT' ? 'text-green-400/90' : 
              event.type === 'DELETE' ? 'text-red-400/90' : 
              event.type === 'RECONNECTED' ? 'text-yellow-400/90' :
              'text-blue-400/90';
            
            const EventIcon = 
              event.type === 'INSERT' ? Plus :
              event.type === 'DELETE' ? Trash :
              event.type === 'RECONNECTED' ? RefreshCw :
              AlertTriangle;
            
            return (
              <div key={index} className="flex justify-between text-xs bg-white/10 backdrop-blur-md p-1.5 rounded border border-white/5">
                <div className={`flex items-center ${eventTypeColor}`}>
                  <EventIcon size={12} className="mr-1" />
                  <span>{event.type}</span>
                  {event.id && (
                    <span className="text-white/60 ml-1">
                      ({event.id.slice(-6)})
                    </span>
                  )}
                </div>
                <span className="text-white/60">{event.time}</span>
              </div>
            );
          })
        ) : (
          <div className="text-xs text-white/60 text-center py-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
            No events received yet. Try uploading or deleting a photo.
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-2 bg-white/5 backdrop-blur-md border-t border-white/10 flex justify-between items-center text-xs">
        <span className="text-white/60">
          Collage: {collageId ? collageId.slice(0, 8) + '...' : 'None'}
        </span>
        <button 
          onClick={() => setEvents([])}
          className="text-white/60 hover:text-white text-xs bg-white/10 px-2 py-1 rounded-full backdrop-blur-md"
        >
          Clear Events
        </button>
      </div>
    </div>
  );
};

export default RealtimeDebugPanel;