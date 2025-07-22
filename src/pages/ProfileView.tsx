import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ProfileImage } from '@/types/Profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PaymentModal from '@/components/PaymentModal';
import { usePhotoUnlocks } from '@/hooks/usePhotoUnlocks';
import { ArrowLeft, Lock, Unlock } from 'lucide-react';

const ProfileView = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    type: 'photo' | 'package';
    photoIndex?: number;
    amount: number;
  }>({ open: false, type: 'package', amount: 0 });

  const { isPhotoUnlocked, unlockPhoto, getUnlockedPhotosForProfile } = usePhotoUnlocks('guest-user'); // For demo

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
        isLocked: !data.is_unlocked && !isPhotoUnlocked(data.id, index),
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
        isUnlocked: data.is_unlocked || false,
        unlockPrice: Number(data.unlock_price) || 19.99,
        photoPrice: Number(data.photo_price) || 4.99,
        packagePrice: Number(data.package_price) || 19.99,
        createdAt: data.created_at
      };

      setProfile(mappedProfile);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUnlock = (photoIndex: number) => {
    if (!profile) return;
    
    setPaymentModal({
      open: true,
      type: 'photo',
      photoIndex,
      amount: profile.photoPrice || 4.99
    });
  };

  const handlePackageUnlock = () => {
    if (!profile) return;
    
    setPaymentModal({
      open: true,
      type: 'package',
      amount: profile.packagePrice || 19.99
    });
  };

  const handlePaymentSuccess = async () => {
    if (!profile) return;

    if (paymentModal.type === 'photo' && paymentModal.photoIndex !== undefined) {
      await unlockPhoto(profile.id, paymentModal.photoIndex);
    } else if (paymentModal.type === 'package') {
      // For package unlock, unlock all photos
      for (let i = 0; i < profile.images.length; i++) {
        await unlockPhoto(profile.id, i);
      }
    }
    
    setPaymentModal({ open: false, type: 'package', amount: 0 });
    loadProfile(); // Refresh the profile data
  };

  useEffect(() => {
    loadProfile();
  }, [id, isPhotoUnlocked]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-lg text-white">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Profile Not Found</h1>
          <Link to="/">
            <Button>Back to Gallery</Button>
          </Link>
        </div>
      </div>
    );
  }

  const unlockedCount = getUnlockedPhotosForProfile(profile.id).length;
  const totalPhotos = profile.images.length;
  const isFullyUnlocked = profile.isUnlocked || unlockedCount === totalPhotos;

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" className="mb-4 border-white text-white hover:bg-white hover:text-black">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {profile.name}
                  {profile.age && <Badge variant="secondary">{profile.age}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.location && (
                  <p className="text-muted-foreground">📍 {profile.location}</p>
                )}
                
                {profile.bio && (
                  <p className="text-sm leading-relaxed">{profile.bio}</p>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Unlocked Photos:</span>
                    <span>{unlockedCount}/{totalPhotos}</span>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Single Photo:</span>
                      <span>${profile.photoPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>All Photos:</span>
                      <span>${profile.packagePrice?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {!isFullyUnlocked && (
                  <Button 
                    onClick={handlePackageUnlock} 
                    className="w-full"
                  >
                    Unlock All Photos - ${profile.packagePrice?.toFixed(2)}
                  </Button>
                )}

                {isFullyUnlocked && (
                  <Badge variant="secondary" className="w-full justify-center">
                    <Unlock className="w-4 h-4 mr-2" />
                    All Photos Unlocked
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Photo Gallery */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profile.images.map((image, index) => {
                const isUnlocked = profile.isUnlocked || isPhotoUnlocked(profile.id, index);
                
                return (
                  <div key={image.id} className="relative group">
                    <div 
                      className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => isUnlocked && setSelectedImage(image.url)}
                    >
                      <img
                        src={image.url}
                        alt={`${profile.name} photo ${index + 1}`}
                        className={`w-full h-full object-cover transition-all ${
                          isUnlocked 
                            ? 'hover:scale-105' 
                            : 'blur-md grayscale opacity-50'
                        }`}
                      />
                      
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhotoUnlock(index);
                            }}
                            className="bg-white/90 hover:bg-white text-black"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            ${profile.photoPrice?.toFixed(2)}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-black"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        <PaymentModal
          isOpen={paymentModal.open}
          onClose={() => setPaymentModal({ open: false, type: 'package', amount: 0 })}
          onPaymentSuccess={handlePaymentSuccess}
          profile={profile}
          amount={paymentModal.amount}
          purchaseType={paymentModal.type}
        />
      </div>
    </div>
  );
};

export default ProfileView;