import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PurchasedItem {
  id: string;
  profile_image_id: string;
  purchased_at: string;
  purchase_price: number;
  image_url: string;
  profile_name: string;
}

const PurchasedItems = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPurchasedItems();
    }
  }, [user]);

  const fetchPurchasedItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select(`
          id,
          profile_image_id,
          purchased_at,
          purchase_price,
          profile_images!inner (
            image_url,
            profiles!inner (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      const formattedItems = data?.map(item => ({
        id: item.id,
        profile_image_id: item.profile_image_id,
        purchased_at: item.purchased_at,
        purchase_price: item.purchase_price,
        image_url: (item.profile_images as any).image_url,
        profile_name: (item.profile_images as any).profiles.name
      })) || [];

      setPurchasedItems(formattedItems);
    } catch (error) {
      console.error('Error fetching purchased items:', error);
      toast({
        title: "Error",
        description: "Failed to load purchased items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string, profileName: string, imageId: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${profileName}-${imageId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Image downloaded successfully"
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-6">You need to be signed in to view your purchased items.</p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your purchased items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gallery
          </Link>
          <h1 className="text-3xl font-bold">My Purchased Items</h1>
          <p className="text-muted-foreground mt-2">
            {purchasedItems.length} item{purchasedItems.length !== 1 ? 's' : ''} purchased
          </p>
        </div>

        {purchasedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-6">You haven't purchased any items yet.</p>
            <Link to="/">
              <Button>Browse Gallery</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {purchasedItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={item.image_url}
                      alt={`${item.profile_name} - Purchased Image`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-2">{item.profile_name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      Purchased: {new Date(item.purchased_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Price: ${item.purchase_price}
                    </p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownload(item.image_url, item.profile_name, item.profile_image_id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasedItems;