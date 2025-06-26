import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { Photo } from '../../store/collageStore';
import { addCacheBustToUrl } from '../../lib/supabase';
import { useCollageStore } from '../../store/collageStore';

type PhotoModerationModalProps = {
  photos: Photo[]; // This is now directly from the store
  onClose: () => void;
};

const PhotoModerationModal: React.FC<PhotoModerationModalProps> = ({ photos, onClose }) => {
  // Use local state for UI only, not for tracking photos
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get store methods directly - we don't need storePhotos since we're using the photos prop
  const { deletePhoto, fetchPhotosByCollageId } = useCollageStore();
  
  // Get collage ID from the first photo
  const collageId = photos.length > 0 ? photos[0].collage_id : null;

  // When photos prop changes, check if selected photo was deleted
  useEffect(() => {
    if (selectedPhoto && !photos.some(p => p.id === selectedPhoto.id)) {
      setSelectedPhoto(null);
    }
  }, [photos, selectedPhoto]);

  const handleDeletePhoto = async (photo: Photo) => {
    if (deletingPhotoId === photo.id) return;
    
    setDeletingPhotoId(photo.id);
    setError(null);
    
    try {
      console.log('🗑️ MODAL: Deleting photo:', photo.id.slice(-6));
      console.log('🗑️ MODAL: Current photos count before deletion:', photos.length);
      
      // Use the store's delete method
      await deletePhoto(photo.id);
      
      console.log('✅ MODAL: Photo deleted successfully from database');
      console.log('🗑️ MODAL: Photos should update via realtime subscription');
      
      // Close preview if this was the selected photo
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto(null);
      }
    } catch (error: any) {
      console.error('Failed to delete photo:', error);
      setError(`Failed to delete photo: ${error.message}`);
    } finally {
      setDeletingPhotoId(null);
    }
  };
  
  const handleRefresh = async () => {
    if (!collageId) return;

    console.log('📸 MODAL: Manual refresh triggered');
    setRefreshing(true);
    setError(null);
    
    try {
      // Use the store's fetch method
      await fetchPhotosByCollageId(collageId);
      console.log('📸 MODAL: Manual refresh completed');
    } catch (err: any) {
      console.error('Failed to refresh photos:', err);
      setError(`Failed to refresh photos: ${err.message}`);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // Use the photos from props, not from the store
  // This ensures we're working with the same array reference that the parent component passed
  const currentPhotos = photos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white/90">Photo Moderation</h2>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-white/70">
              {currentPhotos.length} photos
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 mr-2 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md"
              title="Refresh photos"
            >
              <RefreshCw className={`h-5 w-5 text-white/70 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md"
            >
              <X className="h-6 w-6 text-white/70" />
            </button>
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-sm text-red-200">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto max-h-[calc(90vh-120px)] bg-black/10 backdrop-blur-sm">
          {currentPhotos.length > 0 ? (
            currentPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group aspect-[2/3] rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-white/30 transition-all"
                onClick={() => setSelectedPhoto(photo)}
                data-photo-id={photo.id}
              >
                <img
                  src={addCacheBustToUrl(photo.url)}
                  alt="Collage photo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/300x450?text=Error+${photo.id.slice(-4)}`; 
                  }}
                />
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo);
                    }}
                    className="p-2 bg-white/20 border border-white/30 rounded-full hover:bg-white/30 transition-colors backdrop-blur-md"
                    disabled={deletingPhotoId === photo.id}
                  >
                    {deletingPhotoId === photo.id ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5 text-white/90" />
                    )}
                  </button>
                </div>
                
                {/* Photo ID for easier identification */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm text-xs text-white/90 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  ID: {photo.id.slice(-6)}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-white/60 bg-black/20 backdrop-blur-md rounded-lg border border-white/10">
              <AlertCircle className="h-12 w-12 mb-4 text-white/70" />
              <p className="text-lg text-white/80">No photos to moderate</p>
            </div>
          )}
        </div>

        {selectedPhoto && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={addCacheBustToUrl(selectedPhoto.url)}
                alt={`Photo ${selectedPhoto.id}`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://via.placeholder.com/800x1200?text=Error+${selectedPhoto.id.slice(-4)}`;
                }}
              />
              
              {/* Photo ID for debugging */}
              <div className="absolute top-4 left-4 bg-black/60 text-xs text-white p-1 rounded">
                ID: {selectedPhoto.id}
              </div>
              
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => handleDeletePhoto(selectedPhoto)}
                  className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                  disabled={deletingPhotoId === selectedPhoto.id}
                >
                  {deletingPhotoId === selectedPhoto.id ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            
            {/* Photo Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="text-white space-y-1">
                <p className="text-xs font-mono bg-black/40 px-1 py-0.5 rounded inline-block">
                  ID: {selectedPhoto.id}
                </p>
                <p className="text-sm">
                  Uploaded: {new Date(selectedPhoto.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoModerationModal;