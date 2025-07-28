import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, DollarSign, Save, Image as ImageIcon, Play } from 'lucide-react';
import { useItemPrices } from '@/hooks/useItemPrices';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/types/Profile';

interface AdminPricingControlsProps {
  profile: Profile;
}

export const AdminPricingControls: React.FC<AdminPricingControlsProps> = ({ profile }) => {
  const { getItemPrice, setItemPrice } = useItemPrices(profile.id);
  const { toast } = useToast();
  const [tempPrices, setTempPrices] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const getKey = (index: number, type: 'photo' | 'video') => `${type}-${index}`;

  useEffect(() => {
    // Initialize temp prices with current values
    const newTempPrices: Record<string, number> = {};
    
    profile.images.forEach((_, index) => {
      const key = getKey(index, 'photo');
      newTempPrices[key] = getItemPrice(index, 'photo') / 100; // Convert to dollars
    });
    
    profile.videos.forEach((_, index) => {
      const key = getKey(index, 'video');
      newTempPrices[key] = getItemPrice(index, 'video') / 100; // Convert to dollars
    });
    
    setTempPrices(newTempPrices);
  }, [profile, getItemPrice]);

  const handlePriceChange = (index: number, type: 'photo' | 'video', value: string) => {
    const key = getKey(index, type);
    const numValue = parseFloat(value) || 0;
    setTempPrices(prev => ({ ...prev, [key]: numValue }));
  };

  const savePrice = async (index: number, type: 'photo' | 'video') => {
    const key = getKey(index, type);
    const dollarPrice = tempPrices[key] || 0;
    const centPrice = Math.round(dollarPrice * 100);

    if (centPrice < 50) {
      toast({
        title: "Invalid Price",
        description: "Price must be at least $0.50",
        variant: "destructive",
      });
      return;
    }

    setSaving(prev => ({ ...prev, [key]: true }));

    try {
      const success = await setItemPrice(index, type, centPrice);
      
      if (success) {
        toast({
          title: "Price Updated",
          description: `${type === 'photo' ? 'Photo' : 'Video'} #${index + 1} price set to $${dollarPrice.toFixed(2)}`,
        });
      } else {
        throw new Error('Failed to update price');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const saveBulkPrices = async (type: 'photo' | 'video') => {
    const items = type === 'photo' ? profile.images : profile.videos;
    const promises = items.map((_, index) => {
      const key = getKey(index, type);
      const dollarPrice = tempPrices[key] || 0;
      const centPrice = Math.round(dollarPrice * 100);
      
      if (centPrice >= 50) {
        return setItemPrice(index, type, centPrice);
      }
      return Promise.resolve(false);
    });

    try {
      const results = await Promise.all(promises);
      const successCount = results.filter(Boolean).length;
      
      toast({
        title: "Bulk Update Complete",
        description: `Updated ${successCount} ${type} prices`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Some prices failed to update",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Admin Pricing Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photos" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Photos ({profile.images.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Play className="w-4 h-4" />
              Videos ({profile.videos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Photo Pricing</h3>
              <Button 
                onClick={() => saveBulkPrices('photo')}
                variant="outline"
                size="sm"
              >
                Save All Photo Prices
              </Button>
            </div>

            {profile.images.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No photos to price</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.images.map((image, index) => {
                  const key = getKey(index, 'photo');
                  const currentPrice = getItemPrice(index, 'photo') / 100;
                  
                  return (
                    <div key={image.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={image.url}
                          alt={`Photo ${index + 1}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">Photo #{index + 1}</h4>
                            {image.isCover && <Badge variant="secondary">Cover</Badge>}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`photo-${index}`} className="text-sm">
                              Price:
                            </Label>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <Input
                                id={`photo-${index}`}
                                type="number"
                                step="0.01"
                                min="0.50"
                                value={tempPrices[key] || 0}
                                onChange={(e) => handlePriceChange(index, 'photo', e.target.value)}
                                className="w-20"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              Current: ${currentPrice.toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => savePrice(index, 'photo')}
                              disabled={saving[key]}
                            >
                              {saving[key] ? (
                                <>Saving...</>
                              ) : (
                                <>
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Video Pricing</h3>
              <Button 
                onClick={() => saveBulkPrices('video')}
                variant="outline"
                size="sm"
              >
                Save All Video Prices
              </Button>
            </div>

            {profile.videos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No videos to price</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.videos.map((video, index) => {
                  const key = getKey(index, 'video');
                  const currentPrice = getItemPrice(index, 'video') / 100;
                  
                  return (
                    <div key={video.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 bg-black rounded overflow-hidden relative">
                          <video 
                            src={video.url} 
                            className="w-full h-full object-cover"
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">Video #{index + 1}</h4>
                            {video.isCover && <Badge variant="secondary">Cover</Badge>}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`video-${index}`} className="text-sm">
                              Price:
                            </Label>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <Input
                                id={`video-${index}`}
                                type="number"
                                step="0.01"
                                min="0.50"
                                value={tempPrices[key] || 0}
                                onChange={(e) => handlePriceChange(index, 'video', e.target.value)}
                                className="w-20"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              Current: ${currentPrice.toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => savePrice(index, 'video')}
                              disabled={saving[key]}
                            >
                              {saving[key] ? (
                                <>Saving...</>
                              ) : (
                                <>
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};