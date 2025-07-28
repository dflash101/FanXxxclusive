import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ProfileImage, ProfileVideo } from '@/types/Profile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Star } from 'lucide-react';

const ProfileView = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const profileImages: ProfileImage[] = (data.image_urls || []).map((url: string, index: number) => ({
        id: `${data.id}-${index}`,
        url,
        isLocked: false, // All images are now unlocked
        isCover: index === 0
      }));

      const profileVideos: ProfileVideo[] = (data.video_urls || []).map((url: string, index: number) => ({
        id: `${data.id}-video-${index}`,
        url,
        isLocked: false, // All videos are now unlocked
        isCover: index === 0
      }));

      const mappedProfile: Profile = {
        id: data.id,
        name: data.name,
        age: data.age || undefined,
        location: data.location || undefined,
        bio: data.bio || undefined,
        description: data.bio || undefined,
        images: profileImages,
        videos: profileVideos,
        isUnlocked: true, // All profiles are now unlocked
        unlockPrice: Number(data.unlock_price) || 19.99,
        photoPrice: Number(data.photo_price) || 4.99,
        packagePrice: Number(data.package_price) || 19.99,
        videoPrice: Number(data.video_price) || 9.99,
        videoPackagePrice: Number(data.video_package_price) || 39.99,
        createdAt: data.created_at
      };

      setProfile(mappedProfile);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Header */}
        <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              FanXXXclusive
            </h1>
            <Link to="/">
              <Button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Gallery
              </Button>
            </Link>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto border border-gray-700 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Profile Not Found</h2>
            <p className="text-gray-400 mb-6">The profile you're looking for doesn't exist or has been removed.</p>
            <Link to="/">
              <Button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
                Back to Gallery
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">{profile.name}</h3>
                  {profile.age && (
                    <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30">
                      {profile.age}
                    </Badge>
                  )}
                </div>

                {profile.location && (
                  <p className="text-gray-400 mb-4 flex items-center">
                    📍 {profile.location}
                  </p>
                )}
                
                {profile.bio && (
                  <p className="text-gray-300 mb-6 leading-relaxed">{profile.bio}</p>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between text-sm bg-gray-700/30 rounded-lg p-3">
                    <span className="text-gray-300">Total Photos:</span>
                    <span className="text-white font-semibold">{profile.images.length}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm bg-gray-700/30 rounded-lg p-3">
                    <span className="text-gray-300">Total Videos:</span>
                    <span className="text-white font-semibold">{profile.videos.length}</span>
                  </div>
                </div>

                <div className="w-full mt-6 bg-green-600/20 border border-green-600/30 rounded-lg p-3 flex items-center justify-center text-green-300">
                  <Star className="w-4 h-4 mr-2" />
                  All Content Available
                </div>
              </div>
            </div>
          </div>

          {/* Media Gallery */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photos */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <div 
                      className="aspect-square bg-gray-800/50 rounded-xl overflow-hidden cursor-pointer border border-gray-700 hover:border-gray-600 transition-all duration-300"
                      onClick={() => setSelectedImage(image.url)}
                    >
                      <img
                        src={image.url}
                        alt={`${profile.name} photo ${index + 1}`}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                      />
                      
                      {image.isCover && (
                        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-full p-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Videos */}
            {profile.videos.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Videos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.videos.map((video, index) => (
                    <div key={video.id} className="relative group">
                      <div className="aspect-square bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300">
                        <video
                          src={video.url}
                          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                          controls
                          preload="metadata"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700 text-white border-gray-600 backdrop-blur-sm"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfileView;