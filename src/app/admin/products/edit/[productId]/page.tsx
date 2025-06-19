
"use client";

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeftCircle, Edit3, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [dataAiHint, setDataAiHint] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [imageRemoved, setImageRemoved] = useState(false);


  const { toast } = useToast();

  const fetchProductDetails = useCallback(async () => {
    if (!productId) return;
    setIsFetching(true);
    try {
      const productDocRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productDocRef);

      if (productSnap.exists()) {
        const productData = productSnap.data() as Product;
        setProduct(productData);
        setName(productData.name);
        setPrice(productData.price.toString());
        setCategory(productData.category);
        setDescription(productData.description || '');
        setDataAiHint(productData['data-ai-hint'] || '');
        setCurrentImageUrl(productData.imageUrl || null);
        setImageRemoved(false);
      } else {
        toast({
          title: "找不到產品",
          description: "無法找到該產品的資料，可能已被刪除。",
          variant: "destructive",
        });
        router.push('/admin/products');
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "讀取產品資料失敗",
        description: "讀取產品資料時發生錯誤。",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  }, [productId, router, toast]);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId, fetchProductDetails]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageRemoved(false); // If a new image is selected, it's not "removed"
    } else {
      // If no file is selected (e.g., user cancels file dialog), revert to current image or nothing
      setImageFile(null);
      setImagePreview(null); 
    }
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCurrentImageUrl(null); // Visually remove current image
    setImageRemoved(true); // Mark that the image should be removed on save
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category) {
      toast({
        title: "資料未填寫完整",
        description: "請填寫產品名稱、價格和分類。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    let newImageUrl = product?.imageUrl || ''; // Keep old image URL by default
    const oldImageUrl = product?.imageUrl;


    try {
      const productDataToUpdate: Partial<Product> = {
        name: name.trim(),
        price: parseFloat(price),
        category: category.trim(),
        description: description.trim(),
        'data-ai-hint': dataAiHint.trim() ? dataAiHint.trim().toLowerCase() : (name.trim().toLowerCase() || 'food item'),
      };

      if (imageFile) { // New image uploaded
        const imageName = `${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
        const storageRef = ref(storage, `products/${imageName}`);
        await uploadBytes(storageRef, imageFile);
        newImageUrl = await getDownloadURL(storageRef);
        productDataToUpdate.imageUrl = newImageUrl;

        // Optional: Delete old image from storage if it existed and is different
        if (oldImageUrl && oldImageUrl !== newImageUrl) {
          try {
            const oldImageRef = ref(storage, oldImageUrl);
            await deleteObject(oldImageRef);
          } catch (deleteError: any) {
            // Log error but don't block update if deletion fails
            if (deleteError.code === 'storage/object-not-found'){
                 console.warn("Old image not found in storage, skipping deletion:", oldImageUrl);
            } else {
                console.error("Error deleting old image:", deleteError);
            }
          }
        }
      } else if (imageRemoved) { // Image explicitly removed by user
         productDataToUpdate.imageUrl = ''; // Set to empty string or specific placeholder
         if (oldImageUrl) { // If there was an old image, try to delete it
            try {
                const oldImageRef = ref(storage, oldImageUrl);
                await deleteObject(oldImageRef);
            } catch (deleteError: any) {
                if (deleteError.code === 'storage/object-not-found'){
                    console.warn("Old image not found in storage when trying to remove, skipping deletion:", oldImageUrl);
                } else {
                    console.error("Error deleting old image on removal:", deleteError);
                }
            }
         }
      }
      // If no new image and not removed, imageUrl remains as fetched (or updated if new one was uploaded)

      const productDocRef = doc(db, 'products', productId);
      await updateDoc(productDocRef, productDataToUpdate);

      toast({
        title: "產品更新成功！",
        description: `${name} 已成功更新。`,
        className: "bg-green-500 text-white border-green-600",
      });
      router.push(`/admin/products/${encodeURIComponent(category)}`); 
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "更新產品失敗",
        description: "更新產品資料時發生錯誤，請重試。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">正在載入產品資料...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-destructive">找不到產品資料。</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/admin/products">返回產品列表</Link>
        </Button>
      </div>
    );
  }

  const displayImageUrl = imagePreview || currentImageUrl;

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href={product?.category ? `/admin/products/${encodeURIComponent(product.category)}` : "/admin/products"}>
          <ArrowLeftCircle className="mr-2 h-4 w-4" />
          返回 {product?.category || '產品系列'}
        </Link>
      </Button>
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center">
            <Edit3 className="w-8 h-8 mr-3 text-accent" />
            編輯產品
          </CardTitle>
          <CardDescription className="text-lg">
            修改產品「{product.name}」的詳細資料。
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">產品名稱*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：草莓葫蘆"
                required
                className="text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-base">價格 (HK$)*</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="例如：13.00"
                  required
                  step="0.01"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base">產品分類*</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="例如：小食"
                  required
                  className="text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base">產品描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：美味的草莓糖葫蘆。"
                rows={3}
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataAiHint" className="text-base">圖片AI提示詞 (data-ai-hint)</Label>
              <Input
                id="dataAiHint"
                value={dataAiHint}
                onChange={(e) => setDataAiHint(e.target.value)}
                placeholder="例如：candied fruit (最多兩個詞)"
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                提供一至兩個英文關鍵詞，用於未來 AI 圖片搜尋。如果留空，將根據產品名稱自動產生。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-base block mb-2">產品圖片</Label>
              <div className="flex flex-col gap-4">
                <Label 
                    htmlFor="image" 
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
                >
                    {displayImageUrl ? (
                        <Image src={displayImageUrl} alt="產品圖片預覽" width={200} height={150} className="max-h-full max-w-full object-contain rounded-md p-1"/>
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">點擊上傳新圖片</span> 或拖放
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF (建議 300x200px)</p>
                        </div>
                    )}
                    <Input id="image" type="file" className="hidden" onChange={handleImageChange} accept="image/png, image/jpeg, image/gif" />
                </Label>
                {displayImageUrl && (
                    <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage} className="self-start border-destructive text-destructive hover:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        移除圖片
                    </Button>
                )}
              </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading || isFetching}>
              {isLoading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <Edit3 className="mr-2 h-6 w-6" />
              )}
              {isLoading ? '正在更新...' : '更新產品'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
