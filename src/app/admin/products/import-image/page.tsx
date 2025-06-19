
"use client";

import type React from 'react';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeftCircle, UploadCloud, BrainCircuit, Loader2, FileJson, Save, ImagePlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { extractProductsFromImage } from '@/ai/flows/extract-products-from-image-flow';
import type { ExtractProductsOutput, ExtractedProduct } from '@/ai/flows/extract-products-from-image-flow';
import { collection, writeBatch, doc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ImportProductsFromImagePage() {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractProductsOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExtractedData(null); 
    setImageFiles([]);
    setImagePreviews([]);

    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      const skippedFiles: { name: string; reason: string }[] = [];

      for (const file of filesArray) {
        if (file.size > 4 * 1024 * 1024) { 
          skippedFiles.push({ name: file.name, reason: `檔案過大 (${(file.size / (1024*1024)).toFixed(2)}MB)，已略過。`});
          continue;
        }
        validFiles.push(file);
      }

      if (skippedFiles.length > 0) {
        skippedFiles.forEach(skipped => {
          toast({
            title: "圖片檔案處理注意",
            description: `圖片 "${skipped.name}": ${skipped.reason}`,
            variant: "destructive",
            duration: 7000
          });
        });
      }
      
      if (validFiles.length === 0 && filesArray.length > 0) {
         toast({
            title: "沒有有效的圖片",
            description: "所有選擇的圖片均因檔案過大而被略過。",
            variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = ""; 
        return;
      }
      
      if (validFiles.length === 0) {
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setImageFiles(validFiles);

      Promise.all(validFiles.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })).then(previews => {
        setImagePreviews(previews);
        if (validFiles.length < filesArray.length) {
           toast({
            title: "部分圖片已準備",
            description: `${validFiles.length} 張圖片已準備好進行提取。${skippedFiles.length} 張因檔案過大已被略過。`,
            variant: "default"
          });
        }
      }).catch(error => {
        console.error("Error reading files for preview:", error);
        toast({
          title: "預覽圖片失敗",
          description: "讀取圖片檔案以產生預覽時發生錯誤。",
          variant: "destructive",
        });
        setImageFiles([]);
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
    }
  };

  const handleExtract = async () => {
    if (imageFiles.length === 0 || imagePreviews.length === 0) {
      toast({
        title: "未選擇圖片",
        description: "請先上傳至少一張包含產品資料的圖片。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setExtractedData(null);
    let allAggregatedProducts: ExtractedProduct[] = [];
    let successfulImagesProcessed = 0;
    const errorDetails: {fileName: string, message: string}[] = [];


    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const preview = imagePreviews[i];
      
      try {
        toast({
          title: `正在處理圖片 (${i + 1}/${imageFiles.length})`,
          description: `分析中: ${file.name}`,
        });

        const result = await extractProductsFromImage({ 
          imageDataUri: preview,
          contextPrompt: customPrompt || undefined
        });
        
        if (result && result.extractedProducts) {
          allAggregatedProducts.push(...result.extractedProducts);
          if (result.extractedProducts.length > 0) {
            successfulImagesProcessed++;
          }
        } else {
           console.warn(`AI did not return expected output structure for ${file.name}`);
        }
      } catch (error) {
        console.error(`Error extracting products from image ${file.name}:`, error);
        let description = `AI 分析圖片 "${file.name}" 時發生錯誤。`;
        if (error instanceof Error) {
          if (error.message.includes('SAFETY')) {
              description = `圖片 "${file.name}" 內容可能違反了 AI 安全政策，無法處理。`;
          } else if (error.message.includes('4MB')) { 
              description = `圖片 "${file.name}" 檔案超過4MB上限，AI無法處理。`;
          } else {
            description = `分析圖片 "${file.name}" 時發生錯誤: ${error.message.substring(0,100)}${error.message.length > 100 ? '...' : ''}`;
          }
        }
        errorDetails.push({fileName: file.name, message: description});
      }
    }
    
    setExtractedData({ extractedProducts: allAggregatedProducts });
    setIsLoading(false);

    if (allAggregatedProducts.length > 0) {
      toast({
        title: "提取完成！",
        description: `AI 從 ${successfulImagesProcessed} 張圖片中識別到 ${allAggregatedProducts.length} 項產品。${errorDetails.length > 0 ? `${errorDetails.length} 張圖片處理失敗。` : ''}`,
        className: "bg-green-500 text-white border-green-600",
        duration: errorDetails.length > 0 ? 10000 : 7000,
      });
    } else if (errorDetails.length === imageFiles.length) { 
       toast({
          title: "所有圖片提取失敗",
          description: "AI 未能從任何上傳的圖片中識別出產品資訊。請檢查下方錯誤詳情。",
          variant: "destructive",
          duration: 10000,
        });
    } else if (errorDetails.length > 0) { 
         toast({
          title: "部分圖片提取失敗",
          description: `AI 未能從 ${errorDetails.length} 張圖片中識別產品。其他圖片處理完成。`,
          variant: "destructive",
          duration: 7000,
        });
    } else { 
         toast({
          title: "未提取到產品",
          description: "AI 未能從上傳的圖片中識別出任何產品資訊。請嘗試更清晰的圖片或調整提示。",
          variant: "destructive",
        });
    }

    if (errorDetails.length > 0) {
      errorDetails.forEach(err => {
        toast({
          title: `圖片處理錯誤: ${err.fileName}`,
          description: err.message,
          variant: "destructive",
          duration: 12000
        })
      });
    }
  };

  const handleSaveToDatabase = async () => {
    if (!extractedData || extractedData.extractedProducts.length === 0) {
      toast({
        title: "沒有可儲存的產品",
        description: "AI 未提取到任何產品資料，或資料已被清空。",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      const productsCollection = collection(db, 'products');
      
      // Helper map to keep track of the next order number for each category being processed in this batch
      const categoryOrderTracker: Record<string, number> = {}; 

      for (const extractedProduct of extractedData.extractedProducts) {
        const newProductRef = doc(productsCollection); 

        const productName = (extractedProduct.name || "Unnamed Product").trim();
        const productCategory = (extractedProduct.category || "Uncategorized").trim();

        let defaultAiHint = 'food item';
        if (productName !== "Unnamed Product") {
            defaultAiHint = productName.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
        } else if (productCategory !== "Uncategorized") {
            defaultAiHint = productCategory.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
        }

        let orderForThisProduct: number;

        // Check if we've already determined the starting order for this category in this batch
        if (categoryOrderTracker[productCategory] === undefined) {
          // Fetch the current max order for this category from Firestore
          const productsInCategoryQuery = query(
            collection(db, 'products'), 
            where('category', '==', productCategory),
            orderBy('order', 'desc'),
            limit(1)
          );
          const querySnapshot = await getDocs(productsInCategoryQuery);
          let maxOrderInDb = -1;
          if (!querySnapshot.empty) {
            const lastProduct = querySnapshot.docs[0].data() as Product;
            if (typeof lastProduct.order === 'number') {
              maxOrderInDb = lastProduct.order;
            }
          }
          orderForThisProduct = maxOrderInDb + 1;
        } else {
          // We've processed this category before in this batch, increment the order
          orderForThisProduct = categoryOrderTracker[productCategory] + 1;
        }
        // Update the tracker for the next product in the same category within this batch
        categoryOrderTracker[productCategory] = orderForThisProduct;
        
        const productData: Product = {
          id: newProductRef.id,
          name: productName,
          price: typeof extractedProduct.price === 'number' ? extractedProduct.price : 0,
          category: productCategory,
          description: (extractedProduct.description || '').trim(),
          imageUrl: 'https://placehold.co/300x200.png',
          'data-ai-hint': defaultAiHint.trim(),
          order: orderForThisProduct, // Assign the calculated order
        };
        batch.set(newProductRef, productData);
      }

      await batch.commit();
      toast({
        title: "儲存成功！",
        description: `已成功將 ${extractedData.extractedProducts.length} 項產品儲存到資料庫。`,
        className: "bg-green-500 text-white border-green-600",
      });
      setExtractedData(null); 
      setImageFiles([]);
      setImagePreviews([]);
      if(fileInputRef.current) fileInputRef.current.value = "";
      router.push('/admin/products'); 

    } catch (error) {
      console.error("Error saving products to Firestore:", error);
      toast({
        title: "儲存失敗",
        description: `儲存產品到資料庫時發生錯誤: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href="/admin/products">
          <ArrowLeftCircle className="mr-2 h-4 w-4" />
          返回產品系列
        </Link>
      </Button>
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center">
            <BrainCircuit className="w-8 h-8 mr-3 text-accent" />
            從圖片智能導入產品
          </CardTitle>
          <CardDescription className="text-lg">
            上傳包含產品列表或菜單的圖片 (可選多張)，AI 將嘗試提取產品資訊。
            (此功能為實驗性，提取結果可能需要人工核對與調整)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="image-upload-input" className="text-base block mb-2">上傳產品圖片 (可選多張)*</Label>
            <div className="flex flex-col items-center gap-4">
              <Label 
                  htmlFor="image-upload-input" 
                  className={`flex flex-col items-center justify-center w-full min-h-48 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors p-4 ${imagePreviews.length > 0 ? 'min-h-20' : 'min-h-48'}`}
              >
                  {imagePreviews.length === 0 ? (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                          <ImagePlus className="w-12 h-12 mb-4 text-muted-foreground" />
                          <p className="mb-2 text-base text-muted-foreground">
                              <span className="font-semibold">點擊此處上傳</span> 或拖放圖片
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF (單檔建議小於 4MB)</p>
                      </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">已選取 {imagePreviews.length} 張圖片。點擊或拖放以更改選擇。</p>
                  )}
              </Label>
              {imagePreviews.length > 0 && (
                <ScrollArea className="w-full max-h-60 border rounded-md p-2">
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imagePreviews.map((previewSrc, index) => (
                      <div key={index} className="relative aspect-square border rounded-md overflow-hidden shadow-sm">
                        <Image
                          src={previewSrc}
                          alt={`預覽圖片 ${index + 1}`}
                          fill // Changed from layout="fill" to fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw" // Added sizes for responsive images
                          objectFit="contain"
                          className="p-1"
                        />
                        <p className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-sm truncate max-w-[calc(100%-4px)]">
                          {imageFiles[index]?.name && imageFiles[index].name.length > 12 ? `${imageFiles[index].name.substring(0,10)}...` : imageFiles[index]?.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              <Input 
                id="image-upload-input" 
                ref={fileInputRef}
                type="file" 
                className="w-full max-w-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                onChange={handleImageChange} 
                accept="image/png, image/jpeg, image/gif"
                multiple 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customPrompt" className="text-base">額外提示 (選填)</Label>
            <Textarea
              id="customPrompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="例如：這是一張甜品菜單的圖片。/ 請專注提取帶有價格的項目。"
              rows={2}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              提供額外文字提示，可以幫助 AI 更準確地理解圖片內容。此提示將應用於所有上傳的圖片。
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleExtract} className="w-full text-lg py-6" disabled={isLoading || imageFiles.length === 0 || isSaving}>
            {isLoading ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-6 w-6" />
            )}
            {isLoading ? '正在提取資訊...' : `開始提取 ${imageFiles.length > 0 ? imageFiles.length + ' 張圖片的' : ''}產品資訊`}
          </Button>
        </CardFooter>
      </Card>

      {extractedData && extractedData.extractedProducts.length > 0 && (
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <FileJson className="w-7 h-7 mr-3 text-accent" />
              AI 提取結果預覽 (共 {extractedData.extractedProducts.length} 項產品)
            </CardTitle>
            <CardDescription>
              以下是 AI 從圖片中提取的所有產品資訊。請檢查是否準確。
              確認無誤後，您可以將這些產品儲存到資料庫。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px] overflow-y-auto bg-muted/30 p-4 rounded-md">
              <pre className="text-sm whitespace-pre-wrap break-all">
                {JSON.stringify(extractedData.extractedProducts, null, 2)}
              </pre>
            </ScrollArea>
            <div className="mt-6 text-center">
              <Button onClick={handleSaveToDatabase} disabled={isSaving || isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                {isSaving ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                {isSaving ? '儲存中...' : `確認並儲存 ${extractedData.extractedProducts.length} 項產品到資料庫`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {extractedData && extractedData.extractedProducts.length === 0 && !isLoading && (
         <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-destructive flex items-center">
              <FileJson className="w-7 h-7 mr-3" />
              未能提取產品
            </CardTitle>
            <CardDescription>
              AI 未能從提供的圖片中識別出任何產品資訊。您可以嘗試：
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>上傳更清晰、排版更規整的圖片。</li>
                <li>調整或添加「額外提示」。</li>
                <li>確保圖片中的文字清晰可辨。</li>
              </ul>
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

    