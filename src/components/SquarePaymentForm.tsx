import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Shield, AlertCircle } from 'lucide-react';
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
  const [initializationError, setInitializationError] = useState<string>('');
  const cardContainer = useRef<HTMLDivElement>(null);
  const squareInstance = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Delay initialization to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      initializeSquare();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      // Cleanup Square instances on unmount
      if (card) {
        try {
          card.destroy();
        } catch (error) {
          console.log('Card cleanup error:', error);
        }
      }
      if (squareInstance.current) {
        squareInstance.current = null;
      }
    };
  }, []);

  const waitForDOMElement = useCallback((maxAttempts = 50, interval = 100): Promise<HTMLElement> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkElement = () => {
        attempts++;
        
        // Check if element exists and is visible
        if (cardContainer.current && cardContainer.current.offsetParent !== null) {
          console.log('DOM element found and visible after', attempts, 'attempts');
          resolve(cardContainer.current);
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.error('DOM element check failed after', attempts, 'attempts');
          console.error('Element exists:', !!cardContainer.current);
          console.error('Element visible:', cardContainer.current?.offsetParent !== null);
          reject(new Error(`DOM element not available after ${maxAttempts} attempts`));
          return;
        }
        
        setTimeout(checkElement, interval);
      };
      
      checkElement();
    });
  }, []);

  const initializeSquare = async () => {
    try {
      setInitializationError('');
      setLoading(true);
      
      console.log('Starting Square initialization...');
      
      // Load Square Web SDK
      if (!window.Square) {
        console.log('Loading Square SDK...');
        await loadSquareSDK();
      }
      
      console.log('Loading Square config...');
      await loadSquareConfig();
    } catch (error) {
      console.error('Error initializing Square:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment system';
      setInitializationError(errorMessage);
      onError(errorMessage);
      setLoading(false);
    }
  };

  const loadSquareSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://web.squarecdn.com/v1/square.js';
      script.onload = () => {
        console.log('Square SDK loaded successfully');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Square SDK'));
      };
      document.head.appendChild(script);
    });
  };

  const loadSquareConfig = async () => {
    try {
      console.log('Fetching Square configuration...');
      const { data, error } = await supabase.functions.invoke('get-square-config');
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      console.log('Square config loaded successfully');
      setSquareConfig(data);
      await initializePayments(data);
    } catch (error) {
      console.error('Error loading Square config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load payment configuration';
      setInitializationError(errorMessage);
      throw error;
    }
  };

  const initializePayments = async (config: any) => {
    try {
      if (!window.Square) {
        throw new Error('Square SDK not loaded');
      }

      console.log('Initializing Square payments with config:', { 
        applicationId: config.applicationId, 
        locationId: config.locationId 
      });

      // Wait for DOM element to be available
      console.log('Waiting for DOM element...');
      const element = await waitForDOMElement();
      
      console.log('Creating Square payments instance...');
      const paymentsInstance = window.Square.payments(config.applicationId, config.locationId);
      squareInstance.current = paymentsInstance;
      setPayments(paymentsInstance);

      console.log('Creating card instance...');
      const cardInstance = await paymentsInstance.card({
        style: {
          input: {
            fontSize: '16px',
            fontFamily: 'inherit',
            color: 'hsl(var(--foreground))',
            backgroundColor: 'hsl(var(--background))',
          },
          '.input-container': {
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
          },
          '.input-container.is-focus': {
            borderColor: 'hsl(var(--ring))',
          },
          '.input-container.is-error': {
            borderColor: 'hsl(var(--destructive))',
          }
        }
      });
      
      console.log('Attaching card to DOM element...');
      await cardInstance.attach(element);
      
      console.log('Card attached successfully');
      setCard(cardInstance);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing payments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment form';
      setInitializationError(errorMessage);
      setLoading(false);
      throw error;
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

  if (initializationError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2">Payment System Error</h3>
            <p className="text-sm text-muted-foreground mb-4">{initializationError}</p>
            <Button 
              onClick={() => {
                setInitializationError('');
                initializeSquare();
              }}
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
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
          style={{ visibility: 'visible', display: 'block' }}
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