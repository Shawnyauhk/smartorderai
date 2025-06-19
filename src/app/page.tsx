
"use client";

import { useState, useRef } from 'react'; 
import { identifyLanguage } from '@/ai/flows/identify-language-flow.ts'; 
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
import { AlertCircle, Check, X, ShoppingCart, Edit3, CheckCircle, LayoutGrid, Languages, MessageSquareWarning, ShieldCheck, ShieldX } from 'lucide-react';
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
  const [processingStep, setProcessingStep] = useState<string | null>(null);


  const scrollableContentRef = useRef<HTMLDivElement | null>(null);

  const { toast } = useToast();

  const recalculateTotal = (items: CartItem[]) => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const handleOrderSubmit = async (orderText: string) => {
    if (!orderText.trim()) {
      toast({
        title: "訂單空白",
        description: "請輸入您的訂單詳情。",
        variant: "destructive",
      });
      return;
    }
    setIsProcessingOrder(true);
    setOrderAttempted(true);
    setShowAiConfirmation(false);
    setAiSuggestedItems([]);
    
    let identifiedLanguage = 'unknown';
    try {
      setProcessingStep("正在識別語言...");
      toast({ title: "處理中", description: "正在識別您輸入的語言..." });
      const langResult = await identifyLanguage({ textToIdentify: orderText });
      identifiedLanguage = langResult.identifiedLanguage || 'unknown';
      
      let languageDescription = identifiedLanguage;
      if (identifiedLanguage === 'yue-Hant-HK') languageDescription = '廣東話';
      else if (identifiedLanguage === 'cmn-Hans-CN') languageDescription = '普通話';
      else if (identifiedLanguage === 'en-US') languageDescription = '英語';
      else if (identifiedLanguage === 'mixed') languageDescription = '混合語言';
      else languageDescription = '未知語言';

      toast({ title: "語言識別結果", description: `AI 認為您的輸入主要是：${languageDescription}`});

      setProcessingStep(`正在解析訂單 (語言: ${languageDescription})...`);
      toast({ title: "處理中", description: `正在為您解析訂單 (已識別語言: ${languageDescription})` });
      const result: ParseOrderOutput = await parseOrder({ orderText, inputLanguage: identifiedLanguage });
      
      if (!result || !result.orderItems || result.orderItems.length === 0) {
        toast({
          title: "未能理解訂單",
          description: "抱歉，AI無法從您的描述中解析出任何有效的餐點。請嘗試更清晰地描述，或使用手動選擇功能。",
          variant: "destructive",
        });
        setIsProcessingOrder(false);
        setProcessingStep(null);
        return;
      }
      setAiSuggestedItems(result.orderItems);
      setShowAiConfirmation(true);

    } catch (error) {
      console.error("Error processing order:", error);
      toast({
        title: "AI處理錯誤",
        description: `AI在處理您的訂單時遇到問題: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessingOrder(false);
      setProcessingStep(null);
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
  
      // Filter out the exact item that was added
      const newAiSuggestedItems = aiSuggestedItems.filter(suggestion => 
        !(suggestion.item === aiItemToAdd.item && 
          suggestion.quantity === aiItemToAdd.quantity && 
          suggestion.specialRequests === aiItemToAdd.specialRequests)
      );
  
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
      
      // Filter out the exact item that failed to add
      const newAiSuggestedItemsErrorCase = aiSuggestedItems.filter(suggestion => 
        !(suggestion.item === aiItemToAdd.item && 
          suggestion.quantity === aiItemToAdd.quantity && 
          suggestion.specialRequests === aiItemToAdd.specialRequests)
      );

      if (newAiSuggestedItemsErrorCase.length === 0) {
        setShowAiConfirmation(false);
        setAiSuggestedItems([]);
      } else {
        setAiSuggestedItems(newAiSuggestedItemsErrorCase);
      }
    }
  };
  
  const handleClarifyAmbiguousItem = (ambiguousItem: ParsedAiOrderItem, chosenAlternativeName: string) => {
    const product = findProductByName(chosenAlternativeName);
    if (product) {
      setParsedOrderItems(prevItems => {
        let currentCartItems = [...prevItems];
        const existingItemIndex = currentCartItems.findIndex(
          (cartItem) => cartItem.productId === product.id && cartItem.specialRequests === (ambiguousItem.specialRequests || undefined)
        );

        if (existingItemIndex > -1) {
          currentCartItems[existingItemIndex].quantity += ambiguousItem.quantity;
        } else {
          currentCartItems.push({
            productId: product.id,
            name: product.name,
            quantity: ambiguousItem.quantity,
            unitPrice: product.price,
            specialRequests: ambiguousItem.specialRequests,
            imageUrl: product.imageUrl,
            "data-ai-hint": product["data-ai-hint"],
          });
        }
        setTotalAmount(recalculateTotal(currentCartItems));
        return currentCartItems;
      });

      toast({
        title: "已釐清並加入",
        description: `${product.name} (x${ambiguousItem.quantity}) 已成功加入您的訂單。`,
        variant: "default",
        className: "bg-green-500 text-white border-green-600"
      });
    } else {
      toast({
        title: "未能加入餐點",
        description: `抱歉，未能找到所選的餐點 "${chosenAlternativeName}"。`,
        variant: "destructive",
      });
    }

    // Remove the original ambiguous item from suggestions
    const newAiSuggestedItems = aiSuggestedItems.filter(item => item !== ambiguousItem);
    if (newAiSuggestedItems.length === 0) {
      setShowAiConfirmation(false);
      setAiSuggestedItems([]);
    } else {
      setAiSuggestedItems(newAiSuggestedItems);
    }
  };

  const handleDismissAmbiguousItem = (ambiguousItem: ParsedAiOrderItem) => {
    const newAiSuggestedItems = aiSuggestedItems.filter(item => item !== ambiguousItem);
    if (newAiSuggestedItems.length === 0) {
      setShowAiConfirmation(false);
      setAiSuggestedItems([]);
    } else {
      setAiSuggestedItems(newAiSuggestedItems);
    }
    toast({
      title: "建議已忽略",
      description: `關於 "${ambiguousItem.item}" 的建議已被忽略。`,
    });
  };


  const handleConfirmAiSuggestions = () => {
    let currentCartItems = [...parsedOrderItems];
    let newItemsAddedCount = 0;
    let itemsNotFoundStrings: string[] = [];
    let ambiguousItemsNotClarified: ParsedAiOrderItem[] = [];


    aiSuggestedItems.forEach((aiItem) => {
      if (aiItem.isAmbiguous && aiItem.alternatives && aiItem.alternatives.length > 0) {
        // Ambiguous items are skipped by "confirm all", they need manual clarification
        ambiguousItemsNotClarified.push(aiItem);
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

    if (ambiguousItemsNotClarified.length > 0) {
      const ambiguousItemNames = ambiguousItemsNotClarified.map(item => `「${item.item}」`).join('、');
      toast({
        title: "部分項目需要釐清",
        description: `AI 建議中的 ${ambiguousItemNames} 項目因有歧義，需要您手動選擇。其他無歧義的項目已嘗試加入訂單。`,
        variant: "destructive",
        duration: 10000,
      });
    }

    if (newItemsAddedCount > 0 && itemsNotFoundStrings.length === 0 && ambiguousItemsNotClarified.length === 0) {
      toast({
        title: "訂單已更新！",
        description: "AI建議的餐點已成功加入您的訂單。",
        variant: "default",
        className: "bg-green-500 text-white border-green-600"
      });
    } else if (newItemsAddedCount > 0 && (itemsNotFoundStrings.length > 0 || ambiguousItemsNotClarified.length > 0) ) {
      let desc = `AI建議的部分餐點已加入。`;
      if (itemsNotFoundStrings.length > 0) desc += ` 未能找到：${itemsNotFoundStrings.join('、')}。`;
      toast({
        title: "部分餐點已加入",
        description: desc,
        variant: "destructive",
        duration: 7000,
      });
    } else if (newItemsAddedCount === 0 && itemsNotFoundStrings.length > 0 && ambiguousItemsNotClarified.length === 0) {
       toast({
        title: "未能加入AI建議餐點",
        description: `AI建議的餐點均未能找到：${itemsNotFoundStrings.join('、')}。`,
        variant: "destructive",
      });
    }
    
    // Clear only non-ambiguous items or all if none were ambiguous
    if (ambiguousItemsNotClarified.length > 0) {
      setAiSuggestedItems(ambiguousItemsNotClarified);
    } else {
      setShowAiConfirmation(false);
      setAiSuggestedItems([]);
    }
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
      
      {isProcessingOrder && processingStep && (
         <div className="text-center py-8">
            <p className="text-lg text-muted-foreground animate-pulse flex items-center justify-center">
                <Languages className="w-6 h-6 mr-2 animate-spin" /> {processingStep}
            </p>
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
              這是AI根據您的描述理解的內容。您可以點擊單個項目加入購物車，或確認加入全部建議 (有歧義的項目需手動處理)。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiSuggestedItems.map((item, index) => {
              const isItemAmbiguous = item.isAmbiguous && item.alternatives && item.alternatives.length > 0;
              const sr = item.specialRequests;
              const showSpecialRequestsLine = sr && sr.trim() !== '' && sr.toLowerCase() !== 'string' && !sr.startsWith('N/A (This key was typoed') && !sr.startsWith('string, not applicable here, this should be omitted or null or empty string if no special requests');

              if (isItemAmbiguous) {
                return (
                  <div key={`${item.item}-${index}-ambiguous`} className="p-4 border rounded-md border-amber-500 bg-amber-500/10 shadow-sm">
                    <p className="font-semibold text-amber-700 flex items-center">
                      <MessageSquareWarning className="w-5 h-5 mr-2 flex-shrink-0"/>
                      關於「{item.item}」(您要求 {item.quantity}份)，AI 認為可能是以下其中之一：
                    </p>
                    <div className="mt-3 space-y-2 pl-2">
                      {item.alternatives!.map(alt => (
                        <Button
                          key={alt}
                          variant="outline"
                          onClick={() => handleClarifyAmbiguousItem(item, alt)}
                          className="w-full justify-start text-left p-2 h-auto border-amber-600 hover:bg-amber-600/20 focus:ring-amber-500 group"
                          aria-label={`選擇 ${alt} 以釐清 ${item.item}`}
                        >
                           <ShieldCheck className="h-5 w-5 mr-2 text-green-600 group-hover:text-green-700 flex-shrink-0" />
                          {alt} 
                          <span className="text-xs text-muted-foreground ml-1">(數量: {item.quantity})</span>
                          {showSpecialRequestsLine && <span className="text-xs text-primary ml-2">({item.specialRequests})</span>}
                        </Button>
                      ))}
                       <Button
                        variant="ghost"
                        onClick={() => handleDismissAmbiguousItem(item)}
                        className="w-full justify-start text-left p-2 h-auto text-muted-foreground hover:bg-destructive/10 hover:text-destructive group"
                        aria-label={`忽略關於 ${item.item} 的建議`}
                      >
                         <ShieldX className="h-5 w-5 mr-2 group-hover:text-destructive flex-shrink-0" />
                        都不是，忽略此建議
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      請從上方選項中選擇一項，或忽略此建議。
                    </p>
                  </div>
                );
              } else { // Not ambiguous
                return (
                  <Button
                    key={`${item.item}-${index}-suggestion`}
                    variant="outline"
                    onClick={() => handleAddSpecificAiSuggestion(item)}
                    className="w-full justify-between items-center text-left p-3 h-auto border rounded-md bg-muted/30 hover:bg-muted/70 focus:ring-2 focus:ring-primary transition-all group"
                    aria-label={`選擇並加入 ${item.item}`}
                  >
                    <div className="flex-grow">
                      <p className="font-semibold text-foreground group-hover:text-primary">{item.item} <span className="text-sm text-muted-foreground">(數量: {item.quantity})</span></p>
                      {showSpecialRequestsLine && (
                        <p className="text-xs text-primary mt-1">特別要求: {item.specialRequests}</p>
                      )}
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0" />
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
            <Button 
                onClick={handleConfirmAiSuggestions} 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                disabled={aiSuggestedItems.every(item => item.isAmbiguous && item.alternatives && item.alternatives.length > 0) && aiSuggestedItems.length > 0} // Disable if all items are ambiguous
            >
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
          className="border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 text-5xl py-8"
        >
          <LayoutGrid className="mr-4 h-12 w-12" />
          手動選擇餐點
        </Button>
      </div>

      <Dialog open={isManualOrderDialogOpen} onOpenChange={setIsManualOrderDialogOpen}>
         <DialogContent className="max-w-5xl h-[90vh] sm:h-[80vh] flex flex-col p-0">
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
    

