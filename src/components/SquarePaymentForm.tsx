import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Square: any;
  }
}

interface SquarePaymentFormProps {
  profileId: string;
  amount: number;
  unlockType: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onStatusChange: (status: 'idle' | 'processing' | 'success' | 'error') => void;
  itemId?: string;
}

export const SquarePaymentForm = ({ 
  profileId, 
  amount,
  unlockType, 
  onSuccess, 
  onError, 
  onStatusChange,
  itemId
}: SquarePaymentFormProps) => {
  const [squareConfig, setSquareConfig] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const cardContainer = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeSquare();
  }, []);

  const initializeSquare = async () => {
    try {
      // Load Square Web SDK
      if (!window.Square) {
        const script = document.createElement('script');
        script.src = 'https://web.squarecdn.com/v1/square.js';
        script.onload = () => {
          loadSquareConfig();
        };
        document.head.appendChild(script);
      } else {
        loadSquareConfig();
      }
    } catch (error) {
      console.error('Error initializing Square:', error);
      onError('Failed to initialize payment system');
      setLoading(false);
    }
  };

  const loadSquareConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-square-config');
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setSquareConfig(data);
      await initializePayments(data);
    } catch (error) {
      console.error('Error loading Square config:', error);
      onError('Failed to load payment configuration');
      setLoading(false);
    }
  };

  const initializePayments = async (config: any) => {
    try {
      if (!window.Square) {
        throw new Error('Square SDK not loaded');
      }

      const paymentsInstance = window.Square.payments(config.applicationId, config.locationId);
      setPayments(paymentsInstance);

      const cardInstance = await paymentsInstance.card();
      await cardInstance.attach(cardContainer.current);
      setCard(cardInstance);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing payments:', error);
      onError('Failed to initialize payment form');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!card || !payments) {
      onError('Payment form not ready');
      return;
    }

    setProcessing(true);
    onStatusChange('processing');

    try {
      // Tokenize the card
      const result = await card.tokenize();
      
      if (result.status === 'OK') {
        const token = result.token;
        
        // Create payment via our Edge Function
        const { data, error } = await supabase.functions.invoke('create-square-payment', {
          body: {
            profileId,
            amount,
            unlockType,
            sourceId: token,
            verificationToken: result.details?.verification_token
          }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        if (data.success && data.unlocked) {
          onSuccess(data.payment_id);
        } else {
          // Poll for payment completion if not immediately unlocked
          pollPaymentStatus(data.payment_id);
        }
      } else {
        throw new Error(result.errors?.[0]?.detail || 'Card tokenization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError(error instanceof Error ? error.message : 'Payment failed');
      setProcessing(false);
      onStatusChange('error');
    }
  };

  const pollPaymentStatus = async (paymentId: string, attempts = 0) => {
    if (attempts > 10) {
      onError('Payment verification timeout');
      setProcessing(false);
      onStatusChange('error');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-square-payment', {
        body: { paymentId }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.unlocked) {
        onSuccess(paymentId);
      } else if (data.status === 'failed') {
        onError('Payment was declined');
        setProcessing(false);
        onStatusChange('error');
      } else {
        // Continue polling
        setTimeout(() => pollPaymentStatus(paymentId, attempts + 1), 2000);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      onError('Payment verification failed');
      setProcessing(false);
      onStatusChange('error');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading payment form...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Credit or Debit Card
        </CardTitle>
        <CardDescription>
          Secure payment powered by Square
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          ref={cardContainer}
          id="card-container"
          className="min-h-[120px] p-4 border rounded-lg bg-background"
        />
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          Your payment information is encrypted and secure
        </div>

        <Button 
          onClick={handlePayment}
          disabled={processing || !card}
          className="w-full"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
};