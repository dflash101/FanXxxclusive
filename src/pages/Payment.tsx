import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Payment = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const navigate = useNavigate();

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

  const handleProceed = () => {
    if (selectedMethod === "square") {
      // Integrate with Square SDK
      console.log("Proceeding with Square payment");
    } else if (selectedMethod === "trust-wallet") {
      // Integrate with Trust Wallet
      console.log("Proceeding with Trust Wallet payment");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Choose Payment Method</h1>
            <p className="text-muted-foreground">Select your preferred way to pay</p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;
            
            return (
              <Card 
                key={method.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => handlePaymentSelect(method.id)}
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
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="px-8"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleProceed}
            disabled={!selectedMethod}
            className="px-8"
          >
            Continue with {selectedMethod === "square" ? "Square" : selectedMethod === "trust-wallet" ? "Trust Wallet" : "Payment"}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            🔒 Your payment information is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payment;