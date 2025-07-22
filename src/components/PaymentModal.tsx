import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet, Check, X } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (method: string) => void;
}

const PaymentModal = ({ isOpen, onClose, onPaymentSuccess }: PaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    {
      id: "square",
      name: "Square",
      description: "Pay with credit card, debit card, or bank transfer",
      icon: CreditCard,
      badge: "Popular",
      features: ["Secure payments", "Instant processing", "All major cards accepted"]
    },
    {
      id: "trust-wallet",
      name: "Trust Wallet", 
      description: "Pay with cryptocurrency using Trust Wallet",
      icon: Wallet,
      badge: "Crypto",
      features: ["Multiple cryptocurrencies", "Decentralized", "Low fees"]
    }
  ];

  const handlePaymentSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleProceed = async () => {
    if (!selectedMethod) return;
    
    setIsProcessing(true);
    
    try {
      if (selectedMethod === "square") {
        // Square SDK integration will go here
        console.log("Processing Square payment");
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (selectedMethod === "trust-wallet") {
        // Trust Wallet integration will go here
        console.log("Processing Trust Wallet payment");
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      onPaymentSuccess?.(selectedMethod);
      onClose();
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedMethod("");
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
              <DialogDescription>Select your preferred way to pay</DialogDescription>
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
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

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
            disabled={!selectedMethod || isProcessing}
            className="px-8"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              `Continue with ${selectedMethod === "square" ? "Square" : selectedMethod === "trust-wallet" ? "Trust Wallet" : "Payment"}`
            )}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            🔒 Your payment information is secure and encrypted
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;