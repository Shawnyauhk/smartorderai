
"use client";

import type React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react'; // Added useEffect, useRef
import type { Product } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { ArrowLeftCircle, LayoutGrid, ShoppingBag, List, ArrowUpCircle } from 'lucide-react'; // Added ArrowUpCircle
import { Separator } from '@/components/ui/separator';

interface ManualOrderSectionProps {
  allProducts: Product[];
  onProductAddToCart: (product: Product) => void;
  scrollableContainerRef?: React.RefObject<HTMLDivElement | null>; // Added prop
}

const SCROLL_THRESHOLD = 300; // Pixels to scroll before showing "Back to Top"

const ManualOrderSection: React.FC<ManualOrderSectionProps> = ({ allProducts, onProductAddToCart, scrollableContainerRef }) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const categories = useMemo(() => {
    const categoryMap = allProducts.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = 0;
      }
      acc[product.category]++;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-HK')); 

  }, [allProducts]);

  const productsInCategory = useMemo(() => {
    if (!selectedCategoryName) return [];
    return allProducts
      .filter(p => p.category === selectedCategoryName)
      .sort((a,b) => a.name.localeCompare(b.name, 'zh-HK'));
  }, [allProducts, selectedCategoryName]);

  useEffect(() => {
    const scrollElement = scrollableContainerRef?.current;
    if (!scrollElement || !selectedCategoryName) {
      setShowBackToTop(false);
      return;
    }

    const handleScroll = () => {
      if (scrollElement.scrollTop > SCROLL_THRESHOLD) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [selectedCategoryName, scrollableContainerRef]);

  const handleScrollToTop = () => {
    scrollableContainerRef?.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  
  const handleSelectCategory = (categoryName: string) => {
    setSelectedCategoryName(categoryName);
    // Reset scroll position when category changes
    scrollableContainerRef?.current?.scrollTo({ top: 0 }); 
    setShowBackToTop(false); // Hide button until user scrolls in new category
  };

  const handleBackToCategories = () => {
    setSelectedCategoryName(null);
    scrollableContainerRef?.current?.scrollTo({ top: 0 });
    setShowBackToTop(false);
  }

  if (selectedCategoryName) {
    return (
      <div className="space-y-6 relative"> {/* Added relative for positioning context if needed */}
        <div className="sticky top-0 z-10 bg-background py-4 shadow-md">
          <Button variant="outline" size="sm" onClick={handleBackToCategories} className="mb-3 group">
            <ArrowLeftCircle className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
            返回產品系列
          </Button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-3xl font-headline font-bold text-primary flex items-center">
                <List className="w-8 h-8 mr-3 text-accent" />
                {selectedCategoryName}
              </h2>
              <p className="text-md text-muted-foreground mt-1">
                選擇產品加入您的訂單。點擊產品卡片上的「加入購物車」按鈕。
              </p>
            </div>
          </div>
        </div>
        
        <Separator className="mt-0 mb-6"/> {/* Ensure separator is below sticky header */}

        {productsInCategory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-16"> {/* Added pb-16 for BackToTop button space */}
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

        {showBackToTop && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleScrollToTop}
            className="fixed bottom-12 right-12 z-20 rounded-full shadow-lg bg-card hover:bg-muted text-primary border-primary" 
            // Using fixed to position relative to viewport (dialog), adjust bottom/right as needed within dialog's padding.
            // The dialog has p-6, so bottom-12/right-12 refers to distance from dialog edge if dialog fills viewport.
            // Or make it bottom-8 right-8 from the parent (p-6 div).
            // Test with values like bottom-[4rem] right-[calc(50%-1.5rem+1.5rem+theme(spacing.6))] if needed for perfect centering based on scrollbar
            // For simplicity with dialog max-width:
            // className="fixed bottom-10 right-10 z-20 rounded-full shadow-lg ..."
            // Let's try with values that work well within common dialog sizes:
            // Assuming the DialogContent is max-w-3xl (approx 768px). Scrollbar is on right.
            // The p-6 of scrollable div is 24px. Button is 40px wide.
            // right: p-6 + scrollbar_width (approx 10px) + desired_margin (16px) = ~50px from content edge
            // Fixed positioning is relative to the nearest ancestor with transform, perspective, or filter set to something other than none.
            // The DialogContent itself is fixed. So fixed here will be relative to browser viewport, then transformed.
            // For robustness, it's often better to put sticky/absolute elements relative to their scroll container.
            // Since the button is for the dialog's scroll, sticky to scrollableContentRef's viewport.
            // Let's try `sticky` at the end of the product list's parent.
            aria-label="返回頂部"
          >
            <ArrowUpCircle className="h-6 w-6" />
          </Button>
        )}
         {showBackToTop && (
            <div // This button will be sticky relative to the scrollable container (.p-6 div)
                className="sticky bottom-6 right-6 z-30 float-right mr-1" // mr-1 to avoid overlap with potential scrollbar
            >
                <Button
                    variant="default"
                    size="icon"
                    onClick={handleScrollToTop}
                    className="rounded-full shadow-xl w-12 h-12 bg-primary/90 hover:bg-primary text-primary-foreground"
                    aria-label="返回頂部"
                >
                    <ArrowUpCircle className="h-7 w-7" />
                </Button>
            </div>
        )}
      </div>
    );
  }

  // Displaying categories
  return (
    <div className="space-y-6">
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories.map(category => (
            <Card 
              key={category.name} 
              className="h-full flex flex-col justify-between hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer group"
              onClick={() => handleSelectCategory(category.name)} // Use new handler
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectCategory(category.name)}}
              role="button"
              aria-label={`查看 ${category.name} 系列`}
            >
              <CardHeader className="flex-grow p-4">
                <CardTitle className="text-xl md:text-2xl font-headline text-primary group-hover:text-accent transition-colors">{category.name}</CardTitle>
                <CardDescription className="text-sm md:text-base">{category.count} 種產品</CardDescription>
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


    