import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ProfileImage, ProfileVideo } from '@/types/Profile';

export const useSupabaseProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProfiles: Profile[] = data.map(profile => {
        // Convert string array to ProfileImage array
        const profileImages: ProfileImage[] = (profile.image_urls || []).map((url: string, index: number) => ({
          id: `${profile.id}-${index}`,
          url,
          isLocked: !profile.is_unlocked,
          isCover: index === 0
        }));

        // Convert string array to ProfileVideo array
        const profileVideos: ProfileVideo[] = (profile.video_urls || []).map((url: string, index: number) => ({
          id: `${profile.id}-video-${index}`,
          url,
          isLocked: !profile.is_unlocked,
          isCover: index === 0
        }));

        return {
          id: profile.id,
          name: profile.name,
          age: profile.age || undefined,
          location: profile.location || undefined,
          bio: profile.bio || undefined,
          description: profile.bio || undefined,
          images: profileImages,
          videos: profileVideos,
          isUnlocked: profile.is_unlocked || false,
          unlockPrice: Number(profile.unlock_price) || 19.99,
          photoPrice: Number(profile.photo_price) || 4.99,
          packagePrice: Number(profile.package_price) || 19.99,
          videoPrice: Number(profile.video_price) || 9.99,
          videoPackagePrice: Number(profile.video_package_price) || 39.99,
          createdAt: profile.created_at
        };
      });

      setProfiles(mappedProfiles);
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profile: Omit<Profile, 'id'>) => {
    try {
      // Convert ProfileImage array to string array for database
      const imageUrls = profile.images.map(img => img.url);

      const videoUrls = profile.videos.map(vid => vid.url);

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          name: profile.name,
          age: profile.age,
          location: profile.location,
          bio: profile.bio || profile.description,
          image_urls: imageUrls,
          video_urls: videoUrls,
          is_unlocked: profile.isUnlocked || false,
          unlock_price: profile.unlockPrice || 19.99,
          photo_price: profile.photoPrice || 4.99,
          package_price: profile.packagePrice || 19.99,
          video_price: profile.videoPrice || 9.99,
          video_package_price: profile.videoPackagePrice || 39.99
        })
        .select()
        .single();

      if (error) throw error;

      const profileImages: ProfileImage[] = (data.image_urls || []).map((url: string, index: number) => ({
        id: `${data.id}-${index}`,
        url,
        isLocked: !data.is_unlocked,
        isCover: index === 0
      }));

      const profileVideos: ProfileVideo[] = (data.video_urls || []).map((url: string, index: number) => ({
        id: `${data.id}-video-${index}`,
        url,
        isLocked: !data.is_unlocked,
        isCover: index === 0
      }));

      const newProfile: Profile = {
        id: data.id,
        name: data.name,
        age: data.age || undefined,
        location: data.location || undefined,
        bio: data.bio || undefined,
        description: data.bio || undefined,
        images: profileImages,
        videos: profileVideos,
        isUnlocked: data.is_unlocked || false,
        unlockPrice: Number(data.unlock_price) || 19.99,
        photoPrice: Number(data.photo_price) || 4.99,
        packagePrice: Number(data.package_price) || 19.99,
        videoPrice: Number(data.video_price) || 9.99,
        videoPackagePrice: Number(data.video_package_price) || 39.99,
        createdAt: data.created_at
      };

      setProfiles(prev => [newProfile, ...prev]);
      return newProfile;
    } catch (err) {
      console.error('Error creating profile:', err);
      throw err;
    }
  };

  const updateProfile = async (profile: Profile) => {
    try {
      // Convert ProfileImage and ProfileVideo arrays to string arrays for database
      const imageUrls = profile.images.map(img => img.url);
      const videoUrls = profile.videos.map(vid => vid.url);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          age: profile.age,
          location: profile.location,
          bio: profile.bio || profile.description,
          image_urls: imageUrls,
          video_urls: videoUrls,
          is_unlocked: profile.isUnlocked || false,
          unlock_price: profile.unlockPrice || 19.99,
          photo_price: profile.photoPrice || 4.99,
          package_price: profile.packagePrice || 19.99,
          video_price: profile.videoPrice || 9.99,
          video_package_price: profile.videoPackagePrice || 39.99
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      const profileImages: ProfileImage[] = (data.image_urls || []).map((url: string, index: number) => ({
        id: `${data.id}-${index}`,
        url,
        isLocked: !data.is_unlocked,
        isCover: index === 0
      }));

      const profileVideos: ProfileVideo[] = (data.video_urls || []).map((url: string, index: number) => ({
        id: `${data.id}-video-${index}`,
        url,
        isLocked: !data.is_unlocked,
        isCover: index === 0
      }));

      const updatedProfile: Profile = {
        id: data.id,
        name: data.name,
        age: data.age || undefined,
        location: data.location || undefined,
        bio: data.bio || undefined,
        description: data.bio || undefined,
        images: profileImages,
        videos: profileVideos,
        isUnlocked: data.is_unlocked || false,
        unlockPrice: Number(data.unlock_price) || 19.99,
        photoPrice: Number(data.photo_price) || 4.99,
        packagePrice: Number(data.package_price) || 19.99,
        videoPrice: Number(data.video_price) || 9.99,
        videoPackagePrice: Number(data.video_package_price) || 39.99,
        createdAt: data.created_at
      };

      setProfiles(prev => prev.map(p => p.id === profile.id ? updatedProfile : p));
      return updatedProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (err) {
      console.error('Error deleting profile:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  return {
    profiles,
    loading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    refetch: loadProfiles
  };
};