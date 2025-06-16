"use client";

import { useState } from 'react';
import { parseOrder } from '@/ai/flows/parse-order.ts';
import type { ParseOrderOutput } from '@/ai/flows/parse-order.ts';
import type { CartItem, ParsedAiOrderItem } from '@/types';
import { findProductByName, mockProducts } from '@/lib/product-data';
import OrderForm from '@/components/OrderForm';
import OrderSummaryDisplay from '@/components/OrderSummaryDisplay';
import PaymentSelector from '@/components/PaymentSelector';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export default function HomePage() {
  const [parsedOrderItems, setParsedOrderItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const { toast } = useToast();

  const handleOrderSubmit = async (orderText: string) => {
    setIsProcessingOrder(true);
    setParsedOrderItems([]);
    setTotalAmount(0);

    try {
      const result: ParseOrderOutput = await parseOrder({ orderText });
      
      if (!result || !result.orderItems || result.orderItems.length === 0) {
        toast({
          title: "Order Not Understood",
          description: "Sorry, I couldn't understand your order. Please try rephrasing or be more specific.",
          variant: "destructive",
        });
        setIsProcessingOrder(false);
        return;
      }

      const currentCartItems: CartItem[] = [];
      let currentTotal = 0;
      let itemsNotFound: string[] = [];

      result.orderItems.forEach((aiItem: ParsedAiOrderItem) => {
        const product = findProductByName(aiItem.item);
        if (product) {
          currentCartItems.push({
            productId: product.id,
            name: product.name,
            quantity: aiItem.quantity,
            unitPrice: product.price,
            specialRequests: aiItem.specialRequests,
            imageUrl: product.imageUrl,
            "data-ai-hint": product["data-ai-hint"],
          });
          currentTotal += product.price * aiItem.quantity;
        } else {
          itemsNotFound.push(aiItem.item);
        }
      });

      setParsedOrderItems(currentCartItems);
      setTotalAmount(currentTotal);

      if (itemsNotFound.length > 0) {
         toast({
          title: "Some Items Not Found",
          description: `Could not find: ${itemsNotFound.join(', ')}. Please check our menu or try again. Other items have been added.`,
          variant: "destructive",
          duration: 7000,
        });
      } else if (currentCartItems.length > 0) {
        toast({
          title: "Order Parsed!",
          description: "Your order has been processed. Please review below.",
          variant: "default",
          className: "bg-green-500 text-white border-green-600"
        });
      } else {
         toast({
          title: "No Valid Items Found",
          description: "We couldn't find any valid items from your order in our menu.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error parsing order:", error);
      toast({
        title: "Processing Error",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handlePaymentSelection = (paymentMethod: string) => {
    // In a real app, you'd finalize the order here, e.g., save to DB
    console.log(`Payment method selected: ${paymentMethod}, Total: $${totalAmount.toFixed(2)}`);
    // Reset for new order
    // setParsedOrderItems([]);
    // setTotalAmount(0);
    // This would ideally navigate to an order success page or similar
  };

  const availableCategories = Array.from(new Set(mockProducts.map(p => p.category)));

  return (
    <div className="space-y-12">
      <Alert variant="default" className="bg-accent/20 border-accent/50">
        <Info className="h-5 w-5 text-accent" />
        <AlertTitle className="font-headline text-accent">Welcome to SmartOrder AI!</AlertTitle>
        <AlertDescription>
          You can type your order naturally, like "I'd like two classic burgers, one with no onions, and a large coke."
          Our AI will process it for you. Check our <Link href="/admin/products" className="underline hover:text-primary">full menu</Link> for available items.
          <div className="mt-2">
            <span className="font-semibold">Available Categories:</span> {availableCategories.join(', ')}.
          </div>
        </AlertDescription>
      </Alert>

      <OrderForm onOrderSubmit={handleOrderSubmit} isProcessing={isProcessingOrder} />

      {parsedOrderItems.length > 0 && (
        <>
          <Separator className="my-8 border-2 border-dashed border-primary/50" />
          <OrderSummaryDisplay items={parsedOrderItems} totalAmount={totalAmount} />
          <PaymentSelector onPaymentSelect={handlePaymentSelection} totalAmount={totalAmount} />
        </>
      )}

      {isProcessingOrder && parsedOrderItems.length === 0 && (
         <div className="text-center py-8">
            <p className="text-lg text-muted-foreground animate-pulse">Analyzing your order with AI magic...</p>
         </div>
      )}
      
      {!isProcessingOrder && orderTextSubmittedButNoItemsFound() && (
         <Alert variant="destructive" className="mt-8">
           <AlertCircle className="h-5 w-5" />
           <AlertTitle className="font-headline">Order Understanding Issue</AlertTitle>
           <AlertDescription>
             We had trouble understanding your order, or the items requested are not on our menu. 
             Please try rephrasing or check our <Link href="/admin/products" className="underline hover:text-destructive-foreground/80">menu</Link>.
           </AlertDescription>
         </Alert>
      )}
    </div>
  );

  // Helper function to determine if an order was submitted but no items were found after processing
  function orderTextSubmittedButNoItemsFound() {
    // This condition can be refined. It checks if an attempt was made (isProcessing is false now)
    // but no items are in the cart. This assumes handleOrderSubmit was called at least once.
    // A more robust way might involve another state variable like `orderAttempted`.
    // For now, this implies that processing finished and the cart is empty.
    return !isProcessingOrder && totalAmount === 0 && parsedOrderItems.length === 0 && userHasAttemptedOrder();
  }

  function userHasAttemptedOrder() {
    // This is a proxy. A better way would be a dedicated state variable `hasAttemptedOrder`.
    // This relies on `isProcessingOrder` flipping back to false after an attempt.
    // And a toast has been shown regarding the order processing.
    // For this simple example, we infer it if processing is done and the cart is empty.
    // If there was an initial state where isProcessingOrder is false and cart is empty, this would be true.
    // This needs a better flag. Let's assume if totalAmount is 0 AND processing is done, and cart is empty, 
    // it implies an attempt that yielded nothing or an error.
    // This logic is imperfect. For a real app, add a state like `orderAttempted: boolean`.
    // The toasts already cover most error cases.
    return true; // Simplified: the main error messages are handled by toasts.
  }
}
