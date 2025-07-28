import React, { useState, useEffect } from 'react';
import { ShoppingCart as ShoppingCartIcon, X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface CartItem {
  profileId: string;
  profileName: string;
  itemIndex: number;
  itemType: 'photo' | 'video';
  price: number;
  imageUrl?: string;
}

interface ShoppingCartProps {
  items: CartItem[];
  onRemoveItem: (profileId: string, itemIndex: number, itemType: 'photo' | 'video') => void;
  onCheckout: (items: CartItem[]) => void;
  onClearCart: () => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items,
  onRemoveItem,
  onCheckout,
  onClearCart
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;

  const handleCheckout = () => {
    onCheckout(items);
    setIsOpen(false);
  };

  const groupedItems = items.reduce((acc, item) => {
    const key = item.profileId;
    if (!acc[key]) {
      acc[key] = {
        profileName: item.profileName,
        items: []
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { profileName: string; items: CartItem[] }>);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative gap-2"
          disabled={itemCount === 0}
        >
          <ShoppingCartIcon className="w-4 h-4" />
          Cart
          {itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Shopping Cart
            {itemCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearCart}>
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {itemCount === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              {Object.entries(groupedItems).map(([profileId, group]) => (
                <div key={profileId} className="space-y-2">
                  <h4 className="font-medium text-sm">{group.profileName}</h4>
                  {group.items.map((item, index) => (
                    <div key={`${item.profileId}-${item.itemIndex}-${item.itemType}`} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={`${item.itemType} ${item.itemIndex}`}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {item.itemType === 'photo' ? 'Photo' : 'Video'} #{item.itemIndex + 1}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${(item.price / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.profileId, item.itemIndex, item.itemType)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {Object.keys(groupedItems).length > 1 && <Separator />}
                </div>
              ))}

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Total:</span>
                  <span className="text-lg font-bold text-primary">
                    ${(totalAmount / 100).toFixed(2)}
                  </span>
                </div>
                <Button 
                  onClick={handleCheckout}
                  className="w-full gap-2"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4" />
                  Checkout ({itemCount} items)
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};