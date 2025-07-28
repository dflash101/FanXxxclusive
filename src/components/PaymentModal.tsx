import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SquarePaymentForm } from './SquarePaymentForm';
import type { CartItem } from './ShoppingCart';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  items,
  onSuccess
}) => {
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Order Summary</h3>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={`${item.profileId}-${item.itemIndex}-${item.itemType}`} className="flex justify-between text-sm">
                  <span>
                    {item.profileName} - {item.itemType === 'photo' ? 'Photo' : 'Video'} #{item.itemIndex + 1}
                  </span>
                  <span>${(item.price / 100).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                <span>Total:</span>
                <span>${(totalAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <SquarePaymentForm
            items={items}
            totalAmount={totalAmount}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};