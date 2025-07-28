import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Play, Image as ImageIcon } from 'lucide-react';

export const PurchasedContentViewer: React.FC = () => {
  // const { purchases, loading } = useUserPurchases();
  const purchases: any[] = [];
  const loading = false;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading your purchases...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No purchases yet</p>
            <p className="text-sm">Browse profiles to unlock exclusive content</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group purchases by profile
  const groupedPurchases = purchases.reduce((acc, purchase) => {
    const profileId = purchase.profile_id;
    if (!acc[profileId]) {
      acc[profileId] = {
        profile: purchase.profiles,
        items: []
      };
    }
    acc[profileId].items.push(purchase);
    return acc;
  }, {} as Record<string, { profile: any; items: any[] }>);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Your Purchases ({purchases.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedPurchases).map(([profileId, group]: [string, any]) => (
              <div key={profileId} className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">{group.profile?.name}</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {group.items.map((item: any) => {
                    const profile = item.profiles;
                    const isPhoto = item.item_type === 'photo';
                    const itemUrl = isPhoto 
                      ? profile?.image_urls?.[item.item_index]
                      : profile?.video_urls?.[item.item_index];

                    return (
                      <div key={`${item.profile_id}-${item.item_index}-${item.item_type}`} className="relative group">
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                          {isPhoto && itemUrl ? (
                            <img
                              src={itemUrl}
                              alt={`Purchased ${item.item_type}`}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => setSelectedImage(itemUrl)}
                            />
                          ) : isPhoto ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                          ) : itemUrl ? (
                            <div className="w-full h-full flex items-center justify-center bg-black/80">
                              <Play className="w-8 h-8 text-white" />
                              <video
                                src={itemUrl}
                                className="absolute inset-0 w-full h-full object-cover opacity-50"
                                muted
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="absolute top-2 left-2">
                          <Badge variant={isPhoto ? 'default' : 'secondary'} className="text-xs">
                            {isPhoto ? 'Photo' : 'Video'} #{item.item_index + 1}
                          </Badge>
                        </div>

                        {itemUrl && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = itemUrl;
                                link.download = `${profile?.name}-${item.item_type}-${item.item_index + 1}`;
                                link.click();
                              }}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        )}

                        <div className="mt-2 text-xs text-muted-foreground text-center">
                          Purchased {new Date(item.purchased_at).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Purchased Content</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Purchased content"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};