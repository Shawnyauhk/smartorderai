
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
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { ArrowLeftCircle, Edit3, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORY_ORDER_COLLECTION = 'app_configuration';
const CATEGORY_ORDER_DOC_ID = 'categoryDisplayOrder';

// Helper function to check if a URL is a Firebase Storage URL
const isFirebaseStorageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith('https://firebasestorage.googleapis.com');
};

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
  
  const [isFetchingProduct, setIsFetchingProduct] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // For submit button
  const [imageRemoved, setImageRemoved] = useState(false);

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);


  const { toast } = useToast();

  const fetchProductDetails = useCallback(async () => {
    if (!productId) return;
    setIsFetchingProduct(true);
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
        setImagePreview(null); 
        setImageFile(null); 
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
      setIsFetchingProduct(false);
    }
  }, [productId, router, toast]);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId, fetchProductDetails]);

  useEffect(() => {
    const fetchAllUniqueCategories = async () => {
      setIsFetchingCategories(true);
      try {
        const productsCol = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCol);
        const productBasedCategories = new Set<string>();
        productsSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.category && typeof data.category === 'string' && data.category.trim() !== '') {
            productBasedCategories.add(data.category.trim());
          }
        });

        let storedOrderedCategoryNames: string[] = [];
        const orderDocRef = doc(db, CATEGORY_ORDER_COLLECTION, CATEGORY_ORDER_DOC_ID);
        const orderDocSnap = await getDoc(orderDocRef);
        if (orderDocSnap.exists()) {
          const data = orderDocSnap.data();
          if (data && Array.isArray(data.orderedNames)) {
            storedOrderedCategoryNames = data.orderedNames.filter((name): name is string => typeof name === 'string' && name.trim() !== '');
          }
        }
        
        const combinedCategoriesSet = new Set<string>([...storedOrderedCategoryNames, ...Array.from(productBasedCategories)]);
        let allUniqueCategoriesArray = Array.from(combinedCategoriesSet);

        allUniqueCategoriesArray.sort((a, b) => {
            const indexA = storedOrderedCategoryNames.indexOf(a);
            const indexB = storedOrderedCategoryNames.indexOf(b);

            if (indexA !== -1 && indexB !== -1) { 
                return indexA - indexB;
            }
            if (indexA !== -1) { 
                return -1;
            }
            if (indexB !== -1) { 
                return 1;
            }
            return a.localeCompare(b, 'zh-HK');
        });
        
        setAvailableCategories(allUniqueCategoriesArray);

      } catch (error) {
        console.error("Error fetching all unique categories:", error);
        toast({
          title: "讀取產品系列失敗",
          description: "讀取可用產品系列時發生錯誤。",
          variant: "destructive",
        });
        setAvailableCategories([]); 
      } finally {
        setIsFetchingCategories(false);
      }
    };
    fetchAllUniqueCategories();
  }, [toast]);


  useEffect(() => {
    const currentProductCategory = product?.category?.trim();
    const newOptionsSet = new Set(availableCategories);

    if (currentProductCategory) {
      newOptionsSet.add(currentProductCategory);
    }
    
    let finalOptionsArray = Array.from(newOptionsSet);

    finalOptionsArray.sort((a, b) => {
        const indexA = availableCategories.indexOf(a); 
        const indexB = availableCategories.indexOf(b);

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        if (indexA !== -1) {
            return -1;
        }
        if (indexB !== -1) {
            return 1;
        }
        return a.localeCompare(b, 'zh-HK');
    });
    
    setCategoryOptions(finalOptionsArray);

  }, [product, availableCategories]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageRemoved(false); 
    } else {
      setImageFile(null);
      setImagePreview(null); 
    }
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCurrentImageUrl(null); 
    setImageRemoved(true); 
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
    let newImageUrl = product?.imageUrl || ''; 
    const oldImageUrl = product?.imageUrl;


    try {
      const productDataToUpdate: Partial<Product> = {
        name: name.trim(),
        price: parseFloat(price),
        category: category.trim(),
        description: description.trim(),
        'data-ai-hint': dataAiHint.trim() ? dataAiHint.trim().toLowerCase() : (name.trim().toLowerCase() || 'food item'),
      };

      if (imageFile) { 
        const imageName = `${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
        const storageRef = ref(storage, `products/${imageName}`);
        await uploadBytes(storageRef, imageFile);
        newImageUrl = await getDownloadURL(storageRef);
        productDataToUpdate.imageUrl = newImageUrl;

        if (oldImageUrl && oldImageUrl !== newImageUrl && isFirebaseStorageUrl(oldImageUrl)) {
          try {
            const oldImageRef = ref(storage, oldImageUrl);
            await deleteObject(oldImageRef);
          } catch (deleteError: any) {
            if (deleteError.code === 'storage/object-not-found'){
                 console.warn("Old image not found in storage, skipping deletion:", oldImageUrl);
            } else {
                console.error("Error deleting old image:", deleteError);
            }
          }
        }
      } else if (imageRemoved) { 
         productDataToUpdate.imageUrl = ''; 
         if (oldImageUrl && isFirebaseStorageUrl(oldImageUrl)) { 
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
      
      const productDocRef = doc(db, 'products', productId);
      await updateDoc(productDocRef, productDataToUpdate as { [x: string]: any });


      toast({
        title: "產品更新成功！",
        description: `${name} 已成功更新。`,
        className: "bg-green-500 text-white border-green-600",
      });
      router.push(`/admin/products/${encodeURIComponent(categoryData.trim())}`); 
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
  
  const categoryData = category; 

  if (isFetchingProduct) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">正在載入產品資料...</p>
      </div>
    );
  }

  if (!product && !isFetchingProduct) { 
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
            修改產品「{product?.name}」的詳細資料。
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
                disabled={isFetchingProduct || isFetchingCategories || isLoading}
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
                  disabled={isFetchingProduct || isFetchingCategories || isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base">產品分類*</Label>
                <Select
                    value={category}
                    onValueChange={(value) => setCategory(value)}
                    disabled={isFetchingProduct || isFetchingCategories || isLoading}
                >
                    <SelectTrigger id="category" className="text-base">
                        <SelectValue placeholder="選擇產品分類" />
                    </SelectTrigger>
                    <SelectContent>
                        {isFetchingCategories ? (
                            <SelectItem value="loading" disabled>正在載入系列...</SelectItem>
                        ) : categoryOptions.length === 0 ? (
                            <SelectItem value="no-categories" disabled>沒有可用的系列</SelectItem>
                        ) : (
                            categoryOptions.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                                {cat}
                            </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
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
                disabled={isFetchingProduct || isFetchingCategories || isLoading}
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
                disabled={isFetchingProduct || isFetchingCategories || isLoading}
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
                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors ${isFetchingProduct || isFetchingCategories || isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
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
                    <Input id="image" type="file" className="hidden" onChange={handleImageChange} accept="image/png, image/jpeg, image/gif" disabled={isFetchingProduct || isFetchingCategories || isLoading} />
                </Label>
                {displayImageUrl && (
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRemoveImage} 
                        className="self-start border-destructive text-destructive hover:bg-destructive/10"
                        disabled={isFetchingProduct || isFetchingCategories || isLoading}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        移除圖片
                    </Button>
                )}
              </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading || isFetchingProduct || isFetchingCategories}>
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
