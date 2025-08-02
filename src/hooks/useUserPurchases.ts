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
        // Get current session to pass auth token
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No valid session found');
        }

        // Create Square checkout session with auth
        const { data, error } = await supabase.functions.invoke('create-square-checkout', {
          body: {
            profileImageId: imageId,
            amount: 4.99
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(error.message || 'Failed to create checkout session');
        }

        if (data?.success) {
          // Redirect to Square checkout in same window for better UX
          window.location.href = data.checkoutUrl;
          return { success: true, redirected: true };
        } else {
          throw new Error(data?.error || 'Payment setup failed');
        }
      } else {
        // For guest users, redirect to auth
        return { success: false, error: 'Authentication required' };
      }
    } catch (error) {
      console.error('Error purchasing image:', error);
      return { success: false, error: error.message || 'Payment failed' };
    }
  };

  return {
    unlockedImages,
    loading,
    purchaseImage,
    refetch: user ? loadUserPurchases : loadGuestPurchases
  };
};