import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { Photo } from '../../store/collageStore';
import { addCacheBustToUrl } from '../../lib/supabase';
import { useCollageStore } from '../../store/collageStore';

type PhotoModerationModalProps = {
  key?: string; // Add key prop to force re-render
  photos: Photo[];
  onClose: () => void;
};

const PhotoModerationModal: React.FC<PhotoModerationModalProps> = ({ photos, onClose }) => {
  console.log('📸 PHOTO MODERATION MODAL RENDER', photos.length);
  
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { deletePhoto, fetchPhotosByCollageId } = useCollageStore();
  // Use a local copy of photos to avoid UI flicker during deletion
  const [localPhotos, setLocalPhotos] = useState<Photo[]>(photos);
  
  const collageId = photos.length > 0 ? photos[0].collage_id : null;

  // Update local photos when props change
  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  const handleDeletePhoto = async (photo: Photo) => {
    setDeletingPhotoId(photo.id);
    setError(null);

    // Close preview if this was the selected photo
    if (selectedPhoto?.id === photo.id) {
      setSelectedPhoto(null);
    }
    
    console.log('📸 MODAL: handleDeletePhoto called with ID:', photo.id);
    
    try {
      console.log('🗑️ Attempting to delete photo:', photo.id);
      console.log('📸 MODAL: Photos before deletion:', localPhotos.length);
      
      // Use the store's delete method
      await deletePhoto(photo.id);
      
      // Update local state immediately for better UX
      setLocalPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photo.id));
      
      console.log('📸 MODAL: Delete operation completed');
      console.log('📸 MODAL: Photos after deletePhoto call:', localPhotos.length);
      
      console.log('✅ Photo deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete photo:', error);
      setError(`Failed to delete photo: ${error.message}`);
    } finally {
      setDeletingPhotoId(null);
    }
  };
  
  const handleRefresh = async () => {
    if (!collageId) return;
    
    console.log('📸 MODAL: Manual refresh triggered for collage:', collageId);
    setRefreshing(true);
    setError(null);
    
    try {
      // Use the store's fetch method
      const result = await fetchPhotosByCollageId(collageId);
      console.log('📸 MODAL: Manual refresh completed');
      
      // Update local state with fresh data
      if (result) {
        setLocalPhotos(result);
      }
    } catch (err: any) {
      console.error('Failed to refresh photos:', err);
      setError(`Failed to refresh photos: ${err.message}`);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Photo Moderation</h2>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400">
              {photos.length} photos
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 mr-2 hover:bg-gray-800 rounded-full transition-colors"
              title="Refresh photos"
            >
              <RefreshCw className={`h-5 w-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-400" />
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

        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {localPhotos.length > 0 ? (
            localPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group aspect-[2/3] rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
                data-photo-id={photo.id}
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
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo);
                    }}
                    className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                    disabled={deletingPhotoId === photo.id}
                  >
                    {deletingPhotoId === photo.id ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-lg">No photos to moderate</p>
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