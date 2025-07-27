import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Shield, CreditCard, Wallet, CheckCircle, Check } from 'lucide-react';
import { Profile } from '@/types/Profile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
  profile: Profile;
  amount: number;
  purchaseType: 'photo' | 'package' | 'video' | 'video_package';
  photoId?: string;
  videoId?: string;
}

// Declare Square types for TypeScript
declare global {
  interface Window {
    Square: any;
  }
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  profile,
  amount,
  purchaseType,
  photoId,
  videoId
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [squareCard, setSquareCard] = useState<any>(null);
  const [squareApplicationId, setSquareApplicationId] = useState<string>('');
  const { toast } = useToast();

  // Load Square Web SDK
  useEffect(() => {
    if (isOpen && selectedMethod === 'square' && !window.Square) {
      loadSquareSDK();
    } else if (window.Square && selectedMethod === 'square') {
      initializeSquare();
    }
  }, [isOpen, selectedMethod]);

  const loadSquareSDK = async () => {
    try {
      // Get Square config first to determine environment
      const { data, error } = await supabase.functions.invoke('get-square-config');
      if (error) throw error;
      
      // Load the correct SDK based on environment
      const script = document.createElement('script');
      script.src = data.environment === 'production' 
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';
      script.async = true;
      script.onload = initializeSquare;
      document.head.appendChild(script);
    } catch (error) {
      console.error('Failed to load Square SDK:', error);
      toast({
        title: "Square SDK Load Failed",
        description: "Unable to load Square payment system. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initializeSquare = async () => {
    try {
      // Get Square application ID from environment
      const { data, error } = await supabase.functions.invoke('get-square-config');
      if (error) throw error;
      
      setSquareApplicationId(data.applicationId);
      
      if (window.Square) {
        const payments = window.Square.payments(data.applicationId, data.locationId);
        const card = await payments.card();
        await card.attach('#square-card-container');
        setSquareCard(card);
      }
    } catch (error) {
      console.error('Failed to initialize Square:', error);
      toast({
        title: "Square Initialization Failed",
        description: "Unable to load Square payment form. Please try again.",
        variant: "destructive",
      });
    }
  };

  const paymentMethods = [
    {
      id: 'square',
      name: 'Square',
      description: 'Secure credit card processing',
      icon: CreditCard,
      badge: 'Recommended',
      features: ['Instant processing', 'Bank-level security', 'All major cards accepted']
    },
    {
      id: 'trust-wallet',
      name: 'Trust Wallet',
      description: 'Crypto payments',
      icon: Wallet,
      badge: 'Crypto',
      features: ['Multiple cryptocurrencies', 'Decentralized', 'Low fees']
    }
  ];

  const handlePaymentSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleProceed = async () => {
    if (!selectedMethod) return;
    
    setIsProcessing(true);
    
    try {
      if (selectedMethod === 'square') {
        await processSquarePayment();
      } else if (selectedMethod === 'trust-wallet') {
        // Simulate Trust Wallet payment for now
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`Trust Wallet payment processed for $${amount}`);
        toast({
          title: "Payment Successful",
          description: `Payment of $${amount} processed successfully.`,
        });
        onPaymentSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processSquarePayment = async () => {
    if (!squareCard) {
      throw new Error('Square payment form not initialized');
    }

    try {
      // Tokenize the card
      const result = await squareCard.tokenize();
      
      if (result.status === 'OK') {
        // Process payment with our Edge Function
        const { data, error } = await supabase.functions.invoke('create-square-payment', {
          body: {
            sourceId: result.token,
            amount: amount,
            profileId: profile.id,
            purchaseType: purchaseType,
            photoId: photoId,
            videoId: videoId
          }
        });

        if (error) throw error;

        if (data.success) {
          toast({
            title: "Payment Successful",
            description: `Payment of $${amount} processed successfully.`,
          });
          onPaymentSuccess?.();
          onClose();
        } else {
          throw new Error(data.error || 'Payment failed');
        }
      } else {
        throw new Error(result.errors?.[0]?.message || 'Card tokenization failed');
      }
    } catch (error) {
      throw new Error(`Square payment failed: ${error.message}`);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedMethod('');
      setSquareCard(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Choose Payment Method</DialogTitle>
              <DialogDescription>
                {purchaseType === 'photo' ? `Unlock single photo for $${amount?.toFixed(2)}` : 
                 purchaseType === 'package' ? `Unlock all photos for $${amount?.toFixed(2)}` : 
                 purchaseType === 'video' ? `Unlock single video for $${amount?.toFixed(2)}` :
                 purchaseType === 'video_package' ? `Unlock all videos for $${amount?.toFixed(2)}` :
                 'Select your preferred way to pay'}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Payment Methods */}
        <div className="grid md:grid-cols-2 gap-6 my-6">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;
            
            return (
              <Card 
                key={method.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isProcessing && handlePaymentSelect(method.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {method.name}
                          <Badge variant="secondary">{method.badge}</Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {method.description}
                        </CardDescription>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="bg-primary text-primary-foreground p-1 rounded-full">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {method.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Square Card Form */}
        {selectedMethod === 'square' && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Payment Information</h3>
            <div id="square-card-container" className="border rounded-lg p-4 bg-background min-h-[120px] flex items-center justify-center">
              {!squareCard && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading payment form...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isProcessing}
            className="px-8"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleProceed}
            disabled={!selectedMethod || isProcessing || (selectedMethod === 'square' && !squareCard)}
            className="px-8"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            ) : (
              `Continue with ${selectedMethod === "square" ? "Square" : selectedMethod === "trust-wallet" ? "Trust Wallet" : "Payment"}`
            )}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            Your payment information is secure and encrypted
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;