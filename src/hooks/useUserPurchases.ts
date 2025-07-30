import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserPurchases = () => {
  const { user } = useAuth();
  const [unlockedImages, setUnlockedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserPurchases();
    } else {
      // Load from localStorage for guest users
      loadGuestPurchases();
    }
  }, [user]);

  const loadUserPurchases = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_purchases')
        .select('profile_image_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const imageIds = data?.map(purchase => purchase.profile_image_id) || [];
      setUnlockedImages(new Set(imageIds));
    } catch (error) {
      console.error('Error loading user purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGuestPurchases = () => {
    try {
      setLoading(true);
      const guestPurchases = localStorage.getItem('guest_unlocked_images');
      if (guestPurchases) {
        setUnlockedImages(new Set(JSON.parse(guestPurchases)));
      }
    } catch (error) {
      console.error('Error loading guest purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseImage = async (imageId: string) => {
    try {
      if (user) {
        // Create Square checkout session
        const { data, error } = await supabase.functions.invoke('create-square-checkout', {
          body: {
            profileImageId: imageId,
            amount: 4.99,
            redirectUrl: `${window.location.origin}/purchased?success=true&imageId=${imageId}`
          }
        });

        if (error) throw error;

        if (data.success) {
          // Open Square checkout in a new tab
          window.open(data.checkoutUrl, '_blank');
          return { success: true, redirected: true };
        } else {
          throw new Error(data.error || 'Payment setup failed');
        }
      } else {
        // For guest users, redirect to auth (this shouldn't happen as we redirect in UI)
        return { success: false, error: 'Authentication required' };
      }
    } catch (error) {
      console.error('Error purchasing image:', error);
      return { success: false, error };
    }
  };

  return {
    unlockedImages,
    loading,
    purchaseImage,
    refetch: user ? loadUserPurchases : loadGuestPurchases
  };
};