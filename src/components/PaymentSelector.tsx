
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
  { id: 'credit-card', label: '信用卡', icon: CreditCard },
  { id: 'cash', label: '現金', icon: DollarSign },
  { id: 'payme', label: 'PAYME', icon: Smartphone }, // Changed from mobile-payment to payme
];

const PaymentSelector: React.FC<PaymentSelectorProps> = ({ onPaymentSelect, totalAmount }) => {
  const [selectedMethod, setSelectedMethod] = useState<string | undefined>(undefined);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "請選擇付款方式",
        description: "請選擇一種付款方式以繼續。",
        variant: "destructive",
      });
      return;
    }
    setIsProcessingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate some processing time

    if (selectedMethod === 'payme') {
      toast({
        title: "PAYME 支付請求",
        description: (
          <>
            <p className="mb-2">請點擊以下模擬連結以 PAYME 完成 HK${totalAmount.toFixed(2)} 的支付：</p>
            <Button
              variant="link"
              className="p-0 h-auto text-base text-blue-600 hover:text-blue-700 underline"
              onClick={(e) => {
                e.preventDefault();
                // Simulate completing the payment via PayMe
                console.log('Simulating PayMe payment completion for: HK$', totalAmount.toFixed(2));
                setIsProcessingPayment(true); // Show loader again for this "second step"
                setTimeout(() => {
                  toast({ 
                    title: 'PAYME 付款成功 (模擬)', 
                    description: `已成功使用 PAYME 支付 HK$${totalAmount.toFixed(2)}。`, 
                    className: "bg-green-500 text-white border-green-600",
                    duration: 5000 
                  });
                  onPaymentSelect(selectedMethod); // Notify parent about successful payment
                  setIsProcessingPayment(false);
                }, 1000);
              }}
            >
              [模擬 PAYME 付款連結]
            </Button>
          </>
        ),
        variant: "default",
        duration: 20000, // Keep toast longer for user interaction
      });
      onPaymentSelect(selectedMethod); // Call this to log selection, actual "success" is via link
      setIsProcessingPayment(false); // Initial processing done, waiting for link click
      return; 
    }

    // For other payment methods
    const selectedOptionDetails = paymentOptions.find(option => option.id === selectedMethod);
    const paymentMethodLabel = selectedOptionDetails ? selectedOptionDetails.label : selectedMethod;

    toast({
      title: "付款成功！",
      description: `您使用 ${paymentMethodLabel} 支付的 HK$${totalAmount.toFixed(2)} 訂單已確認。`,
      variant: "default",
      className: "bg-green-500 text-white border-green-600"
    });
    onPaymentSelect(selectedMethod);
    setIsProcessingPayment(false);
  };
  
  if (totalAmount === 0) {
    return null; 
  }

  return (
    <Card className="w-full shadow-xl mt-8 animate-subtle-appear" style={{animationDelay: '0.4s'}}>
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center">
            <Landmark className="w-8 h-8 mr-3 text-accent" />
            選擇付款方式
        </CardTitle>
        <CardDescription className="text-lg">
          選擇您希望如何支付訂單。
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
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMethod(option.id);}}
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
            aria-label="確認並付款"
        >
          {isProcessingPayment ? (
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-6 w-6 group-hover:animate-subtle-pulse" />
          )}
          {isProcessingPayment ? '正在處理付款...' : `確認並支付 HK$${totalAmount.toFixed(2)}`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PaymentSelector;
