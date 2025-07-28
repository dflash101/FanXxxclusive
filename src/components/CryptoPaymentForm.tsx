import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, QrCode, Wallet, Bitcoin, Coins, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CryptoPaymentFormProps {
  profileId: string;
  amount: number;
  unlockType: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

const cryptoCurrencies = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: Bitcoin,
    rate: 0.000023, // Mock rate: $43,478 per BTC
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    network: 'Bitcoin Network'
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: Coins,
    rate: 0.00041, // Mock rate: $2,439 per ETH
    address: '0x742d35Cc6634C0532925a3b8D400319Aa33b9fCd',
    network: 'Ethereum Network'
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    icon: DollarSign,
    rate: 1.0, // 1:1 with USD
    address: '0x742d35Cc6634C0532925a3b8D400319Aa33b9fCd',
    network: 'Ethereum Network (ERC-20)'
  }
];

export const CryptoPaymentForm = ({ profileId, amount, unlockType, onSuccess, onError }: CryptoPaymentFormProps) => {
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoCurrencies[0]);
  const [walletConnected, setWalletConnected] = useState(false);
  const { toast } = useToast();

  const cryptoAmount = (amount * selectedCrypto.rate).toFixed(selectedCrypto.id === 'usdc' ? 2 : 8);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const simulateWalletConnection = () => {
    setWalletConnected(true);
    toast({
      title: "Wallet Connected",
      description: "Mock wallet connection successful",
    });
  };

  const simulatePayment = () => {
    // Simulate payment processing
    toast({
      title: "Payment Submitted",
      description: "This is a demo - crypto payments coming soon!",
    });
    
    setTimeout(() => {
      onError("Crypto payments are not yet available. Please use credit card payment.");
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Cryptocurrency Payment
          <Badge variant="secondary">Coming Soon</Badge>
        </CardTitle>
        <CardDescription>
          Pay with your favorite cryptocurrency
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={selectedCrypto.id} onValueChange={(value) => {
          const crypto = cryptoCurrencies.find(c => c.id === value);
          if (crypto) setSelectedCrypto(crypto);
        }}>
          <TabsList className="grid w-full grid-cols-3">
            {cryptoCurrencies.map((crypto) => {
              const Icon = crypto.icon;
              return (
                <TabsTrigger key={crypto.id} value={crypto.id}>
                  <div className="flex items-center gap-1">
                    <Icon className="h-4 w-4" />
                    {crypto.symbol}
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {cryptoCurrencies.map((crypto) => (
            <TabsContent key={crypto.id} value={crypto.id} className="mt-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Amount to pay:</span>
                    <span className="text-lg font-bold">
                      {(amount * crypto.rate).toFixed(crypto.id === 'usdc' ? 2 : 8)} {crypto.symbol}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ≈ ${amount.toFixed(2)} USD
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Address:</label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded border font-mono text-sm">
                    <span className="flex-1 break-all">{crypto.address}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(crypto.address)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Network: {crypto.network}
                  </div>
                </div>

                <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="space-y-3">
          {!walletConnected ? (
            <Button 
              onClick={simulateWalletConnection}
              variant="outline" 
              className="w-full"
              size="lg"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet (Demo)
            </Button>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <Wallet className="h-4 w-4" />
                <span className="font-medium">Wallet Connected</span>
              </div>
            </div>
          )}

          <Button 
            onClick={simulatePayment}
            disabled={!walletConnected}
            className="w-full"
            size="lg"
          >
            Pay {cryptoAmount} {selectedCrypto.symbol}
          </Button>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-700">
            <strong>Note:</strong> Cryptocurrency payments are currently in development. 
            This interface shows how the payment flow will work once implemented.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};