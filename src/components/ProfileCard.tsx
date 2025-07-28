
import { Link } from 'react-router-dom';
import { Star, Eye } from 'lucide-react';
import { Profile } from '@/types/Profile';
import { Button } from '@/components/ui/button';

interface ProfileCardProps {
  profile: Profile;
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  const coverImage = profile.images.find(img => img.isCover) || profile.images[0];

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
              className="relative aspect-square rounded-lg overflow-hidden"
            >
              <img
                src={image.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link to={`/profile/${profile.id}`} className="w-full">
            <Button variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
