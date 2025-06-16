
"use client";

import { useState } from 'react';
import { parseOrder } from '@/ai/flows/parse-order.ts';
import type { ParseOrderOutput } from '@/ai/flows/parse-order.ts';
import type { CartItem, ParsedAiOrderItem, Product } from '@/types';
import { findProductByName, mockProducts } from '@/lib/product-data';
import OrderForm from '@/components/OrderForm';
import OrderSummaryDisplay from '@/components/OrderSummaryDisplay';
import PaymentSelector from '@/components/PaymentSelector';
import ManualOrderSection from '@/components/ManualOrderSection';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Info, PlusCircle as PlusCircleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export default function HomePage() {
  const [parsedOrderItems, setParsedOrderItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderAttempted, setOrderAttempted] = useState(false);
  const { toast } = useToast();

  const handleOrderSubmit = async (orderText: string) => {
    setIsProcessingOrder(true);
    setOrderAttempted(true);
    // Clear previous AI parsed items, but keep manually added ones if desired (not implemented here, clears all)
    // For now, let's assume AI order overrides or starts fresh for simplicity matching original behavior
    setParsedOrderItems([]); 
    setTotalAmount(0);

    try {
      const result: ParseOrderOutput = await parseOrder({ orderText });
      
      if (!result || !result.orderItems || result.orderItems.length === 0) {
        toast({
          title: "未能理解訂單",
          description: "抱歉，我們無法理解您的訂單。請嘗試重新描述或說得更具體一些。",
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
          title: "部分食品未能找到",
          description: `未能找到：${itemsNotFound.join('、')}。請檢查我們的餐牌或重試。其他食品已成功加入。`,
          variant: "destructive",
          duration: 7000,
        });
      } else if (currentCartItems.length > 0) {
        toast({
          title: "訂單已處理！",
          description: "您的訂單已成功處理。請於下方核對。",
          variant: "default",
          className: "bg-green-500 text-white border-green-600"
        });
      } else {
         toast({
          title: "未找到有效食品",
          description: "我們在餐牌中找不到您訂單中的任何有效食品。",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error parsing order:", error);
      toast({
        title: "處理錯誤",
        description: "處理您的訂單時發生錯誤，請重試。",
        variant: "destructive",
      });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleAddToCartFromManualSelection = (productToAdd: Product) => {
    setOrderAttempted(true);
    setParsedOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === productToAdd.id && !item.specialRequests // Simple check for existing item without special requests
      );
      let newItems = [...prevItems];
      if (existingItemIndex > -1) {
        // Item already exists, increase quantity
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + 1,
        };
      } else {
        // Add new item
        newItems.push({
          productId: productToAdd.id,
          name: productToAdd.name,
          quantity: 1,
          unitPrice: productToAdd.price,
          specialRequests: undefined, // For now, special requests only via AI or future enhancement
          imageUrl: productToAdd.imageUrl,
          "data-ai-hint": productToAdd["data-ai-hint"],
        });
      }
      return newItems;
    });

    setTotalAmount(prevTotal => prevTotal + productToAdd.price);

    toast({
      title: "已加入購物車",
      description: `${productToAdd.name} 已成功加入您的訂單。`,
      variant: "default",
      // className: "bg-green-500 text-white border-green-600" // Using default style
    });
  };


  const handlePaymentSelection = (paymentMethod: string) => {
    console.log(`Payment method selected: ${paymentMethod}, Total: HK$${totalAmount.toFixed(2)}`);
  };

  const availableCategories = Array.from(new Set(mockProducts.map(p => p.category)));

  const showOrderSummary = parsedOrderItems.length > 0;

  return (
    <div className="space-y-12">
      <Alert variant="default" className="bg-accent/20 border-accent/50">
        <Info className="h-5 w-5 text-accent" />
        <AlertTitle className="font-headline text-accent">歡迎使用智能點餐AI！</AlertTitle>
        <AlertDescription>
          您可以自然地輸入您的訂單，例如：「我想要兩個經典漢堡，一個不要洋蔥，還有一杯大杯可樂。」我們的AI會為您處理。
          或者，您也可以在下方按產品系列瀏覽並手動加入餐點。
          請查看我們的 <Link href="/admin/products" className="underline hover:text-primary">完整餐牌</Link> 以了解供應的食品。
          <div className="mt-2">
            <span className="font-semibold">供應類別：</span> {availableCategories.join('、 ')}.
          </div>
        </AlertDescription>
      </Alert>

      <OrderForm onOrderSubmit={handleOrderSubmit} isProcessing={isProcessingOrder} />

      <Separator />

      <ManualOrderSection 
        allProducts={mockProducts} 
        onProductAddToCart={handleAddToCartFromManualSelection} 
      />

      {isProcessingOrder && !showOrderSummary && (
         <div className="text-center py-8">
            <p className="text-lg text-muted-foreground animate-pulse">AI正在努力為您分析訂單...</p>
         </div>
      )}
      
      {showOrderSummary && (
        <>
          <Separator className="my-8 border-2 border-dashed border-primary/50" />
          <OrderSummaryDisplay items={parsedOrderItems} totalAmount={totalAmount} />
          <PaymentSelector onPaymentSelect={handlePaymentSelection} totalAmount={totalAmount} />
        </>
      )}
      
      {!isProcessingOrder && orderAttempted && !showOrderSummary && (
         <Alert variant="destructive" className="mt-8">
           <AlertCircle className="h-5 w-5" />
           <AlertTitle className="font-headline">訂單為空或未找到產品</AlertTitle>
           <AlertDescription>
             我們無法找到您訂單中的產品，或購物車目前是空的。
             請嘗試重新描述您的AI訂單，或使用手動選擇餐點功能，或查看我們的 <Link href="/admin/products" className="underline hover:text-destructive-foreground/80">餐牌</Link>。
           </AlertDescription>
         </Alert>
      )}
    </div>
  );
}
