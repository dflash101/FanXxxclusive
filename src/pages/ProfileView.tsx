import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BlurredContent } from '@/components/BlurredContent';
import { ShoppingCart, type CartItem } from '@/components/ShoppingCart';
import { PaymentModal } from '@/components/PaymentModal';
import { PurchasedContentViewer } from '@/components/PurchasedContentViewer';
import { useItemPrices } from '@/hooks/useItemPrices';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AdminPricingControls } from '@/components/AdminPricingControls';
import { PaymentSystemTester } from '@/components/PaymentSystemTester';
import type { Profile } from '@/types/Profile';

export const ProfileView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [showPurchasedContent, setShowPurchasedContent] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [showSystemTester, setShowSystemTester] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { getItemPrice } = useItemPrices(id || '');

  const loadProfile = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (!data) {
        setProfile(null);
        return;
      }

      const mappedProfile: Profile = {
        id: data.id,
        name: data.name,
        age: data.age || undefined,
        location: data.location || undefined,
        bio: data.bio || undefined,
        images: (data.image_urls || []).map((url: string, index: number) => ({
          id: `img-${index}`,
          url,
          isCover: index === 0,
        })),
        videos: (data.video_urls || []).map((url: string, index: number) => ({
          id: `vid-${index}`,
          url,
          isCover: index === 0,
        })),
        createdAt: data.created_at,
      };

      setProfile(mappedProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (itemIndex: number, itemType: 'photo' | 'video') => {
    if (!profile || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase content.",
        variant: "destructive",
      });
      return;
    }

    const price = getItemPrice(itemIndex, itemType);
    const imageUrl = itemType === 'photo' ? profile.images[itemIndex]?.url : undefined;

    const cartItem: CartItem = {
      profileId: profile.id,
      profileName: profile.name,
      itemIndex,
      itemType,
      price,
      imageUrl
    };

    const exists = cartItems.some(item => 
      item.profileId === cartItem.profileId && 
      item.itemIndex === cartItem.itemIndex && 
      item.itemType === cartItem.itemType
    );

    if (exists) {
      toast({ title: "Already in Cart", description: "This item is already in your cart." });
      return;
    }

    setCartItems(prev => [...prev, cartItem]);
    toast({ title: "Added to Cart", description: `${itemType === 'photo' ? 'Photo' : 'Video'} #${itemIndex + 1} added to cart.` });
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <Button onClick={() => navigate('/')}>Back to Gallery</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdminControls(!showAdminControls)}
              className="gap-2"
            >
              Admin Controls
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowSystemTester(!showSystemTester)}
              className="gap-2"
            >
              System Tests
            </Button>
            
            {user && (
              <Button
                variant="outline"
                onClick={() => setShowPurchasedContent(!showPurchasedContent)}
                className="gap-2"
              >
                My Purchases
              </Button>
            )}
            
            <ShoppingCart
              items={cartItems}
              onRemoveItem={(profileId, itemIndex, itemType) => 
                setCartItems(prev => prev.filter(item => 
                  !(item.profileId === profileId && item.itemIndex === itemIndex && item.itemType === itemType)
                ))
              }
              onCheckout={() => setPaymentModalOpen(true)}
              onClearCart={() => setCartItems([])}
            />
          </div>
        </div>

        {showAdminControls ? (
          <div className="max-w-6xl mx-auto">
            <AdminPricingControls profile={profile} />
          </div>
        ) : showSystemTester ? (
          <div className="max-w-6xl mx-auto">
            <PaymentSystemTester />
          </div>
        ) : showPurchasedContent ? (
          <div className="max-w-6xl mx-auto">
            <PurchasedContentViewer />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-card p-6 rounded-lg shadow-lg">
                  <h1 className="text-3xl font-bold mb-4">{profile.name}</h1>
                  {profile.age && <p className="text-muted-foreground mb-2">Age: {profile.age}</p>}
                  {profile.location && <p className="text-muted-foreground mb-4">📍 {profile.location}</p>}
                  {profile.bio && (
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold mb-2">About</h2>
                      <p className="text-muted-foreground">{profile.bio}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-card p-6 rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold mb-6">Gallery</h2>
                  
                  {profile.images.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">Photos</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {profile.images.map((image, index) => (
                          <BlurredContent
                            key={image.id}
                            profileId={profile.id}
                            itemIndex={index}
                            itemType="photo"
                            price={getItemPrice(index, 'photo')}
                            onPurchase={() => addToCart(index, 'photo')}
                            className="aspect-square"
                          >
                            <img
                              src={image.url}
                              alt={`${profile.name} photo ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => setSelectedImage(image.url)}
                            />
                          </BlurredContent>
                        ))}
                       </div>
                    </div>
                  )}

                  {profile.videos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Videos</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profile.videos.map((video, index) => (
                          <BlurredContent
                            key={video.id}
                            profileId={profile.id}
                            itemIndex={index}
                            itemType="video"
                            price={getItemPrice(index, 'video')}
                            onPurchase={() => addToCart(index, 'video')}
                            className="aspect-video"
                          >
                            <video src={video.url} className="w-full h-full object-cover rounded-lg" controls />
                          </BlurredContent>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          items={cartItems}
          onSuccess={() => {
            setCartItems([]);
            toast({ title: "Purchase Successful!", description: "Your content has been unlocked." });
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
};

export default ProfileView;