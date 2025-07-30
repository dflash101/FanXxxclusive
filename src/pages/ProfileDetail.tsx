import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ProfileImage } from '@/types/Profile';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Lock, CreditCard, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProfileDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { unlockedImages, purchaseImage } = useUserPurchases();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      const { data: imagesData, error: imagesError } = await supabase
        .from('profile_images')
        .select('*')
        .eq('profile_id', id)
        .order('display_order', { ascending: true });

      if (imagesError) throw imagesError;

      setProfile({
        ...profileData,
        images: imagesData || []
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockImage = async (imageId: string) => {
    const result = await purchaseImage(imageId);
    
    if (result.success) {
      toast({
        title: "Image Unlocked!",
        description: "Payment processed successfully.",
      });
    } else {
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your payment.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Profile Not Found</h2>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to FanXXXclusive
            </Button>
          </Link>
          {!user && (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                Sign In to Save Purchases
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Profile Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Info */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">{profile.name}</h1>
            {profile.description && (
              <p className="text-lg text-muted-foreground">{profile.description}</p>
            )}
          </div>

          {/* Images Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.images?.map((image, index) => {
              const isLocked = image.is_locked && !unlockedImages.has(image.id);
              
              return (
                <Card key={image.id} className="overflow-hidden">
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={`${profile.name} - Image ${index + 1}`}
                      className={`w-full h-full object-cover transition-all duration-200 ${
                        isLocked ? 'filter blur-md scale-105' : ''
                      }`}
                    />
                    
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Card className="bg-card/90 backdrop-blur-sm">
                          <CardContent className="p-6 text-center">
                            <Lock className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-4">
                              Unlock this image to view
                            </p>
                            <Button 
                              onClick={() => handleUnlockImage(image.id)}
                              size="sm"
                              className="gap-2"
                            >
                              <CreditCard className="w-4 h-4" />
                              Unlock $4.99
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {(!profile.images || profile.images.length === 0) && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No images available for this profile.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfileDetail;