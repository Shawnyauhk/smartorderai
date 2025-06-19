
"use client";

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ArrowLeftCircle, PlusCircle, Loader2, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/types';

export default function AddProductPage() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataAiHint, setDataAiHint] = useState('');

  const router = useRouter();
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
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
    let imageUrl = 'https://placehold.co/300x200.png'; // Default placeholder
    let finalDataAiHint = dataAiHint.trim() ? dataAiHint.trim().toLowerCase() : 'food item';


    try {
      if (imageFile) {
        const imageName = `${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
        const storageRef = ref(storage, `products/${imageName}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Determine the order for the new product
      let newProductOrder = 0;
      const productsInCategoryQuery = query(
        collection(db, 'products'), 
        where('category', '==', category.trim()),
        orderBy('order', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(productsInCategoryQuery);
      if (!querySnapshot.empty) {
        const lastProduct = querySnapshot.docs[0].data() as Product;
        if (typeof lastProduct.order === 'number') {
          newProductOrder = lastProduct.order + 1;
        }
      }
      // If no products or no 'order' field found, newProductOrder remains 0, which is fine for the first item.


      const productData: Omit<Product, 'id'> = {
        name: name.trim(),
        price: parseFloat(price),
        category: category.trim(),
        description: description.trim(),
        imageUrl: imageUrl,
        'data-ai-hint': finalDataAiHint,
        order: newProductOrder,
      };

      await addDoc(collection(db, 'products'), productData);

      toast({
        title: "產品新增成功！",
        description: `${name} 已成功新增到資料庫。`,
        className: "bg-green-500 text-white border-green-600",
      });
      router.push(`/admin/products/${encodeURIComponent(category.trim())}`); 
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "新增產品失敗",
        description: "儲存產品到資料庫時發生錯誤，請重試。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center">
            <PlusCircle className="w-8 h-8 mr-3 text-accent" />
            新增產品
          </CardTitle>
          <CardDescription className="text-lg">
            填寫以下表格以新增產品到您的菜單。產品將預設排在所選系列的末尾。
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
                提供一至兩個英文關鍵詞，用於未來 AI 圖片搜尋（例如 Unsplash）。如果留空，預設為 "food item"。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-base block mb-2">產品圖片</Label>
              <div className="flex items-center gap-4">
                <Label 
                    htmlFor="image" 
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="預覽圖片" className="h-full w-full object-contain rounded-md p-1"/>
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">點擊上傳</span> 或拖放圖片
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF (建議 300x200px)</p>
                        </div>
                    )}
                    <Input id="image" type="file" className="hidden" onChange={handleImageChange} accept="image/png, image/jpeg, image/gif" />
                </Label>
              </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-6 w-6" />
              )}
              {isLoading ? '正在新增...' : '新增產品'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
    