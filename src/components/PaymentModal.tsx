import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Coins, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { SquarePaymentForm } from './SquarePaymentForm';
import { CryptoPaymentForm } from './CryptoPaymentForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  amount: number;
  unlockType: string;
  onSuccess: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: any;
}

export const PaymentModal = ({ isOpen, onClose, profileId, amount, unlockType, onSuccess }: PaymentModalProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string>('square');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentError, setPaymentError] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('enabled', true)
        .order('display_order');

      if (error) throw error;
      
      setPaymentMethods(data || []);
      
      // Set default to first enabled method
      if (data && data.length > 0) {
        setSelectedMethod(data[0].type);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentStatus('success');
    toast({
      title: "Payment Successful!",
      description: "Content has been unlocked",
    });
    
    setTimeout(() => {
      onSuccess();
      onClose();
      resetModal();
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error');
    setPaymentError(error);
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  const resetModal = () => {
    setPaymentStatus('idle');
    setPaymentError('');
  };

  const handleClose = () => {
    if (paymentStatus !== 'processing') {
      onClose();
      resetModal();
    }
  };

  const formatUnlockType = (type: string) => {
    switch (type) {
      case 'photos': return 'Photo Gallery';
      case 'videos': return 'Video Collection';
      case 'profile': return 'Full Profile';
      default: return 'Content';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {paymentStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {paymentStatus === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            {paymentStatus === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
            Unlock {formatUnlockType(unlockType)}
          </DialogTitle>
        </DialogHeader>

        {paymentStatus === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground">Content has been unlocked. Redirecting...</p>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="text-center py-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Failed</h3>
            <p className="text-muted-foreground mb-4">{paymentError}</p>
            <Button onClick={() => setPaymentStatus('idle')}>Try Again</Button>
          </div>
        )}

        {paymentStatus === 'idle' && (
          <>
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Purchase Summary</CardTitle>
                <CardDescription>
                  Unlock {formatUnlockType(unlockType)} for ${amount.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${amount.toFixed(2)} USD</span>
                </div>
              </CardContent>
            </Card>

            <Tabs value={selectedMethod} onValueChange={setSelectedMethod}>
              <TabsList className="grid w-full grid-cols-2">
                {paymentMethods.map((method) => (
                  <TabsTrigger key={method.type} value={method.type} disabled={!method.enabled}>
                    <div className="flex items-center gap-2">
                      {method.type === 'square' ? <CreditCard className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
                      {method.name}
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="square" className="mt-4">
                <SquarePaymentForm
                  profileId={profileId}
                  amount={amount}
                  unlockType={unlockType}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onStatusChange={setPaymentStatus}
                />
              </TabsContent>

              <TabsContent value="crypto" className="mt-4">
                <CryptoPaymentForm
                  profileId={profileId}
                  amount={amount}
                  unlockType={unlockType}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};