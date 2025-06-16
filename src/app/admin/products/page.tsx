
"use client";

import { useState, useEffect } from 'react';
import { mockProducts } from '@/lib/product-data';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, FolderKanban, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { Product } from '@/types';

export default function AdminProductsPage() {
  type CategoryEntry = { name: string; count: number };
  const [orderedCategories, setOrderedCategories] = useState<CategoryEntry[]>([]);

  useEffect(() => {
    const categoriesMap = mockProducts.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = 0;
      }
      acc[product.category]++;
      return acc;
    }, {} as Record<string, number>);

    const initialCategories = Object.entries(categoriesMap).map(([name, count]) => ({ name, count }));
    setOrderedCategories(initialCategories);
  }, []);

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    setOrderedCategories(prev => {
      const newCategories = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newCategories.length) {
        return newCategories; // Should not happen if buttons are disabled correctly
      }

      const temp = newCategories[index];
      newCategories[index] = newCategories[targetIndex];
      newCategories[targetIndex] = temp;
      return newCategories;
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <FolderKanban className="w-10 h-10 mr-3 text-accent" />
            產品系列
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            選擇一個系列以查看詳細產品。您可以點擊箭頭調整系列順序。
          </p>
        </div>
        <Button variant="default" size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow transform hover:scale-105">
          <Link href="#">
            <PlusCircle className="mr-2 h-5 w-5" />
            新增產品 (即將推出)
          </Link>
        </Button>
      </div>
      
      <Separator />

      {orderedCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orderedCategories.map(({ name: category, count }, index) => (
            <Card key={category} className="h-full flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
              <Link href={`/admin/products/${encodeURIComponent(category)}`} legacyBehavior>
                <a className="block hover:no-underline flex-grow">
                  <CardHeader>
                    <CardTitle className="text-2xl font-headline text-primary">{category}</CardTitle>
                    <CardDescription>{count} 種產品</CardDescription>
                  </CardHeader>
                </a>
              </Link>
              <CardFooter className="p-3 border-t mt-auto">
                <div className="flex justify-end space-x-2 w-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveCategory(index, 'up')}
                    disabled={index === 0}
                    aria-label={`將 ${category} 上移`}
                    className="h-8 w-8"
                  >
                    <ArrowUpCircle className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveCategory(index, 'down')}
                    disabled={index === orderedCategories.length - 1}
                    aria-label={`將 ${category} 下移`}
                    className="h-8 w-8"
                  >
                    <ArrowDownCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">未找到任何產品系列。</p>
          <p className="mt-2 text-foreground">新增產品以開始使用。</p>
        </div>
      )}
       <p className="text-sm text-muted-foreground mt-4 text-center">
        提示：目前的排序僅在當前頁面有效，刷新後將重置。
      </p>
    </div>
  );
}
