import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PurchaseStatus {
  hasPurchased: boolean;
  loading: boolean;
}

export const usePurchaseStatus = (profileId: string, itemIndex: number, itemType: 'photo' | 'video'): PurchaseStatus => {
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user) {
        setHasPurchased(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('profile_id', profileId)
          .eq('item_index', itemIndex)
          .eq('item_type', itemType)
          .maybeSingle();

        if (error) {
          console.error('Error checking purchase status:', error);
          setHasPurchased(false);
        } else {
          setHasPurchased(!!data);
        }
      } catch (error) {
        console.error('Error checking purchase status:', error);
        setHasPurchased(false);
      } finally {
        setLoading(false);
      }
    };

    checkPurchaseStatus();
  }, [user, profileId, itemIndex, itemType]);

  return { hasPurchased, loading };
};

export const useUserPurchases = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadUserPurchases = async () => {
    if (!user) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select(`
          *,
          profiles:profile_id (
            id,
            name,
            image_urls,
            video_urls
          )
        `)
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (error) {
        console.error('Error loading user purchases:', error);
        setPurchases([]);
      } else {
        setPurchases(data || []);
      }
    } catch (error) {
      console.error('Error loading user purchases:', error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserPurchases();
  }, [user]);

  return { purchases, loading, refetch: loadUserPurchases };
};