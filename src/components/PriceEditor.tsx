import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PriceEditorProps {
  imageId: string;
  currentPrice: number;
  onPriceUpdate: () => void;
}

export const PriceEditor = ({ imageId, currentPrice, onPriceUpdate }: PriceEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [price, setPrice] = useState(currentPrice.toString());
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdatePrice = async () => {
    const newPrice = parseFloat(price);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profile_images')
        .update({ price: newPrice })
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: "Price Updated",
        description: `Price updated to $${newPrice.toFixed(2)}`,
      });
      setIsOpen(false);
      onPriceUpdate();
    } catch (error) {
      console.error('Error updating price:', error);
      toast({
        title: "Error",
        description: "Failed to update price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <DollarSign className="w-3 h-3" />
          ${currentPrice.toFixed(2)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Image Price</DialogTitle>
          <DialogDescription>
            Set the price for unlocking this image.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="4.99"
            />
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
              onClick={handleUpdatePrice}
              disabled={updating}
              className="flex-1"
            >
              {updating ? "Updating..." : "Update Price"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};