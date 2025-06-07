
import { useState } from 'react';
import { Lock, LockOpen, Star, Trash2, Edit, Plus } from 'lucide-react';
import { Profile, ProfileImage } from '@/types/Profile';
import { compressImage } from '@/utils/imageUtils';

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
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
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
              <p className="text-gray-400">{profile.description}</p>
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

      {/* Image Upload */}
      <div className="mb-6">
        <label className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg cursor-pointer hover:from-purple-700 hover:to-blue-700 transition-all duration-200 w-fit ${isUploading ? 'opacity-50' : ''}`}>
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

      {/* Stats */}
      <div className="mt-6 flex gap-4 text-sm text-gray-400">
        <span>Total Images: {profile.images.length}</span>
        <span>Locked: {profile.images.filter(img => img.isLocked).length}</span>
        <span>Cover: {profile.images.find(img => img.isCover)?.id ? 'Set' : 'None'}</span>
      </div>
    </div>
  );
};

export default ProfileManager;
