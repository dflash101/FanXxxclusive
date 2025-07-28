import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/types/Profile';

interface AdminImageLockControlsProps {
  profile: Profile;
  onUpdate: () => void;
}

export const AdminImageLockControls: React.FC<AdminImageLockControlsProps> = ({
  profile,
  onUpdate
}) => {
  const [lockedImages, setLockedImages] = useState<boolean[]>(
    profile.images.map((_, index) => {
      // Check if this image is locked (assuming we have locked_images data)
      const lockedImagesData = (profile as any).locked_images || [];
      return lockedImagesData[index] || false;
    })
  );
  
  const [lockedVideos, setLockedVideos] = useState<boolean[]>(
    profile.videos.map((_, index) => {
      // Check if this video is locked (assuming we have locked_videos data)
      const lockedVideosData = (profile as any).locked_videos || [];
      return lockedVideosData[index] || false;
    })
  );
  
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const toggleImageLock = (index: number) => {
    setLockedImages(prev => {
      const newLocked = [...prev];
      newLocked[index] = !newLocked[index];
      return newLocked;
    });
  };

  const toggleVideoLock = (index: number) => {
    setLockedVideos(prev => {
      const newLocked = [...prev];
      newLocked[index] = !newLocked[index];
      return newLocked;
    });
  };

  const saveLockSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          locked_images: lockedImages,
          locked_videos: lockedVideos
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Lock Settings Saved",
        description: "Image and video lock settings have been updated.",
      });
      onUpdate();
    } catch (error) {
      console.error('Error saving lock settings:', error);
      toast({
        title: "Error",
        description: "Failed to save lock settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Admin Lock Controls</CardTitle>
          <Button 
            onClick={saveLockSettings} 
            disabled={saving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {profile.images.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Photos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {profile.images.map((image, index) => (
                <div key={image.id} className="relative">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                    <img
                      src={image.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {lockedImages[index] && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <Badge variant={image.isCover ? 'default' : 'secondary'}>
                      {image.isCover ? 'Cover' : `Photo #${index + 1}`}
                    </Badge>
                    <Button
                      size="sm"
                      variant={lockedImages[index] ? 'destructive' : 'outline'}
                      onClick={() => toggleImageLock(index)}
                      className="gap-1"
                    >
                      {lockedImages[index] ? (
                        <>
                          <Unlock className="w-3 h-3" />
                          Unlock
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          Lock
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.videos.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Videos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {profile.videos.map((video, index) => (
                <div key={video.id} className="relative">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                    <video
                      src={video.url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                    {lockedVideos[index] && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <Badge variant={video.isCover ? 'default' : 'secondary'}>
                      {video.isCover ? 'Cover' : `Video #${index + 1}`}
                    </Badge>
                    <Button
                      size="sm"
                      variant={lockedVideos[index] ? 'destructive' : 'outline'}
                      onClick={() => toggleVideoLock(index)}
                      className="gap-1"
                    >
                      {lockedVideos[index] ? (
                        <>
                          <Unlock className="w-3 h-3" />
                          Unlock
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          Lock
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};