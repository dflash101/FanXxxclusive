
import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Profile, ProfileImage } from '@/types/Profile';
import { toast } from 'sonner';
import { compressImage, safeLocalStorageSet } from '@/utils/imageUtils';

interface CreateProfileProps {
  onClose: () => void;
  onCreate: (profile: Profile) => void;
}

const CreateProfile = ({ onClose, onCreate }: CreateProfileProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ProfileImage[]>([]);
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
          isCover: images.length === 0
        };

        setImages(prev => [...prev, newImage]);
      } catch (error) {
        console.error('Failed to process image:', error);
        toast.error('Failed to process image');
      }
    }
    
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || images.length === 0) {
      toast.error('Please provide a name and at least one image');
      return;
    }

    const newProfile: Profile = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      images,
      videos: [],
      createdAt: new Date().toISOString()
    };

    // Get existing profiles
    const existingProfiles = JSON.parse(localStorage.getItem('profiles') || '[]');
    const updatedProfiles = [...existingProfiles, newProfile];

    // Try to save to localStorage
    const saved = safeLocalStorageSet('profiles', updatedProfiles);
    
    if (saved) {
      onCreate(newProfile);
      toast.success('Profile created successfully!', {
        description: `${name} has been added to the gallery.`,
      });
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      toast.error('Failed to save profile. Try using smaller images or fewer images.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Profile</h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Profile Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter profile name"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Enter profile description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Images * (First image will be the cover)
            </label>
            <label className={`flex items-center justify-center gap-2 px-6 py-4 bg-gray-700/50 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700/70 transition-colors ${isUploading ? 'opacity-50' : ''}`}>
              <Plus size={20} className="text-gray-400" />
              <span className="text-gray-400">
                {isUploading ? 'Processing images...' : 'Choose images to upload'}
              </span>
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

          {/* Image Preview */}
          {images.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Uploaded Images ({images.length})
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                      index === 0 ? 'border-yellow-400' : 'border-gray-600'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-yellow-600 text-white text-xs px-2 py-1 rounded">
                        Cover
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter(img => img.id !== image.id))}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || images.length === 0 || isUploading}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProfile;
