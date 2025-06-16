"use client";

import type React from 'react';
import type { CartItem } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { UtensilsCrossed, Tag, CheckCircle } from 'lucide-react';

interface OrderSummaryDisplayProps {
  items: CartItem[];
  totalAmount: number;
}

const OrderSummaryDisplay: React.FC<OrderSummaryDisplayProps> = ({ items, totalAmount }) => {
  if (items.length === 0) {
    return null; 
  }

  return (
    <Card className="w-full shadow-xl mt-8 animate-subtle-appear" style={{animationDelay: '0.2s'}}>
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center">
            <CheckCircle className="w-8 h-8 mr-3 text-accent" />
            Order Summary
        </CardTitle>
        <CardDescription className="text-lg">
          Please review your order details below before proceeding to payment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="mb-6 p-4 border border-border rounded-lg bg-card/50 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex items-center mb-2 sm:mb-0">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="rounded-md mr-4 object-cover"
                      data-ai-hint={item['data-ai-hint'] || 'food item'}
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold font-headline text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x ${item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-primary">${(item.quantity * item.unitPrice).toFixed(2)}</p>
              </div>
              {item.specialRequests && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <Badge variant="secondary" className="text-sm">
                    <UtensilsCrossed className="w-4 h-4 mr-2" /> Special Request: {item.specialRequests}
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
          <span className="font-headline text-primary flex items-center"><Tag className="w-6 h-6 mr-2"/>Total Amount:</span>
          <span className="text-accent">${totalAmount.toFixed(2)}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default OrderSummaryDisplay;
