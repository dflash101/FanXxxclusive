import React from 'react';
import { Lock, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePurchaseStatus } from '@/hooks/usePurchaseStatus';

interface BlurredContentProps {
  children: React.ReactNode;
  profileId: string;
  itemIndex: number;
  itemType: 'photo' | 'video';
  price?: number;
  onPurchase?: () => void;
  className?: string;
}

export const BlurredContent: React.FC<BlurredContentProps> = ({
  children,
  profileId,
  itemIndex,
  itemType,
  price,
  onPurchase,
  className = ''
}) => {
  const { hasPurchased, loading } = usePurchaseStatus(profileId, itemIndex, itemType);

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        {children}
        <div className="absolute inset-0 bg-background/50 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (hasPurchased) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      <div 
        className="absolute inset-0 backdrop-blur-md bg-background/30 rounded-lg flex flex-col items-center justify-center"
        style={{ backdropFilter: 'blur(10px)' }}
      >
        <div className="bg-background/90 p-4 rounded-lg text-center shadow-lg border">
          <Lock className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p className="text-sm font-medium mb-2">
            {itemType === 'photo' ? 'Photo' : 'Video'} Locked
          </p>
          {price && (
            <p className="text-lg font-bold text-primary mb-3">
              ${(price / 100).toFixed(2)}
            </p>
          )}
          {onPurchase && (
            <Button 
              onClick={onPurchase}
              size="sm"
              className="gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Purchase
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};