import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UnlockStatus {
  photos: boolean;
  videos: boolean;
  profile: boolean;
}

export const useUnlockStatus = (profileId: string) => {
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus>({
    photos: false,
    videos: false,
    profile: false
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user && profileId) {
      fetchUnlockStatus();
    } else {
      setLoading(false);
    }
  }, [user, profileId]);

  const fetchUnlockStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-payment-status', {
        body: { profileId }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setUnlockStatus(data.unlocks || {
        photos: false,
        videos: false,
        profile: false
      });
    } catch (error) {
      console.error('Error fetching unlock status:', error);
      // Default to locked if there's an error
      setUnlockStatus({
        photos: false,
        videos: false,
        profile: false
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshUnlockStatus = () => {
    setLoading(true);
    fetchUnlockStatus();
  };

  return {
    unlockStatus,
    loading,
    refreshUnlockStatus
  };
};