import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PhotoUnlock {
  id: string;
  user_id: string;
  profile_id: string;
  photo_index: number;
  created_at: string;
}

export const usePhotoUnlocks = (userId?: string) => {
  const [unlockedPhotos, setUnlockedPhotos] = useState<PhotoUnlock[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUnlockedPhotos = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('photo_unlocks')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setUnlockedPhotos(data || []);
    } catch (err) {
      console.error('Error loading unlocked photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const unlockPhoto = async (profileId: string, photoIndex: number) => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('photo_unlocks')
        .insert({
          user_id: userId,
          profile_id: profileId,
          photo_index: photoIndex
        })
        .select()
        .single();

      if (error) throw error;

      setUnlockedPhotos(prev => [...prev, data]);
      return true;
    } catch (err) {
      console.error('Error unlocking photo:', err);
      return false;
    }
  };

  const isPhotoUnlocked = (profileId: string, photoIndex: number) => {
    return unlockedPhotos.some(
      unlock => unlock.profile_id === profileId && unlock.photo_index === photoIndex
    );
  };

  const getUnlockedPhotosForProfile = (profileId: string) => {
    return unlockedPhotos.filter(unlock => unlock.profile_id === profileId);
  };

  useEffect(() => {
    loadUnlockedPhotos();
  }, [userId]);

  return {
    unlockedPhotos,
    loading,
    unlockPhoto,
    isPhotoUnlocked,
    getUnlockedPhotosForProfile,
    refetch: loadUnlockedPhotos
  };
};