
"use client";

import { useState, useEffect } from 'react';
import { mockProducts } from '@/lib/product-data';
import ProductCard from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftCircle, ListOrdered, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { Metadata } from 'next'; // Removed ResolvingMetadata as it's not used for client components for dynamic titles
import type { Product } from '@/types';

type Props = {
  params: { category: string };
};

// Metadata generation needs to be handled differently for client components or use a server component wrapper
// For simplicity, dynamic title will be set via document.title in useEffect

export default function CategoryProductsPage({ params }: Props) {
  const decodedCategory = decodeURIComponent(params.category);
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const productsInCategory = mockProducts.filter(
      (product) => product.category === decodedCategory
    );
    setOrderedProducts(productsInCategory);
    document.title = `${decodedCategory} - 產品列表 - 智能點餐AI`;
  }, [decodedCategory]);

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    setOrderedProducts(prev => {
      const newProducts = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newProducts.length) {
        return newProducts;
      }

      const temp = newProducts[index];
      newProducts[index] = newProducts[targetIndex];
      newProducts[targetIndex] = temp;
      return newProducts;
    });
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/admin/products">
              <ArrowLeftCircle className="mr-2 h-4 w-4" />
              返回產品系列
            </Link>
          </Button>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <ListOrdered className="w-10 h-10 mr-3 text-accent" />
            {decodedCategory}
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            瀏覽 {decodedCategory} 系列中的所有產品。您可以點擊箭頭調整產品順序。
          </p>
        </div>
      </div>
      
      <Separator />

      {orderedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orderedProducts.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product}
              showSortButtons={true}
              isFirst={index === 0}
              isLast={index === orderedProducts.length - 1}
              onMoveUp={() => moveProduct(index, 'up')}
              onMoveDown={() => moveProduct(index, 'down')}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">在此系列中未找到任何產品。</p>
        </div>
      )}
      <p className="text-sm text-muted-foreground mt-4 text-center">
        提示：目前的排序僅在當前頁面有效，刷新後將重置。
      </p>
    </div>
  );
}
