
"use client";

import { useState, useRef } from 'react'; 
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
import { AlertCircle, Check, X, ShoppingCart, Edit3, CheckCircle, LayoutGrid } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HomePage() {
  const [parsedOrderItems, setParsedOrderItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderAttempted, setOrderAttempted] = useState(false);
  
  const [aiSuggestedItems, setAiSuggestedItems] = useState<ParsedAiOrderItem[]>([]);
  const [showAiConfirmation, setShowAiConfirmation] = useState(false);
  const [isManualOrderDialogOpen, setIsManualOrderDialogOpen] = useState(false);

  const scrollableContentRef = useRef<HTMLDivElement | null>(null);

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

  const handleAddSpecificAiSuggestion = (aiItemToAdd: ParsedAiOrderItem) => {
    const product = findProductByName(aiItemToAdd.item);
    if (product) {
      setParsedOrderItems(prevItems => {
          let currentCartItems = [...prevItems];
          const existingItemIndex = currentCartItems.findIndex(
            (cartItem) => cartItem.productId === product.id && cartItem.specialRequests === (aiItemToAdd.specialRequests || undefined)
          );
  
          if (existingItemIndex > -1) {
            currentCartItems[existingItemIndex].quantity += aiItemToAdd.quantity;
          } else {
            currentCartItems.push({
              productId: product.id,
              name: product.name,
              quantity: aiItemToAdd.quantity,
              unitPrice: product.price,
              specialRequests: aiItemToAdd.specialRequests,
              imageUrl: product.imageUrl,
              "data-ai-hint": product["data-ai-hint"],
            });
          }
          setTotalAmount(recalculateTotal(currentCartItems));
          return currentCartItems;
      });
  
      toast({
        title: "已加入購物車",
        description: `${product.name} (x${aiItemToAdd.quantity}) 已成功加入您的訂單。`,
        variant: "default",
        className: "bg-green-500 text-white border-green-600"
      });
  
      let itemRemoved = false;
      const newAiSuggestedItems = aiSuggestedItems.filter(suggestion => {
          if (!itemRemoved && suggestion.item === aiItemToAdd.item && suggestion.quantity === aiItemToAdd.quantity && suggestion.specialRequests === aiItemToAdd.specialRequests) {
              itemRemoved = true;
              return false; 
          }
          return true; 
      });
  
      if (newAiSuggestedItems.length === 0) {
        setShowAiConfirmation(false);
        setAiSuggestedItems([]);
      } else {
        setAiSuggestedItems(newAiSuggestedItems);
      }
  
    } else {
      toast({
        title: "未能加入餐點",
        description: `抱歉，未能找到餐點 "${aiItemToAdd.item}"。`,
        variant: "destructive",
      });
      
      let itemRemovedErrorCase = false;
      const newAiSuggestedItemsErrorCase = aiSuggestedItems.filter(suggestion => {
        if(!itemRemovedErrorCase && suggestion.item === aiItemToAdd.item && suggestion.quantity === aiItemToAdd.quantity && suggestion.specialRequests === aiItemToAdd.specialRequests) {
            itemRemovedErrorCase = true;
            return false;
        }
        return true;
      });

      if (newAiSuggestedItemsErrorCase.length === 0) {
        setShowAiConfirmation(false);
        setAiSuggestedItems([]);
      } else {
        setAiSuggestedItems(newAiSuggestedItemsErrorCase);
      }
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
        ambiguousItemsInfo.push(`關於「${aiItem.item}」(您要求 ${aiItem.quantity}份)，AI 認為可能是以下其中之一：${alternativesText}。`);
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
              這是AI根據您的描述理解的內容。您可以點擊單個項目加入購物車，或確認加入全部建議。
              對於有歧義的項目，AI會列出可能的選項，請您在確認前先作判斷。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {aiSuggestedItems.map((item, index) => {
              const isItemAmbiguous = item.isAmbiguous && item.alternatives && item.alternatives.length > 0;
              const sr = item.specialRequests;
              const showSpecialRequestsLine = sr && sr.trim() !== '' && sr.toLowerCase() !== 'string' && !sr.startsWith('N/A (This key was typoed') && !sr.startsWith('string, not applicable here, this should be omitted or null or empty string if no special requests');

              if (isItemAmbiguous) {
                return (
                  <div key={`${item.item}-${index}-ambiguous`} className="p-3 border rounded-md border-destructive bg-destructive/10">
                    <p className="font-semibold text-destructive-foreground">
                      關於「{item.item}」(您要求 {item.quantity}份)，AI 認為可能是以下其中之一：
                    </p>
                    <ul className="list-disc list-inside text-sm text-destructive-foreground/90 pl-4 mt-2 space-y-1">
                      {item.alternatives!.map(alt => <li key={alt}>{alt}</li>)}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-3">
                      由於無法確定，請您從上方選項中選擇一項，並使用「手動選擇餐點」功能將其加入訂單，或更清晰地重新描述此項目。
                    </p>
                  </div>
                );
              } else {
                return (
                  <Button
                    key={`${item.item}-${index}-suggestion`}
                    variant="outline"
                    onClick={() => handleAddSpecificAiSuggestion(item)}
                    className="w-full justify-start text-left p-3 h-auto border rounded-md bg-muted/30 hover:bg-muted/70 focus:ring-2 focus:ring-primary transition-all group"
                    aria-label={`選擇並加入 ${item.item}`}
                  >
                    <div className="flex-grow">
                      <p className="font-semibold text-foreground group-hover:text-primary">{item.item} <span className="text-sm text-muted-foreground">(數量: {item.quantity})</span></p>
                      {showSpecialRequestsLine && (
                        <p className="text-xs text-primary mt-1">特別要求: {item.specialRequests}</p>
                      )}
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity ml-4" />
                  </Button>
                );
              }
            })}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
            <Button variant="outline" onClick={handleCancelAiSuggestions} className="w-full sm:w-auto">
              <X className="mr-2 h-4 w-4" />
              取消並重新輸入
            </Button>
            <Button onClick={handleConfirmAiSuggestions} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
              <Check className="mr-2 h-4 w-4" />
              確認並加入項目
            </Button>
          </CardFooter>
        </Card>
      )}

      <Separator />
      
      <div className="flex justify-center my-6">
        <Button 
          onClick={() => setIsManualOrderDialogOpen(true)}
          variant="outline" 
          className="border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 text-xl py-4"
        >
          <LayoutGrid className="mr-2 h-6 w-6" />
          手動選擇餐點
        </Button>
      </div>

      <Dialog open={isManualOrderDialogOpen} onOpenChange={setIsManualOrderDialogOpen}>
        <DialogContent className="fixed inset-0 w-screen h-screen max-w-none rounded-none border-0 shadow-none flex flex-col p-0">
           <DialogHeader className="p-6 border-b shrink-0">
            <DialogTitle className="text-3xl font-headline text-primary flex items-center">
              <LayoutGrid className="w-8 h-8 mr-3 text-accent" />
              手動選擇餐點
            </DialogTitle>
             <CardDescription className="text-lg text-muted-foreground mt-1">
                按產品系列瀏覽，並將產品加入您的訂單。
             </CardDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow overflow-y-auto">
            <div ref={scrollableContentRef} className="p-6">
              <ManualOrderSection 
                allProducts={mockProducts} 
                onProductAddToCart={(product) => {
                  handleAddToCartFromManualSelection(product);
                }} 
                scrollableContainerRef={scrollableContentRef}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
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
    

    




    