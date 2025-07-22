import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VideoUnlock {
  id: string;
  user_id: string;
  profile_id: string;
  video_index: number;
  created_at: string;
}

export const useVideoUnlocks = (userId?: string) => {
  const [unlockedVideos, setUnlockedVideos] = useState<VideoUnlock[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUnlockedVideos = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('video_unlocks')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setUnlockedVideos(data || []);
    } catch (err) {
      console.error('Error loading unlocked videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const unlockVideo = async (profileId: string, videoIndex: number) => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('video_unlocks')
        .insert({
          user_id: userId,
          profile_id: profileId,
          video_index: videoIndex
        })
        .select()
        .single();

      if (error) throw error;

      setUnlockedVideos(prev => [...prev, data]);
      return true;
    } catch (err) {
      console.error('Error unlocking video:', err);
      return false;
    }
  };

  const isVideoUnlocked = (profileId: string, videoIndex: number) => {
    return unlockedVideos.some(
      unlock => unlock.profile_id === profileId && unlock.video_index === videoIndex
    );
  };

  const getUnlockedVideosForProfile = (profileId: string) => {
    return unlockedVideos.filter(unlock => unlock.profile_id === profileId);
  };

  useEffect(() => {
    loadUnlockedVideos();
  }, [userId]);

  return {
    unlockedVideos,
    loading,
    unlockVideo,
    isVideoUnlocked,
    getUnlockedVideosForProfile,
    refetch: loadUnlockedVideos
  };
};