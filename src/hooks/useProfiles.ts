import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ProfileImage } from '@/types/Profile';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with their images
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all profile images
      const { data: imagesData, error: imagesError } = await supabase
        .from('profile_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (imagesError) throw imagesError;

      // Combine profiles with their images
      const profilesWithImages = profilesData?.map(profile => ({
        ...profile,
        images: imagesData?.filter(img => img.profile_id === profile.id) || []
      })) || [];

      setProfiles(profilesWithImages);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profile: Omit<Profile, 'id'>, imageFiles: File[]) => {
    try {
      // Create profile first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          name: profile.name,
          description: profile.description,
          cover_image_url: profile.cover_image_url
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // Upload images to Supabase Storage if any
      if (imageFiles.length > 0) {
        const imagePromises = imageFiles.map(async (file, index) => {
          // Sanitize filename to remove special characters and emojis
          const sanitizedName = file.name
            .replace(/[^\w.-]/g, '_') // Replace non-alphanumeric chars with underscore
            .replace(/_{2,}/g, '_'); // Replace multiple underscores with single
          
          const fileName = `${profileData.id}/${Date.now()}-${index}-${sanitizedName}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile-images')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          // Get public URL for the uploaded file
          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(fileName);
          
          console.log('Public URL generated:', publicUrl);
          
          return supabase
            .from('profile_images')
            .insert([{
              profile_id: profileData.id,
              image_url: publicUrl,
              is_locked: index > 0, // First image (cover) is unlocked by default
              display_order: index
            }]);
        });

        await Promise.all(imagePromises);
      }

      await loadProfiles();
      return { success: true };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { success: false, error };
    }
  };

  const updateImageLockStatus = async (imageId: string, isLocked: boolean) => {
    try {
      const { error } = await supabase
        .from('profile_images')
        .update({ is_locked: isLocked })
        .eq('id', imageId);

      if (error) throw error;

      await loadProfiles();
      return { success: true };
    } catch (error) {
      console.error('Error updating image lock status:', error);
      return { success: false, error };
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      await loadProfiles();
      return { success: true };
    } catch (error) {
      console.error('Error deleting profile:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  return {
    profiles,
    loading,
    createProfile,
    updateImageLockStatus,
    deleteProfile,
    refetch: loadProfiles
  };
};