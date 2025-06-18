
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
import { ArrowLeftCircle, UploadCloud, BrainCircuit, Loader2, FileJson, Save } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { extractProductsFromImage } from '@/ai/flows/extract-products-from-image-flow';
import type { ExtractProductsOutput, ExtractedProduct } from '@/ai/flows/extract-products-from-image-flow';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/types';

export default function ImportProductsFromImagePage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractProductsOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) { // Check for 4MB limit (common for Gemini)
        toast({
          title: "圖片檔案過大",
          description: "請選擇小於 4MB 的圖片檔案。",
          variant: "destructive",
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      setImageFile(file);
      setExtractedData(null); // Clear previous results
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleExtract = async () => {
    if (!imageFile || !imagePreview) {
      toast({
        title: "未選擇圖片",
        description: "請先上傳一張包含產品資料的圖片。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setExtractedData(null);

    try {
      const result = await extractProductsFromImage({ 
        imageDataUri: imagePreview,
        contextPrompt: customPrompt || undefined
       });
      
      if (result && result.extractedProducts) {
        setExtractedData(result);
        if (result.extractedProducts.length > 0) {
          toast({
            title: "提取成功！",
            description: `AI 從圖片中識別到 ${result.extractedProducts.length} 項產品。請預覽下方結果。`,
            className: "bg-green-500 text-white border-green-600",
          });
        } else {
           toast({
            title: "未提取到產品",
            description: "AI 未能從圖片中識別出任何產品資訊。請嘗試更清晰的圖片或調整提示。",
            variant: "destructive",
          });
        }
      } else {
        throw new Error("AI did not return the expected output structure.");
      }
    } catch (error) {
      console.error("Error extracting products from image:", error);
      let description = "AI 分析圖片時發生錯誤，請重試。";
      if (error instanceof Error) {
        if (error.message.includes('SAFETY')) {
            description = "圖片內容可能違反了 AI 安全政策，無法處理。請嘗試不同的圖片。"
        } else if (error.message.includes('4MB')) {
            description = "圖片檔案超過4MB上限，AI無法處理。請上傳較小的圖片。"
        }
      }
      toast({
        title: "提取失敗",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

      extractedData.extractedProducts.forEach((extractedProduct: ExtractedProduct) => {
        const newProductRef = doc(productsCollection); // Auto-generate ID

        // Create a default data-ai-hint from name (first two words) or category, or fallback
        let defaultAiHint = 'food item';
        if (extractedProduct.name) {
            defaultAiHint = extractedProduct.name.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
        } else if (extractedProduct.category) {
            defaultAiHint = extractedProduct.category.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
        }
        
        const productData: Product = {
          id: newProductRef.id, // Store the auto-generated ID if needed, though Firestore handles it
          name: extractedProduct.name,
          price: typeof extractedProduct.price === 'number' ? extractedProduct.price : 0,
          category: extractedProduct.category || '未分類',
          description: extractedProduct.description || '',
          imageUrl: `https://placehold.co/300x200.png?text=${encodeURIComponent(extractedProduct.name)}`,
          'data-ai-hint': defaultAiHint,
        };
        batch.set(newProductRef, productData);
      });

      await batch.commit();
      toast({
        title: "儲存成功！",
        description: `已成功將 ${extractedData.extractedProducts.length} 項產品儲存到資料庫。`,
        className: "bg-green-500 text-white border-green-600",
      });
      setExtractedData(null); // Clear the data after saving
      router.push('/admin/products'); // Navigate to product list page

    } catch (error) {
      console.error("Error saving products to Firestore:", error);
      toast({
        title: "儲存失敗",
        description: "儲存產品到資料庫時發生錯誤，請檢查主控台取得更多資訊。",
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
            上傳包含產品列表或菜單的圖片，AI 將嘗試提取產品資訊。
            (此功能為實驗性，提取結果可能需要人工核對與調整)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="image" className="text-base block mb-2">上傳產品圖片*</Label>
            <div className="flex flex-col items-center gap-4">
              <Label 
                  htmlFor="image-upload-input" 
                  className="flex flex-col items-center justify-center w-full min-h-48 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors p-4"
              >
                  {imagePreview ? (
                      <Image src={imagePreview} alt="預覽圖片" width={400} height={300} className="max-h-[300px] w-auto object-contain rounded-md p-1"/>
                  ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                          <UploadCloud className="w-12 h-12 mb-4 text-muted-foreground" />
                          <p className="mb-2 text-base text-muted-foreground">
                              <span className="font-semibold">點擊此處上傳</span> 或拖放圖片
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF (建議小於 4MB)</p>
                      </div>
                  )}
              </Label>
              <Input 
                id="image-upload-input" 
                ref={fileInputRef}
                type="file" 
                className="w-full max-w-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                onChange={handleImageChange} 
                accept="image/png, image/jpeg, image/gif" 
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
              提供額外文字提示，可以幫助 AI 更準確地理解圖片內容。
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleExtract} className="w-full text-lg py-6" disabled={isLoading || !imageFile || isSaving}>
            {isLoading ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-6 w-6" />
            )}
            {isLoading ? '正在提取資訊...' : '開始提取產品資訊'}
          </Button>
        </CardFooter>
      </Card>

      {extractedData && extractedData.extractedProducts.length > 0 && (
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <FileJson className="w-7 h-7 mr-3 text-accent" />
              AI 提取結果預覽
            </CardTitle>
            <CardDescription>
              以下是 AI 從圖片中提取的產品資訊。請檢查是否準確。
              確認無誤後，您可以將這些產品儲存到資料庫。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto bg-muted/30 p-4 rounded-md">
              <pre className="text-sm whitespace-pre-wrap break-all">
                {JSON.stringify(extractedData.extractedProducts, null, 2)}
              </pre>
            </div>
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

    