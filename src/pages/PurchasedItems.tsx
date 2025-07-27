import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Image, Video, Package, Eye } from 'lucide-react';

interface PurchasedItem {
  id: string;
  profileId: string;
  profileName: string;
  profileImage: string;
  itemType: 'photo' | 'video' | 'package';
  itemIndex?: number;
  itemUrl?: string;
  purchaseDate: string;
  amount?: number;
}

const PurchasedItems = () => {
  const { user } = useAuth();
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPurchasedItems();
    }
  }, [user]);

  const loadPurchasedItems = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get photo unlocks
      const { data: photoUnlocks, error: photoError } = await supabase
        .from('photo_unlocks')
        .select(`
          id,
          profile_id,
          photo_index,
          created_at,
          profiles (
            name,
            image_urls
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (photoError) throw photoError;

      // Get video unlocks
      const { data: videoUnlocks, error: videoError } = await supabase
        .from('video_unlocks')
        .select(`
          id,
          profile_id,
          video_index,
          created_at,
          profiles (
            name,
            image_urls,
            video_urls
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (videoError) throw videoError;

      // Get package payments
      const { data: packagePayments, error: paymentError } = await supabase
        .from('payments')
        .select(`
          id,
          profile_id,
          amount,
          created_at,
          purchase_type,
          profiles (
            name,
            image_urls
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('purchase_type', 'package')
        .order('created_at', { ascending: false });

      if (paymentError) throw paymentError;

      // Combine and format all purchased items
      const allItems: PurchasedItem[] = [];

      // Add photo unlocks
      photoUnlocks?.forEach((unlock: any) => {
        const profileData = unlock.profiles;
        allItems.push({
          id: unlock.id,
          profileId: unlock.profile_id,
          profileName: profileData?.name || 'Unknown',
          profileImage: profileData?.image_urls?.[0] || '',
          itemType: 'photo',
          itemIndex: unlock.photo_index,
          itemUrl: profileData?.image_urls?.[unlock.photo_index],
          purchaseDate: unlock.created_at,
        });
      });

      // Add video unlocks
      videoUnlocks?.forEach((unlock: any) => {
        const profileData = unlock.profiles;
        allItems.push({
          id: unlock.id,
          profileId: unlock.profile_id,
          profileName: profileData?.name || 'Unknown',
          profileImage: profileData?.image_urls?.[0] || '',
          itemType: 'video',
          itemIndex: unlock.video_index,
          itemUrl: profileData?.video_urls?.[unlock.video_index],
          purchaseDate: unlock.created_at,
        });
      });

      // Add package purchases
      packagePayments?.forEach((payment: any) => {
        const profileData = payment.profiles;
        allItems.push({
          id: payment.id,
          profileId: payment.profile_id,
          profileName: profileData?.name || 'Unknown',
          profileImage: profileData?.image_urls?.[0] || '',
          itemType: 'package',
          purchaseDate: payment.created_at,
          amount: payment.amount,
        });
      });

      // Sort by purchase date (newest first)
      allItems.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

      setPurchasedItems(allItems);
    } catch (error) {
      console.error('Error loading purchased items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'package':
        return <Package className="w-4 h-4" />;
      default:
        return <Image className="w-4 h-4" />;
    }
  };

  const getItemDescription = (item: PurchasedItem) => {
    switch (item.itemType) {
      case 'photo':
        return `Photo #${(item.itemIndex || 0) + 1}`;
      case 'video':
        return `Video #${(item.itemIndex || 0) + 1}`;
      case 'package':
        return 'Full Photo Package';
      default:
        return 'Unknown Item';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Loading your purchases...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            My Purchases
          </h1>
          <p className="text-gray-400">
            View all the content you've unlocked on FanXXXclusive
          </p>
        </div>

        {purchasedItems.length === 0 ? (
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 text-center py-12">
            <CardContent className="space-y-4">
              <Package className="w-16 h-16 text-gray-500 mx-auto" />
              <h3 className="text-xl font-semibold text-white">No Purchases Yet</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                You haven't unlocked any content yet. Browse profiles and unlock photos or videos to see them here.
              </p>
              <Link to="/">
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  Browse Profiles
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchasedItems.map((item) => (
              <Card key={item.id} className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-purple-500/50 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">{item.profileName}</CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getItemIcon(item.itemType)}
                      {item.itemType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Item Preview */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-700/50">
                    {item.itemType === 'photo' && item.itemUrl ? (
                      <img
                        src={item.itemUrl}
                        alt={`${item.profileName} - ${getItemDescription(item)}`}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={() => setSelectedImage(item.itemUrl!)}
                      />
                    ) : item.itemType === 'video' && item.itemUrl ? (
                      <video
                        src={item.itemUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        preload="metadata"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <img
                          src={item.profileImage}
                          alt={item.profileName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Package className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="space-y-2">
                    <p className="text-white font-medium">{getItemDescription(item)}</p>
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(item.purchaseDate)}
                    </div>
                    {item.amount && (
                      <p className="text-green-400 font-semibold">${item.amount}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <Link to={`/profile/${item.profileId}`}>
                    <Button variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700 text-white border-gray-600 backdrop-blur-sm"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PurchasedItems;