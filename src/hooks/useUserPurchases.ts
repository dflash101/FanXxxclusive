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
        // For authenticated users, save to database
        const { error } = await supabase
          .from('user_purchases')
          .insert([{
            user_id: user.id,
            profile_image_id: imageId,
            purchase_price: 4.99
          }]);

        if (error) throw error;

        // Update local state
        const newUnlocked = new Set(unlockedImages);
        newUnlocked.add(imageId);
        setUnlockedImages(newUnlocked);
      } else {
        // For guest users, save to localStorage
        const newUnlocked = new Set(unlockedImages);
        newUnlocked.add(imageId);
        setUnlockedImages(newUnlocked);
        localStorage.setItem('guest_unlocked_images', JSON.stringify([...newUnlocked]));
      }

      return { success: true };
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