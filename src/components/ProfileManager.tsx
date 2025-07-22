
import { useState } from 'react';
import { Lock, LockOpen, Star, Trash2, Edit, Plus, Video, Play } from 'lucide-react';
import { Profile, ProfileImage, ProfileVideo } from '@/types/Profile';
import { compressImage } from '@/utils/imageUtils';
import { compressVideo, validateVideoFile, generateVideoThumbnail } from '@/utils/videoUtils';

interface ProfileManagerProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
}

const ProfileManager = ({ profile, onUpdate, onDelete }: ProfileManagerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editDescription, setEditDescription] = useState(profile.description);
  const [editPhotoPrice, setEditPhotoPrice] = useState(profile.photoPrice?.toString() || '4.99');
  const [editPackagePrice, setEditPackagePrice] = useState(profile.packagePrice?.toString() || '19.99');
  const [editVideoPrice, setEditVideoPrice] = useState(profile.videoPrice?.toString() || '9.99');
  const [editVideoPackagePrice, setEditVideoPackagePrice] = useState(profile.videoPackagePrice?.toString() || '39.99');
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
          isLocked: false,
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
          isLocked: false,
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

  const toggleImageLock = (imageId: string) => {
    const updatedImages = profile.images.map(img =>
      img.id === imageId ? { ...img, isLocked: !img.isLocked } : img
    );
    onUpdate({ ...profile, images: updatedImages });
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

  const toggleVideoLock = (videoId: string) => {
    const updatedVideos = profile.videos.map(vid =>
      vid.id === videoId ? { ...vid, isLocked: !vid.isLocked } : vid
    );
    onUpdate({ ...profile, videos: updatedVideos });
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
      description: editDescription,
      photoPrice: parseFloat(editPhotoPrice) || 4.99,
      packagePrice: parseFloat(editPackagePrice) || 19.99,
      videoPrice: parseFloat(editVideoPrice) || 9.99,
      videoPackagePrice: parseFloat(editVideoPackagePrice) || 39.99
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
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Single Photo Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPhotoPrice}
                    onChange={(e) => setEditPhotoPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Photo Package Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPackagePrice}
                    onChange={(e) => setEditPackagePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Single Video Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editVideoPrice}
                    onChange={(e) => setEditVideoPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Video Package Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editVideoPackagePrice}
                    onChange={(e) => setEditVideoPackagePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <span>Single Photo: ${profile.photoPrice?.toFixed(2) || '4.99'}</span><br/>
                  <span>Photo Package: ${profile.packagePrice?.toFixed(2) || '19.99'}</span>
                </div>
                <div>
                  <span>Single Video: ${profile.videoPrice?.toFixed(2) || '9.99'}</span><br/>
                  <span>Video Package: ${profile.videoPackagePrice?.toFixed(2) || '39.99'}</span>
                </div>
              </div>
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

      {/* Image Grid */}
      {profile.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {profile.images.map((image) => (
            <div
              key={image.id}
              className={`relative group rounded-lg overflow-hidden border-2 ${
                image.isCover ? 'border-yellow-400' : 'border-transparent'
              }`}
            >
              <div className="aspect-square">
                <img
                  src={image.url}
                  alt=""
                  className={`w-full h-full object-cover transition-all duration-200 ${
                    image.isLocked ? 'filter blur-sm' : ''
                  }`}
                />
              </div>

              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleImageLock(image.id)}
                    className={`p-2 rounded-full ${
                      image.isLocked
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white transition-colors`}
                    title={image.isLocked ? 'Unlock Image' : 'Lock Image'}
                  >
                    {image.isLocked ? <Lock size={16} /> : <LockOpen size={16} />}
                  </button>

                  <button
                    onClick={() => setCoverImage(image.id)}
                    className={`p-2 rounded-full ${
                      image.isCover
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                    } text-white transition-colors`}
                    title="Set as Cover"
                  >
                    <Star size={16} />
                  </button>

                  <button
                    onClick={() => removeImage(image.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                    title="Remove Image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="absolute top-2 left-2 flex gap-1">
                {image.isCover && (
                  <div className="bg-yellow-600 rounded-full p-1">
                    <Star size={12} className="text-white" />
                  </div>
                )}
                {image.isLocked && (
                  <div className="bg-red-600 rounded-full p-1">
                    <Lock size={12} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Grid */}
      {profile.videos.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-white mb-4">Videos</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {profile.videos.map((video) => (
              <div
                key={video.id}
                className={`relative group rounded-lg overflow-hidden border-2 ${
                  video.isCover ? 'border-yellow-400' : 'border-transparent'
                }`}
              >
                <div className="aspect-square">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt=""
                      className={`w-full h-full object-cover transition-all duration-200 ${
                        video.isLocked ? 'filter blur-sm' : ''
                      }`}
                    />
                  ) : (
                    <video
                      src={video.url}
                      className={`w-full h-full object-cover transition-all duration-200 ${
                        video.isLocked ? 'filter blur-sm' : ''
                      }`}
                      muted
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play size={24} className="text-white opacity-70" />
                  </div>
                </div>

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleVideoLock(video.id)}
                      className={`p-2 rounded-full ${
                        video.isLocked
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white transition-colors`}
                      title={video.isLocked ? 'Unlock Video' : 'Lock Video'}
                    >
                      {video.isLocked ? <Lock size={16} /> : <LockOpen size={16} />}
                    </button>

                    <button
                      onClick={() => setCoverVideo(video.id)}
                      className={`p-2 rounded-full ${
                        video.isCover
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-gray-600 hover:bg-gray-700'
                      } text-white transition-colors`}
                      title="Set as Cover"
                    >
                      <Star size={16} />
                    </button>

                    <button
                      onClick={() => removeVideo(video.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                      title="Remove Video"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {video.isCover && (
                    <div className="bg-yellow-600 rounded-full p-1">
                      <Star size={12} className="text-white" />
                    </div>
                  )}
                  {video.isLocked && (
                    <div className="bg-red-600 rounded-full p-1">
                      <Lock size={12} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-400">
        <div>
          <span>Total Images: {profile.images.length}</span><br/>
          <span>Locked Images: {profile.images.filter(img => img.isLocked).length}</span>
        </div>
        <div>
          <span>Total Videos: {profile.videos.length}</span><br/>
          <span>Locked Videos: {profile.videos.filter(vid => vid.isLocked).length}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;
