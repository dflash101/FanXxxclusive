import { useState } from 'react';
import { Star, Trash2, Edit, Plus, Video, Play, X } from 'lucide-react';
import { Profile, ProfileImage, ProfileVideo } from '@/types/Profile';
import { compressImage } from '@/utils/imageUtils';
import { compressVideo, validateVideoFile, generateVideoThumbnail } from '@/utils/videoUtils';
import { Button } from '@/components/ui/button';

interface ProfileManagerProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
}

const ProfileManager = ({ profile, onUpdate, onDelete }: ProfileManagerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editDescription, setEditDescription] = useState(profile.description);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const compressedUrl = await compressImage(file);
        const newImage: ProfileImage = {
          id: Date.now().toString() + Math.random(),
          url: compressedUrl,
          isCover: profile.images.length === 0
        };

        onUpdate({
          ...profile,
          images: [...profile.images, newImage]
        });
      } catch (error) {
        console.error('Failed to process image:', error);
      }
    }
    
    setIsUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        validateVideoFile(file);
        const compressedVideo = await compressVideo(file);
        const thumbnail = await generateVideoThumbnail(compressedVideo);
        
        const newVideo: ProfileVideo = {
          id: Date.now().toString() + Math.random(),
          url: URL.createObjectURL(compressedVideo),
          isCover: profile.videos.length === 0,
          thumbnail
        };

        onUpdate({
          ...profile,
          videos: [...profile.videos, newVideo]
        });
      } catch (error) {
        console.error('Failed to process video:', error);
      }
    }
    
    setIsUploading(false);
  };

  const setCoverImage = (imageId: string) => {
    const updatedImages = profile.images.map(img => ({
      ...img,
      isCover: img.id === imageId
    }));
    onUpdate({ ...profile, images: updatedImages });
  };

  const removeImage = (imageId: string) => {
    const updatedImages = profile.images.filter(img => img.id !== imageId);
    onUpdate({ ...profile, images: updatedImages });
  };

  const setCoverVideo = (videoId: string) => {
    const updatedVideos = profile.videos.map(vid => ({
      ...vid,
      isCover: vid.id === videoId
    }));
    onUpdate({ ...profile, videos: updatedVideos });
  };

  const removeVideo = (videoId: string) => {
    const updatedVideos = profile.videos.filter(vid => vid.id !== videoId);
    onUpdate({ ...profile, videos: updatedVideos });
  };

  const handleSaveEdit = () => {
    onUpdate({
      ...profile,
      name: editName,
      description: editDescription
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
      {/* Profile Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Profile name"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Profile description"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">{profile.name}</h3>
              <p className="text-gray-400 mb-2">{profile.description}</p>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => onDelete(profile.id)}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Media Upload */}
      <div className="mb-6 flex gap-4">
        <label className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg cursor-pointer hover:from-purple-700 hover:to-blue-700 transition-all duration-200 ${isUploading ? 'opacity-50' : ''}`}>
          <Plus size={18} />
          {isUploading ? 'Processing...' : 'Add Images'}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
        <label className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg cursor-pointer hover:from-green-700 hover:to-teal-700 transition-all duration-200 ${isUploading ? 'opacity-50' : ''}`}>
          <Video size={18} />
          {isUploading ? 'Processing...' : 'Add Videos'}
          <input
            type="file"
            multiple
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Images Section */}
      {profile.images.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-4">Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {profile.images.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square">
                  <img
                    src={image.url}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {image.isCover && (
                    <div className="absolute top-2 left-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded">
                      Cover
                    </div>
                  )}
                  <button
                    onClick={() => setCoverImage(image.id)}
                    className="absolute top-2 right-8 bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-yellow-700 transition-colors opacity-0 group-hover:opacity-100"
                    title="Set as Cover"
                  >
                    <Star size={12} />
                  </button>
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos Section */}
      {profile.videos.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-4">Videos</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {profile.videos.map((video, index) => (
              <div key={video.id} className="relative group">
                <div className="aspect-square">
                  <video
                    src={video.url}
                    className="w-full h-full object-cover rounded-lg"
                    controls
                    preload="metadata"
                  />
                  <button
                    onClick={() => setCoverVideo(video.id)}
                    className="absolute top-2 right-8 bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-yellow-700 transition-colors opacity-0 group-hover:opacity-100"
                    title="Set as Cover"
                  >
                    <Star size={12} />
                  </button>
                  <button
                    onClick={() => removeVideo(video.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="border-t border-gray-700 pt-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400 space-y-1">
            <p>Total Images: {profile.images.length}</p>
            <p>Total Videos: {profile.videos.length}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              size="sm"
            >
              <Edit size={16} className="mr-1" />
              Edit
            </Button>
            <Button
              onClick={() => onDelete(profile.id)}
              variant="destructive"
              size="sm"
            >
              <Trash2 size={16} className="mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;