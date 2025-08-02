import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Unlock } from 'lucide-react';
import { ProfileImage } from '@/types/Profile';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkUnlockButtonProps {
  images: ProfileImage[];
  profileName: string;
}

export const BulkUnlockButton = ({ images, profileName }: BulkUnlockButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { unlockedImages } = useUserPurchases();
  const { user } = useAuth();
  const { toast } = useToast();

  // Calculate locked images and total cost
  const lockedImages = images.filter(img => img.is_locked && !unlockedImages.has(img.id));
  const totalCost = lockedImages.reduce((sum, img) => sum + (img.price || 4.99), 0);

  if (lockedImages.length === 0) {
    return null; // No locked images to unlock
  }

  const handleBulkUnlock = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase images.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No valid session found');
      }

      // Create bulk checkout session
      const { data, error } = await supabase.functions.invoke('create-square-checkout', {
        body: {
          bulkPurchase: true,
          imageIds: lockedImages.map(img => img.id),
          amount: totalCost,
          description: `Unlock all ${lockedImages.length} images from ${profileName}`
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Bulk purchase error:', error);
        throw new Error(error.message || 'Failed to create bulk checkout session');
      }

      if (data?.success) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data?.error || 'Payment setup failed');
      }
    } catch (error) {
      console.error('Error processing bulk purchase:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Unlock className="w-4 h-4" />
          Unlock All (${totalCost.toFixed(2)})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unlock All Images</DialogTitle>
          <DialogDescription>
            Purchase access to all locked images in this profile.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Locked Images:</span>
              <span className="text-sm">{lockedImages.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Cost:</span>
              <span className="text-lg font-bold text-primary">${totalCost.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUnlock}
              disabled={processing}
              className="flex-1 gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {processing ? "Processing..." : "Purchase All"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};