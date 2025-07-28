import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { CartItem } from './ShoppingCart';

interface SquarePaymentFormProps {
  items: CartItem[];
  totalAmount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  items,
  totalAmount,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [squareReady, setSquareReady] = useState(false);
  const [payments, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form fields for billing
  const [billingInfo, setBillingInfo] = useState({
    givenName: '',
    familyName: '',
    email: user?.email || '',
    phone: '',
    country: 'US',
    region: '',
    city: '',
    postalCode: '',
    addressLine1: ''
  });

  useEffect(() => {
    const loadSquareSDK = async () => {
      try {
        // Load Square SDK
        const script = document.createElement('script');
        script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
        script.async = true;
        
        script.onload = async () => {
          try {
            const { data: config } = await supabase.functions.invoke('get-square-config');
            
            if (!config?.applicationId) {
              throw new Error('Square configuration not available');
            }

            // Initialize Square Payments
            const payments = (window as any).Square.payments(config.applicationId, config.locationId);
            setPayments(payments);

            // Initialize card payment method
            const card = await payments.card();
            await card.attach('#card-container');
            setCard(card);
            setSquareReady(true);
          } catch (err) {
            console.error('Error initializing Square:', err);
            setError('Failed to initialize payment system');
          }
        };

        script.onerror = () => {
          setError('Failed to load payment system');
        };

        document.head.appendChild(script);

        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch (err) {
        console.error('Error loading Square SDK:', err);
        setError('Failed to load payment system');
      }
    };

    loadSquareSDK();
  }, []);

  const handlePayment = async () => {
    if (!card || !user) return;

    setLoading(true);
    setError(null);

    try {
      // Tokenize the card
      const result = await card.tokenize({
        billing: {
          givenName: billingInfo.givenName,
          familyName: billingInfo.familyName,
          email: billingInfo.email,
          phone: billingInfo.phone,
          country: billingInfo.country,
          region: billingInfo.region,
          city: billingInfo.city,
          postalCode: billingInfo.postalCode,
          addressLine1: billingInfo.addressLine1
        }
      });

      if (result.status === 'OK') {
        // Process payment via edge function
        const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('process-square-payment', {
          body: {
            sourceId: result.token,
            amountMoney: {
              amount: totalAmount,
              currency: 'USD'
            },
            items: items.map(item => ({
              profileId: item.profileId,
              itemIndex: item.itemIndex,
              itemType: item.itemType,
              price: item.price
            }))
          }
        });

        if (paymentError) {
          throw new Error(paymentError.message || 'Payment failed');
        }

        if (paymentResult?.success) {
          toast({
            title: "Payment Successful",
            description: "Your purchase has been completed successfully!",
          });
          onSuccess();
        } else {
          throw new Error(paymentResult?.error || 'Payment failed');
        }
      } else {
        throw new Error(result.errors?.[0]?.detail || 'Card tokenization failed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
      toast({
        title: "Payment Failed",
        description: err.message || "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return billingInfo.givenName && 
           billingInfo.familyName && 
           billingInfo.email && 
           billingInfo.addressLine1 && 
           billingInfo.city && 
           billingInfo.postalCode &&
           squareReady;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: ${(totalAmount / 100).toFixed(2)} for {items.length} items
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Billing Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="givenName">First Name *</Label>
            <Input
              id="givenName"
              value={billingInfo.givenName}
              onChange={(e) => setBillingInfo(prev => ({ ...prev, givenName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="familyName">Last Name *</Label>
            <Input
              id="familyName"
              value={billingInfo.familyName}
              onChange={(e) => setBillingInfo(prev => ({ ...prev, familyName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={billingInfo.email}
            onChange={(e) => setBillingInfo(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="addressLine1">Address *</Label>
          <Input
            id="addressLine1"
            value={billingInfo.addressLine1}
            onChange={(e) => setBillingInfo(prev => ({ ...prev, addressLine1: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={billingInfo.city}
              onChange={(e) => setBillingInfo(prev => ({ ...prev, city: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="postalCode">ZIP Code *</Label>
            <Input
              id="postalCode"
              value={billingInfo.postalCode}
              onChange={(e) => setBillingInfo(prev => ({ ...prev, postalCode: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="region">State</Label>
          <Input
            id="region"
            value={billingInfo.region}
            onChange={(e) => setBillingInfo(prev => ({ ...prev, region: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={billingInfo.phone}
            onChange={(e) => setBillingInfo(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>

        {/* Square Card Container */}
        <div>
          <Label>Card Details *</Label>
          <div 
            id="card-container" 
            className="border rounded-md p-3 min-h-[50px] bg-background"
            style={{ 
              minHeight: '50px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'calc(var(--radius) - 2px)'
            }}
          >
            {!squareReady && (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading payment form...
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePayment}
            disabled={!isFormValid() || loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Pay $${(totalAmount / 100).toFixed(2)}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};