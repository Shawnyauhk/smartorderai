
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, FolderKanban, GripVertical, DatabaseZap, Loader2 } from 'lucide-react';
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
import { collection, getDocs, query, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { mockProducts } from '@/lib/product-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
  const [isSeeding, setIsSeeding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // For triggering data refetch
  const { toast } = useToast();

  useEffect(() => {
    document.title = "產品系列 - 智能點餐AI";

    const loadData = async () => {
      setIsLoading(true);
      try {
        const productsCol = collection(db, 'products');
        const productsSnapshot = await getDocs(query(productsCol));
        const fetchedProducts: Product[] = productsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Product));

        const categoriesMap = fetchedProducts.reduce((acc, product) => {
          if (!product.category) return acc;
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
          description: "無法從資料庫讀取產品系列。請檢查您的 Firebase 設定或網絡連線，以及 Firestore 安全性規則。",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast, refreshKey, setIsLoading, setOrderedCategories]);


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
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleSeedDatabase = useCallback(async () => {
    setIsSeeding(true);
    toast({
      title: "開始導入數據...",
      description: `正在將 ${mockProducts.length} 個模擬產品導入到 Firestore。請稍候。`,
    });

    try {
      const productsColRef = collection(db, 'products');
      const batchSize = 400; // Firestore batch limit is 500 operations
      let productsAddedCount = 0;

      for (let i = 0; i < mockProducts.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = mockProducts.slice(i, i + batchSize);

        chunk.forEach(product => {
          const productData = {
            name: product.name,
            price: product.price,
            category: product.category,
            description: product.description || '',
            imageUrl: product.imageUrl || `https://placehold.co/300x200.png?text=${encodeURIComponent(product.name)}`,
            'data-ai-hint': product['data-ai-hint'] || 'food item',
          };
          // For auto-generated ID, pass the collection reference to doc()
          const newDocRef = doc(collection(db, 'products'));
          batch.set(newDocRef, productData);
        });

        await batch.commit();
        productsAddedCount += chunk.length;
      }

      toast({
        title: "數據導入成功！",
        description: `已成功將 ${productsAddedCount} 個產品導入到您的 Firestore 產品庫中。`,
        variant: "default",
        className: "bg-green-500 text-white border-green-600",
      });
      setRefreshKey(prevKey => prevKey + 1); // Trigger data refresh
    } catch (error) {
      console.error("Error seeding database:", error);
      toast({
        title: "數據導入失敗",
        description: "導入產品數據到 Firestore 時發生錯誤。請檢查瀏覽器主控台獲取詳細資訊。",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  }, [toast, setIsSeeding, setRefreshKey]);

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
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent shadow-md hover:shadow-lg transition-shadow" disabled={isSeeding || isLoading}>
                  {isSeeding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <DatabaseZap className="mr-2 h-5 w-5" />}
                  {isSeeding ? "導入中..." : "從模擬數據導入產品"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認導入模擬數據？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作將會把系統內建的模擬產品數據 (共 {mockProducts.length} 項) 導入到您的 Firebase Firestore 產品庫中。
                    如果您的產品庫中已有同名產品，此操作可能會造成數據重複。
                    建議在產品庫為空或僅作初步填充時使用。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSeedDatabase} className="bg-primary hover:bg-primary/90">確認導入</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="default" size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow transform hover:scale-105" disabled={isLoading}>
            <Link href="/admin/products/add">
                <PlusCircle className="mr-2 h-5 w-5" />
                新增產品
            </Link>
            </Button>
        </div>
      </div>

      <Separator />

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-xl text-muted-foreground">正在載入產品系列...</p>
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
          <DatabaseZap className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <p className="text-xl font-headline text-primary mb-2">未找到任何產品系列</p>
          <p className="mt-2 text-foreground max-w-md mx-auto">
            您的產品庫目前是空的。您可以透過「新增產品」按鈕手動加入產品，或使用「從模擬數據導入產品」功能來快速填充產品庫。
          </p>
           <p className="text-xs text-muted-foreground mt-4">
            如果已導入或新增但仍未顯示，請檢查您的Firebase設定、Firestore安全性規則和資料庫連線。
          </p>
        </div>
      )}
       <p className="text-sm text-muted-foreground mt-4 text-center">
        提示：目前的排序僅在當前頁面有效，刷新後將重置。如需永久儲存排序，需後續開發。
      </p>
    </div>
  );
}

