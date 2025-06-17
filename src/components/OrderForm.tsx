
"use client";

import type React from 'react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Send, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderFormProps {
  onOrderSubmit: (orderText: string) => Promise<void>;
  isProcessing: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({ onOrderSubmit, isProcessing }) => {
  const [orderText, setOrderText] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderText.trim()) {
      toast({
        title: "訂單空白",
        description: "請輸入您的訂單詳情。",
        variant: "destructive",
      });
      return;
    }
    await onOrderSubmit(orderText);
  };

  const handleVoiceInput = () => {
    toast({
      title: "語音輸入",
      description: "語音輸入功能尚未實現。請手動輸入您的訂單。",
    });
  };

  const handleClearInput = () => {
    setOrderText('');
  };

  return (
    <Card className="w-full shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center">
          <Mic className="w-8 h-8 mr-3 text-accent" />
          開始點餐
        </CardTitle>
        <CardDescription className="text-lg">
          <p>請告訴我們您想點什麼！您可以在下方輸入您的訂單。</p>
          <p>例如：「我想要兩個仙草三號，一份葡撻雞蛋仔和一杯手打香水檸檬茶。」</p>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full gap-4">
            <Textarea
              placeholder="請在此輸入您的訂單..."
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
              rows={5}
              className="text-base border-2 border-input focus:border-primary transition-colors duration-300"
              aria-label="Order input"
              disabled={isProcessing}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                onClick={handleVoiceInput} 
                variant="outline" 
                className="w-full sm:flex-1 justify-center group"
                disabled={isProcessing}
                aria-label="使用語音輸入 (模擬)"
              >
                <Mic className="w-5 h-5 mr-2 group-hover:text-primary transition-colors" /> 
                語音輸入 (模擬)
              </Button>
              <Button
                type="button"
                onClick={handleClearInput}
                variant="outline"
                className="w-full sm:flex-1 justify-center group"
                disabled={!orderText || isProcessing}
                aria-label="清除輸入內容"
              >
                <XCircle className="w-5 h-5 mr-2 group-hover:text-destructive transition-colors" />
                清除內容
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6 group transition-all duration-300 ease-in-out transform hover:scale-105" 
            disabled={isProcessing}
            aria-label="處理訂單"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              <Send className="mr-2 h-6 w-6 group-hover:animate-ping-once" style={{ '--ping-duration': '0.8s' } as React.CSSProperties} />
            )}
            {isProcessing ? '處理中...' : '處理訂單'}
          </Button>
        </CardFooter>
      </form>
      <style jsx global>{`
        @keyframes ping-once {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .group-hover\\:animate-ping-once:hover .lucide-send {
          animation: ping-once var(--ping-duration) cubic-bezier(0,0,.2,1);
        }
      `}</style>
    </Card>
  );
};

export default OrderForm;
