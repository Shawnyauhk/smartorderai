
"use client";

import { use, useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftCircle, ListOrdered, GripVertical } from 'lucide-react';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

type Props = {
  params: Promise<{ category: string }>;
};

interface SortableProductItemProps {
  product: Product;
}

function SortableProductItem({ product }: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative touch-manipulation group/productcard">
      <ProductCard product={product} />
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 text-muted-foreground bg-card/70 rounded-full hover:text-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover/productcard:opacity-100 transition-opacity"
        aria-label={`拖動排序 ${product.name}`}
      >
        <GripVertical className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function CategoryProductsPage({ params: paramsPromise }: Props) {
  const params = use(paramsPromise);
  const decodedCategory = decodeURIComponent(params.category);
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    document.title = `${decodedCategory} - 產品列表 - 智能點餐AI`;
    const fetchProducts = async () => {
      if (!decodedCategory) return;
      setIsLoading(true);
      try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, where('category', '==', decodedCategory), orderBy('name')); // Example: order by name
        const productsSnapshot = await getDocs(q);
        const fetchedProducts: Product[] = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        
        setOrderedProducts(fetchedProducts);

      } catch (error) {
        console.error(`Error fetching products for category ${decodedCategory}:`, error);
        toast({
          title: "讀取產品失敗",
          description: `無法從資料庫讀取 ${decodedCategory} 系列的產品。請檢查您的 Firebase 設定或網絡連線。`,
          variant: "destructive",
        });
        // setOrderedProducts([]); // Or fallback to mock data if necessary
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [decodedCategory, toast]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedProducts((items) => {
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
            瀏覽 {decodedCategory} 系列中的所有產品。您可以拖動卡片調整產品順序。
          </p>
        </div>
      </div>
      
      <Separator />

      {isLoading ? (
         <div className="text-center py-12">
            <p className="text-xl text-muted-foreground animate-pulse">正在載入 {decodedCategory} 產品...</p>
         </div>
      ) : orderedProducts.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedProducts.map(p => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {orderedProducts.map((product) => (
                <SortableProductItem key={product.id} product={product} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">在此系列中未找到任何產品。</p>
          <p className="mt-2 text-foreground">請先透過「新增產品」功能加入產品到此系列，或檢查您的Firebase設定和資料庫連線。</p>
        </div>
      )}
      <p className="text-sm text-muted-foreground mt-4 text-center">
        提示：目前的排序僅在當前頁面有效，刷新後將重置。如需永久儲存排序，需後續開發。
      </p>
    </div>
  );
}
