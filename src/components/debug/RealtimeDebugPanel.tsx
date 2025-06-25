import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Trash, Plus, AlertTriangle, CheckCircle, X } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(true);
  const [pingTime, setPingTime] = useState<number | null>(null);
  const [pingInterval, setPingInterval] = useState<NodeJS.Timeout | null>(null);

  // Test ping to Supabase
  const testConnection = async () => {
    try {
      const startTime = Date.now();
      const { data } = await supabase.from('photos').select('count', { count: 'exact', head: true });
      const endTime = Date.now();
      setPingTime(endTime - startTime);
      setLastError(null);
    } catch (error: any) {
      setLastError(error.message);
      setPingTime(null);
    }
  };

  useEffect(() => {
    // Start periodic ping
    const interval = setInterval(testConnection, 10000);
    setPingInterval(interval);
    
    // Initial ping
    testConnection();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!collageId) return;

    console.log('🔍 DEBUG PANEL: Setting up realtime monitor for collage:', collageId);
    
    // Set up realtime subscription
    const realtimeChannel = supabase
      .channel(`debug_photos_${collageId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `collage_id=eq.${collageId}`
        },
        (payload) => {
          console.log('🔍 DEBUG PANEL: Realtime event received:', payload.eventType);
          
          const eventId = payload.new?.id || payload.old?.id;
          console.log('🔍 DEBUG PANEL: Event for ID:', eventId, 'Type:', payload.eventType);
          
          // Update photo count based on event type
          if (payload.eventType === 'INSERT') {
            setPhotoCount(prev => prev + 1);
          } else if (payload.eventType === 'DELETE') {
            setPhotoCount(prev => Math.max(0, prev - 1));
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
        console.log('🔍 DEBUG PANEL: Realtime status:', status);
        setStatus(status);

        // Get initial photo count when connected
        if (status === 'SUBSCRIBED') {
          supabase
            .from('photos')
            .select('count', { count: 'exact', head: true })
            .eq('collage_id', collageId)
            .then(({ count, error }) => {
              if (!error && count !== null) {
                setPhotoCount(count);
              }
            });
        }
        
        // If we reconnect, add a reconnection event
        if (status === 'SUBSCRIBED' && events.length > 0) {
          setEvents(prev => [{
            type: 'RECONNECTED',
            time: new Date().toLocaleTimeString()
          }, ...prev]);
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
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 p-3 flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="font-medium text-white text-sm">Realtime Debug</h3>
          <div className={`ml-2 w-2 h-2 rounded-full ${
            status === 'SUBSCRIBED' ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={testConnection}
            className="text-gray-400 hover:text-white p-1 rounded"
            title="Test connection"
          >
            <RefreshCw size={14} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            {isExpanded ? '▼' : '▲'}
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <>
          {/* Status Bar */}
          <div className="px-3 py-2 bg-gray-800/50 flex justify-between items-center text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">Status: {status}</span>
              {pingTime !== null && (
                <span className="text-gray-400">
                  Ping: {pingTime}ms
                </span>
              )}
            </div>
            <div className="text-gray-300">
              Photos: {photoCount}
            </div>
          </div>
          
          {/* Error Display */}
          {lastError && (
            <div className="p-2 bg-red-900/30 border-t border-b border-red-900/50 text-xs text-red-300 flex items-start">
              <AlertTriangle size={12} className="mr-1 mt-0.5 flex-shrink-0" />
              <div className="flex-1">{lastError}</div>
            </div>
          )}
          
          {/* Events List */}
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {events.length > 0 ? (
              events.map((event, index) => {
                const eventTypeColor = 
                  event.type === 'INSERT' ? 'text-green-400' : 
                  event.type === 'DELETE' ? 'text-red-400' : 
                  event.type === 'RECONNECTED' ? 'text-yellow-400' :
                  'text-blue-400';
                
                const EventIcon = 
                  event.type === 'INSERT' ? Plus :
                  event.type === 'DELETE' ? Trash :
                  event.type === 'RECONNECTED' ? RefreshCw :
                  CheckCircle;
                
                return (
                  <div key={index} className="flex justify-between text-xs bg-gray-800/30 p-1.5 rounded">
                    <div className={`flex items-center ${eventTypeColor}`}>
                      <EventIcon size={12} className="mr-1" />
                      <span>{event.type}</span>
                      {event.id && (
                        <span className="text-gray-400 ml-1">
                          ({event.id.slice(-4)})
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400">{event.time}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-gray-400 text-center py-4">
                No events received yet
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-2 bg-gray-800/50 border-t border-gray-700 flex justify-between items-center text-xs">
            <span className="text-gray-400">
              Collage: {collageId ? collageId.slice(0, 8) + '...' : 'None'}
            </span>
            <button 
              onClick={() => setEvents([])}
              className="text-gray-400 hover:text-white text-xs"
            >
              Clear Events
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RealtimeDebugPanel;