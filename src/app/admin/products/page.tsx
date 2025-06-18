
"use client";

import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, FolderKanban, GripVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Product } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

type CategoryEntry = { id: string; name: string; count: number };

interface SortableCategoryCardProps {
  categoryItem: CategoryEntry;
  children: React.ReactNode;
}

function SortableCategoryCard({ categoryItem, children }: SortableCategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoryItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative touch-manipulation">
      {children}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        aria-label={`拖動排序 ${categoryItem.name}`}
      >
        <GripVertical className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function AdminProductsPage() {
  const [orderedCategories, setOrderedCategories] = useState<CategoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "產品系列 - 智能點餐AI";
    const fetchProductsAndSetCategories = async () => {
      setIsLoading(true);
      try {
        const productsCol = collection(db, 'products');
        // You might want to add orderBy('category') or orderBy('name') if needed,
        // ensure you have corresponding indexes in Firestore.
        const productsSnapshot = await getDocs(query(productsCol));
        const fetchedProducts: Product[] = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

        if (fetchedProducts.length === 0) {
          // Use mockProducts as fallback if Firestore is empty or not set up
          // console.warn("Firestore 'products' collection is empty or not found. Falling back to mock products for admin categories.");
          // For now, we won't use mockProducts as a fallback to clearly show when Firestore data is missing.
          // The user should populate Firestore via an admin UI (to be built).
        }
        
        const categoriesMap = fetchedProducts.reduce((acc, product) => {
          if (!product.category) return acc; // Skip products without a category
          if (!acc[product.category]) {
            acc[product.category] = 0;
          }
          acc[product.category]++;
          return acc;
        }, {} as Record<string, number>);

        const initialCategories = Object.entries(categoriesMap)
          .map(([name, count]) => ({ id: name, name, count }))
          .sort((a, b) => a.name.localeCompare(b.name, 'zh-HK')); 
        
        setOrderedCategories(initialCategories);

      } catch (error) {
        console.error("Error fetching products from Firestore:", error);
        toast({
          title: "讀取產品資料失敗",
          description: "無法從資料庫讀取產品系列。請檢查您的 Firebase 設定或網絡連線。",
          variant: "destructive",
        });
        // Optionally, load mock data as a fallback or show an error state
        // setOrderedCategories([]); // Or load mock categories
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductsAndSetCategories();
  }, [toast]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        // Note: This reordering is client-side only. 
        // For persistence, you'd need to update Firestore.
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <FolderKanban className="w-10 h-10 mr-3 text-accent" />
            產品系列
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            選擇一個系列以查看詳細產品。您可以拖動卡片調整系列順序。
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

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground animate-pulse">正在載入產品系列...</p>
        </div>
      ) : orderedCategories.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedCategories.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {orderedCategories.map((categoryItem) => (
                <SortableCategoryCard key={categoryItem.id} categoryItem={categoryItem}>
                  <Card className="h-full flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
                    <Link 
                      href={`/admin/products/${encodeURIComponent(categoryItem.name)}`} 
                      className="block hover:no-underline flex-grow p-1"
                    >
                        <CardHeader>
                          <CardTitle className="text-2xl font-headline text-primary">{categoryItem.name}</CardTitle>
                          <CardDescription>{categoryItem.count} 種產品</CardDescription>
                        </CardHeader>
                    </Link>
                  </Card>
                </SortableCategoryCard>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">未找到任何產品系列。</p>
          <p className="mt-2 text-foreground">請先透過「新增產品」功能加入產品，或檢查您的Firebase設定和資料庫連線。</p>
        </div>
      )}
       <p className="text-sm text-muted-foreground mt-4 text-center">
        提示：目前的排序僅在當前頁面有效，刷新後將重置。如需永久儲存排序，需後續開發。
      </p>
    </div>
  );
}
