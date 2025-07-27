
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, LockOpen, Star, CreditCard, Eye } from 'lucide-react';
import { Profile } from '@/types/Profile';
import { Button } from '@/components/ui/button';

interface ProfileCardProps {
  profile: Profile;
  isUnlocked: boolean;
  onUnlock: () => void;
}

const ProfileCard = ({ profile, isUnlocked, onUnlock }: ProfileCardProps) => {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const coverImage = profile.images.find(img => img.isCover) || profile.images[0];
  const lockedCount = profile.images.filter(img => img.isLocked).length;

  const handlePayment = () => {
    // Simulate payment process
    setTimeout(() => {
      onUnlock();
      setShowPayment(false);
    }, 1500);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-all duration-300 group shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20">
      {/* Cover Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {coverImage && (
          <img
            src={coverImage.url}
            alt={profile.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        {coverImage?.isCover && (
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-full p-2">
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
        )}
        {lockedCount > 0 && (
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
            <Lock className="w-4 h-4 text-red-400" />
            <span className="text-white text-sm">{lockedCount}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-2">{profile.name}</h3>
        <p className="text-gray-400 mb-4">{profile.description}</p>

        {/* Image Gallery */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {profile.images.slice(0, 6).map((image) => (
            <div
              key={image.id}
              className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer ${
                image.isLocked && !isUnlocked ? 'filter blur-md' : ''
              }`}
              onClick={() => setSelectedImage(image.url)}
            >
              <img
                src={image.url}
                alt=""
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
              />
              {image.isLocked && !isUnlocked && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link to={`/profile/${profile.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </Link>
          
          {lockedCount > 0 && !isUnlocked ? (
            <Button
              onClick={() => setShowPayment(true)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              ${profile.packagePrice?.toFixed(2) || '19.99'}
            </Button>
          ) : (
            <Button variant="secondary" disabled className="flex-1 bg-green-600/20 text-green-300 border-green-600/30">
              <LockOpen className="w-4 h-4 mr-2" />
              Unlocked
            </Button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Unlock Profile</h3>
            <p className="text-gray-400 mb-6">
              Unlock all {lockedCount} locked photos for {profile.name}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Pay ${profile.packagePrice?.toFixed(2) || '19.99'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
