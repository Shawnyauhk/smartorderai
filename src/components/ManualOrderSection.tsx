
"use client";

import type React from 'react';
import { useState, useMemo } from 'react';
import type { Product } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { ArrowLeftCircle, LayoutGrid, ShoppingBag, List } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ManualOrderSectionProps {
  allProducts: Product[];
  onProductAddToCart: (product: Product) => void;
}

type CategoryEntry = { name: string; count: number };

const ManualOrderSection: React.FC<ManualOrderSectionProps> = ({ allProducts, onProductAddToCart }) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  const categories = useMemo(() => {
    const categoryMap = allProducts.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = 0;
      }
      acc[product.category]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort categories by product count (descending) or alphabetically if you prefer
    return Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-HK')); // Sort alphabetically for consistency

  }, [allProducts]);

  const productsInCategory = useMemo(() => {
    if (!selectedCategoryName) return [];
    // Sort products within a category, e.g., by name or price
    return allProducts
      .filter(p => p.category === selectedCategoryName)
      .sort((a,b) => a.name.localeCompare(b.name, 'zh-HK'));
  }, [allProducts, selectedCategoryName]);

  if (selectedCategoryName) {
    return (
      <div className="space-y-6 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Button variant="outline" size="sm" onClick={() => setSelectedCategoryName(null)} className="mb-4 group">
              <ArrowLeftCircle className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
              返回產品系列
            </Button>
            <h2 className="text-3xl font-headline font-bold text-primary flex items-center">
              <List className="w-8 h-8 mr-3 text-accent" />
              {selectedCategoryName}
            </h2>
            <p className="text-md text-muted-foreground mt-1">
              選擇產品加入您的訂單。點擊產品卡片上的「加入購物車」按鈕。
            </p>
          </div>
        </div>
        <Separator />
        {productsInCategory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productsInCategory.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={onProductAddToCart} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
             <p className="text-xl text-muted-foreground">此系列中暫無產品。</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-headline font-bold text-primary flex items-center justify-center">
          <LayoutGrid className="w-8 h-8 mr-3 text-accent" />
          手動選擇餐點
        </h2>
        <p className="text-lg text-muted-foreground mt-1">
          按產品系列瀏覽，並將產品加入您的訂單。
        </p>
      </div>
       <Separator className="my-6" />
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map(category => (
            <Card 
              key={category.name} 
              className="h-full flex flex-col justify-between hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer group"
              onClick={() => setSelectedCategoryName(category.name)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCategoryName(category.name)}}
              role="button"
              aria-label={`查看 ${category.name} 系列`}
            >
              <CardHeader className="flex-grow">
                <CardTitle className="text-2xl font-headline text-primary group-hover:text-accent transition-colors">{category.name}</CardTitle>
                <CardDescription>{category.count} 種產品</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
         <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">沒有可供選擇的產品系列。</p>
          </div>
      )}
    </div>
  );
};

export default ManualOrderSection;
