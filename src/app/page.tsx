
"use client";

import { useState } from 'react';
import { parseOrder } from '@/ai/flows/parse-order.ts';
import type { ParseOrderOutput, ParsedAiOrderItem } from '@/ai/flows/parse-order.ts';
import type { CartItem, Product } from '@/types';
import { findProductByName, mockProducts } from '@/lib/product-data';
import OrderForm from '@/components/OrderForm';
import OrderSummaryDisplay from '@/components/OrderSummaryDisplay';
import PaymentSelector from '@/components/PaymentSelector';
import ManualOrderSection from '@/components/ManualOrderSection';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Check, X, ShoppingCart, Edit3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export default function HomePage() {
  const [parsedOrderItems, setParsedOrderItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderAttempted, setOrderAttempted] = useState(false);
  
  const [aiSuggestedItems, setAiSuggestedItems] = useState<ParsedAiOrderItem[]>([]);
  const [showAiConfirmation, setShowAiConfirmation] = useState(false);

  const { toast } = useToast();

  const recalculateTotal = (items: CartItem[]) => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const handleOrderSubmit = async (orderText: string) => {
    setIsProcessingOrder(true);
    setOrderAttempted(true);
    setShowAiConfirmation(false);
    setAiSuggestedItems([]);

    try {
      const result: ParseOrderOutput = await parseOrder({ orderText });
      
      if (!result || !result.orderItems || result.orderItems.length === 0) {
        toast({
          title: "未能理解訂單",
          description: "抱歉，AI無法從您的描述中解析出任何有效的餐點。請嘗試更清晰地描述，或使用手動選擇功能。",
          variant: "destructive",
        });
        setIsProcessingOrder(false);
        return;
      }
      setAiSuggestedItems(result.orderItems);
      setShowAiConfirmation(true);

    } catch (error) {
      console.error("Error parsing order:", error);
      toast({
        title: "AI處理錯誤",
        description: "AI在解析您的訂單時遇到問題，請重試。",
        variant: "destructive",
      });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleConfirmAiSuggestions = () => {
    let currentCartItems = [...parsedOrderItems];
    let newItemsAddedCount = 0;
    let itemsNotFoundStrings: string[] = [];
    let ambiguousItemsInfo: string[] = [];

    aiSuggestedItems.forEach((aiItem) => {
      if (aiItem.isAmbiguous && aiItem.alternatives && aiItem.alternatives.length > 0) {
        const alternativesText = aiItem.alternatives.join(' 或 ');
        ambiguousItemsInfo.push(`對於 "${aiItem.item}"，AI 認為可能是：${alternativesText}。`);
        return; 
      }

      const product = findProductByName(aiItem.item);
      if (product) {
        const existingItemIndex = currentCartItems.findIndex(
          (cartItem) => cartItem.productId === product.id && cartItem.specialRequests === (aiItem.specialRequests || undefined)
        );

        if (existingItemIndex > -1) {
          currentCartItems[existingItemIndex].quantity += aiItem.quantity;
        } else {
          currentCartItems.push({
            productId: product.id,
            name: product.name,
            quantity: aiItem.quantity,
            unitPrice: product.price,
            specialRequests: aiItem.specialRequests,
            imageUrl: product.imageUrl,
            "data-ai-hint": product["data-ai-hint"],
          });
        }
        newItemsAddedCount++;
      } else {
        itemsNotFoundStrings.push(aiItem.item);
      }
    });

    const newTotal = recalculateTotal(currentCartItems);
    setParsedOrderItems(currentCartItems);
    setTotalAmount(newTotal);

    if (ambiguousItemsInfo.length > 0) {
      toast({
        title: "部分項目需要釐清",
        description: (
          <div>
            {ambiguousItemsInfo.map((info, idx) => <p key={idx}>{info}</p>)}
            <p className="mt-2">請您更明確地指出這些項目，或使用手動選擇功能。其他無歧義的項目已（或嘗試）加入訂單。</p>
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      });
    }

    if (newItemsAddedCount > 0 && itemsNotFoundStrings.length === 0 && ambiguousItemsInfo.length === 0) {
      toast({
        title: "訂單已更新！",
        description: "AI建議的餐點已成功加入您的訂單。",
        variant: "default",
        className: "bg-green-500 text-white border-green-600"
      });
    } else if (newItemsAddedCount > 0 && itemsNotFoundStrings.length > 0) {
      toast({
        title: "部分餐點已加入",
        description: `AI建議的部分餐點已加入。未能找到：${itemsNotFoundStrings.join('、')}。`,
        variant: "destructive",
        duration: 7000,
      });
    } else if (newItemsAddedCount === 0 && itemsNotFoundStrings.length > 0 && ambiguousItemsInfo.length === 0 ) {
       toast({
        title: "未能加入AI建議餐點",
        description: `AI建議的餐點均未能找到：${itemsNotFoundStrings.join('、')}。`,
        variant: "destructive",
      });
    }
    
    setShowAiConfirmation(false);
    setAiSuggestedItems([]);
  };

  const handleCancelAiSuggestions = () => {
    setShowAiConfirmation(false);
    setAiSuggestedItems([]);
    toast({
      title: "已取消AI建議",
      description: "您可以重新輸入或手動選擇餐點。",
    });
  };

  const handleAddToCartFromManualSelection = (productToAdd: Product) => {
    setOrderAttempted(true); 
    setShowAiConfirmation(false); 
    setAiSuggestedItems([]); 

    setParsedOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === productToAdd.id && !item.specialRequests 
      );
      let newItems = [...prevItems];
      if (existingItemIndex > -1) {
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + 1,
        };
      } else {
        newItems.push({
          productId: productToAdd.id,
          name: productToAdd.name,
          quantity: 1,
          unitPrice: productToAdd.price,
          specialRequests: undefined, 
          imageUrl: productToAdd.imageUrl,
          "data-ai-hint": productToAdd["data-ai-hint"],
        });
      }
      setTotalAmount(recalculateTotal(newItems));
      return newItems;
    });

    toast({
      title: "已加入購物車",
      description: `${productToAdd.name} 已成功加入您的訂單。`,
      variant: "default",
    });
  };

  const handleUpdateCartItemQuantity = (productId: string, newQuantity: number) => {
    setParsedOrderItems(prevItems => {
      let updatedItems;
      if (newQuantity <= 0) {
        updatedItems = prevItems.filter(item => item.productId !== productId);
      } else {
        updatedItems = prevItems.map(item =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        );
      }
      setTotalAmount(recalculateTotal(updatedItems));
      return updatedItems;
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setParsedOrderItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.productId !== productId);
      setTotalAmount(recalculateTotal(updatedItems));
      return updatedItems;
    });
    toast({
      title: "餐點已移除",
      description: "已從您的訂單中移除該餐點。",
    });
  };

  const handlePaymentSelection = (paymentMethod: string) => {
    console.log(`Payment method selected: ${paymentMethod}, Final Order: `, parsedOrderItems, `Total: HK$${totalAmount.toFixed(2)}`);
  };

  const showOrderSummary = parsedOrderItems.length > 0;

  return (
    <div className="space-y-12">
      <OrderForm onOrderSubmit={handleOrderSubmit} isProcessing={isProcessingOrder} />
      
      {isProcessingOrder && (
         <div className="text-center py-8">
            <p className="text-lg text-muted-foreground animate-pulse">AI正在努力為您分析訂單...</p>
         </div>
      )}

      {showAiConfirmation && aiSuggestedItems.length > 0 && (
        <Card className="mt-8 shadow-lg border-primary animate-subtle-appear">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <Edit3 className="w-7 h-7 mr-3 text-accent" />
              AI 為您建議的訂單
            </CardTitle>
            <CardDescription>
              這是AI根據您的描述理解的內容。請確認是否正確，或取消以重新輸入。
              對於標記為模糊的項目，AI會列出可能的選項，請您在確認前先作判斷。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiSuggestedItems.map((item, index) => (
              <div key={index} className={`p-3 border rounded-md ${item.isAmbiguous ? 'border-destructive bg-destructive/10' : 'bg-muted/50'}`}>
                <p className="font-semibold text-foreground">{item.item} <span className="text-sm text-muted-foreground">(數量: {item.quantity})</span></p>
                {item.specialRequests && item.specialRequests.toLowerCase() !== 'string' && item.specialRequests.trim() !== '' && (
                  <p className="text-xs text-primary">特別要求: {item.specialRequests}</p>
                )}
                {item.isAmbiguous && item.alternatives && item.alternatives.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-destructive-foreground font-medium">此項目可能指：</p>
                    <ul className="list-disc list-inside text-xs text-destructive-foreground/80 pl-4">
                      {item.alternatives.map(alt => <li key={alt}>{alt}</li>)}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-1">請手動添加您想要的具體項目。</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="outline" onClick={handleCancelAiSuggestions} className="w-full sm:w-auto">
              <X className="mr-2 h-4 w-4" />
              取消並重新輸入
            </Button>
            <Button onClick={handleConfirmAiSuggestions} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
              <Check className="mr-2 h-4 w-4" />
              確認並加入無歧義項目
            </Button>
          </CardFooter>
        </Card>
      )}

      <Separator />

      <ManualOrderSection 
        allProducts={mockProducts} 
        onProductAddToCart={handleAddToCartFromManualSelection} 
      />
      
      {showOrderSummary && (
        <>
          <Separator className="my-8 border-2 border-dashed border-primary/50" />
          <OrderSummaryDisplay 
            items={parsedOrderItems} 
            totalAmount={totalAmount}
            onUpdateQuantity={handleUpdateCartItemQuantity}
            onRemoveItem={handleRemoveCartItem}
          />
          <PaymentSelector onPaymentSelect={handlePaymentSelection} totalAmount={totalAmount} />
        </>
      )}
      
      {!isProcessingOrder && orderAttempted && !showAiConfirmation && !showOrderSummary && (
         <Alert variant="destructive" className="mt-8">
           <AlertCircle className="h-5 w-5" />
           <AlertTitle className="font-headline">訂單為空</AlertTitle>
           <AlertDescription>
             您的購物車目前是空的。請嘗試 AI 點餐或使用手動選擇餐點功能。
           </AlertDescription>
         </Alert>
      )}
    </div>
  );
}
