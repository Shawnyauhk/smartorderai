"use client";

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Landmark, Smartphone, DollarSign, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentSelectorProps {
  onPaymentSelect: (paymentMethod: string) => void;
  totalAmount: number;
}

const paymentOptions = [
  { id: 'credit-card', label: 'Credit Card', icon: CreditCard },
  { id: 'cash', label: 'Cash', icon: DollarSign },
  { id: 'mobile-payment', label: 'Mobile Payment', icon: Smartphone },
];

const PaymentSelector: React.FC<PaymentSelectorProps> = ({ onPaymentSelect, totalAmount }) => {
  const [selectedMethod, setSelectedMethod] = useState<string | undefined>(undefined);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessingPayment(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    onPaymentSelect(selectedMethod);
    toast({
      title: "Payment Successful!",
      description: `Your order for $${totalAmount.toFixed(2)} with ${selectedMethod} has been confirmed.`,
      variant: "default",
      className: "bg-green-500 text-white border-green-600"
    });
    setIsProcessingPayment(false);
    // Here you would typically navigate to an order confirmation page or clear the cart
  };
  
  if (totalAmount === 0) {
    return null; // Don't show payment selector if there's no order
  }

  return (
    <Card className="w-full shadow-xl mt-8 animate-subtle-appear" style={{animationDelay: '0.4s'}}>
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center">
            <Landmark className="w-8 h-8 mr-3 text-accent" />
            Choose Payment Method
        </CardTitle>
        <CardDescription className="text-lg">
          Select how you'd like to pay for your order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentOptions.map((option) => (
            <Label
              key={option.id}
              htmlFor={option.id}
              className={
                `flex flex-col items-center justify-center rounded-md border-2 p-6 hover:border-primary cursor-pointer transition-all duration-300 ease-in-out
                ${selectedMethod === option.id ? 'border-primary bg-primary/10 shadow-lg scale-105' : 'border-muted hover:bg-muted/50'}`
              }
            >
              <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
              <option.icon className={`mb-3 h-10 w-10 ${selectedMethod === option.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
              <span className={`text-lg font-medium ${selectedMethod === option.id ? 'text-primary' : 'text-foreground'}`}>{option.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button 
            onClick={handlePayment} 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 group transition-all duration-300 ease-in-out transform hover:scale-105"
            disabled={!selectedMethod || isProcessingPayment}
            aria-label="Confirm and Pay"
        >
          {isProcessingPayment ? (
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-6 w-6 group-hover:animate-subtle-pulse" />
          )}
          {isProcessingPayment ? 'Processing Payment...' : `Confirm & Pay $${totalAmount.toFixed(2)}`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PaymentSelector;
