
"use client";

import type React from 'react';
import type { CartItem } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Tag, CheckCircle, PlusCircle, MinusCircle, Trash2, ShoppingBag } from 'lucide-react';

interface OrderSummaryDisplayProps {
  items: CartItem[];
  totalAmount: number;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

const OrderSummaryDisplay: React.FC<OrderSummaryDisplayProps> = ({ items, totalAmount, onUpdateQuantity, onRemoveItem }) => {
  if (items.length === 0) {
    return (
        <Card className="w-full shadow-xl mt-8 animate-subtle-appear">
            <CardHeader>
                <CardTitle className="font-headline text-3xl text-primary flex items-center">
                    <ShoppingCart className="w-8 h-8 mr-3 text-accent" />
                    我的訂單
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg text-muted-foreground text-center py-8">您的購物車是空的。</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl mt-8 animate-subtle-appear" style={{animationDelay: '0.2s'}}>
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center">
            <ShoppingCart className="w-8 h-8 mr-3 text-accent" />
            我的訂單
        </CardTitle>
        <CardDescription className="text-lg">
          請在付款前檢查下方的訂單詳情。您可以修改數量或移除餐點。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          {items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="mb-4 p-4 border border-border rounded-lg bg-card/50 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-center mb-2 sm:mb-0 flex-grow">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="rounded-md mr-4 object-cover flex-shrink-0"
                      data-ai-hint={item['data-ai-hint'] || 'food item'}
                    />
                  )}
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold font-headline text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      單價: HK$${item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)} aria-label={`減少 ${item.name} 數量`}>
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium w-8 text-center" aria-live="polite">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)} aria-label={`增加 ${item.name} 數量`}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                 <p className="text-lg font-semibold text-primary sm:ml-4 w-28 text-right flex-shrink-0">
                    HK$${(item.quantity * item.unitPrice).toFixed(2)}
                 </p>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onRemoveItem(item.productId)} aria-label={`移除 ${item.name}`}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
              </div>
              {item.specialRequests && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <Badge variant="secondary" className="text-sm whitespace-normal break-all">
                    <UtensilsCrossed className="w-4 h-4 mr-2 flex-shrink-0" /> 特別要求： {item.specialRequests}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-4 pt-6 border-t border-border">
        <Separator />
        <div className="flex justify-between items-center text-2xl font-bold mt-4">
          <span className="font-headline text-primary flex items-center"><Tag className="w-6 h-6 mr-2"/>總金額：</span>
          <span className="text-accent">HK$${totalAmount.toFixed(2)}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default OrderSummaryDisplay;

