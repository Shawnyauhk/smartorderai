
"use client";

import type React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { Product } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { ArrowLeftCircle, LayoutGrid, ShoppingBag, List, ArrowUpCircle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ManualOrderSectionProps {
  allProducts: Product[];
  onProductAddToCart: (product: Product) => void;
  scrollableContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const SCROLL_THRESHOLD = 300;
const CATEGORY_ORDER_COLLECTION = 'app_configuration';
const CATEGORY_ORDER_DOC_ID = 'categoryDisplayOrder';

const ManualOrderSection: React.FC<ManualOrderSectionProps> = ({ allProducts, onProductAddToCart, scrollableContainerRef }) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [storedOrderedCategoryNames, setStoredOrderedCategoryNames] = useState<string[]>([]);
  const [isLoadingCategoryOrder, setIsLoadingCategoryOrder] = useState(true);

  useEffect(() => {
    const fetchCategoryOrder = async () => {
      setIsLoadingCategoryOrder(true);
      try {
        const orderDocRef = doc(db, CATEGORY_ORDER_COLLECTION, CATEGORY_ORDER_DOC_ID);
        const orderDocSnap = await getDoc(orderDocRef);
        if (orderDocSnap.exists()) {
          const data = orderDocSnap.data();
          if (data && Array.isArray(data.orderedNames)) {
            setStoredOrderedCategoryNames(data.orderedNames.filter((name): name is string => typeof name === 'string' && name.trim() !== ''));
          } else {
            console.warn(`'orderedNames' in ${CATEGORY_ORDER_DOC_ID} is not an array or document is malformed. Using empty order for manual selection.`);
            setStoredOrderedCategoryNames([]);
          }
        } else {
          console.warn(`${CATEGORY_ORDER_DOC_ID} document not found. Using empty order for manual selection.`);
          setStoredOrderedCategoryNames([]);
        }
      } catch (error) {
        console.error("Error fetching category order for manual selection:", error);
        setStoredOrderedCategoryNames([]); 
      } finally {
        setIsLoadingCategoryOrder(false);
      }
    };
    fetchCategoryOrder();
  }, []);

  const categories = useMemo(() => {
    const categoryMap = allProducts.reduce((acc, product) => {
      const categoryName = product.category.trim();
      if (!categoryName) return acc; // Skip products with empty category names
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName]++;
      return acc;
    }, {} as Record<string, number>);
    
    let allCategoryEntries = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }));

    allCategoryEntries.sort((a, b) => {
      const indexA = storedOrderedCategoryNames.indexOf(a.name);
      const indexB = storedOrderedCategoryNames.indexOf(b.name);

      if (indexA !== -1 && indexB !== -1) { 
        return indexA - indexB;
      }
      if (indexA !== -1) { 
        return -1;
      }
      if (indexB !== -1) { 
        return 1;
      }
      return a.name.localeCompare(b.name, 'zh-HK');
    });
    
    return allCategoryEntries;

  }, [allProducts, storedOrderedCategoryNames]);

  const productsInCategory = useMemo(() => {
    if (!selectedCategoryName) return [];
    return allProducts
      .filter(p => p.category === selectedCategoryName)
      .sort((a,b) => {
        // Primarily sort by 'order' field if it exists, then by name
        const orderA = typeof a.order === 'number' ? a.order : Infinity;
        const orderB = typeof b.order === 'number' ? b.order : Infinity;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.name.localeCompare(b.name, 'zh-HK');
      });
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
    handleScroll(); 

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
    scrollableContainerRef?.current?.scrollTo({ top: 0 }); 
    setShowBackToTop(false); 
  };

  const handleBackToCategories = () => {
    setSelectedCategoryName(null);
    scrollableContainerRef?.current?.scrollTo({ top: 0 });
    setShowBackToTop(false);
  }

  if (isLoadingCategoryOrder) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin mb-3" />
        <p className="text-lg text-muted-foreground">正在載入產品系列...</p>
      </div>
    );
  }

  if (selectedCategoryName) {
    return (
      <div className="relative">
        <div className="sticky top-0 z-20 bg-background py-2">
          <Button variant="outline" size="sm" onClick={handleBackToCategories} className="group">
            <ArrowLeftCircle className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
            返回產品系列
          </Button>
        </div>
        
        <div className="mt-4 mb-4">
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
        
        <Separator className="mb-6"/>

        {productsInCategory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
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
            <div
                className="sticky bottom-6 right-0 z-30 float-right mr-1" 
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

  return (
    <div className="space-y-6">
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories.map(category => (
            <Card 
              key={category.name} 
              className="h-full flex flex-col justify-between hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer group"
              onClick={() => handleSelectCategory(category.name)}
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
             <p className="mt-2 text-sm text-foreground">請先確保產品庫中已有產品，或嘗試重新整理頁面。</p>
          </div>
      )}
    </div>
  );
};

export default ManualOrderSection;

