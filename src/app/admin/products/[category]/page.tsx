
"use client";

import { use, useState, useEffect, useCallback } from 'react';
import ProductCard from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftCircle, ListOrdered, GripVertical, Trash2, Loader2 } from 'lucide-react';
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
import { collection, getDocs, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  params: Promise<{ category: string }>;
};

interface SortableProductItemProps {
  product: Product;
  onDeleteAttempt: (productId: string, productName: string) => void;
}

function SortableProductItem({ product, onDeleteAttempt }: SortableProductItemProps) {
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
    <div ref={setNodeRef} style={style} className="relative touch-manipulation group/sortableitem">
      <ProductCard product={product} onDeleteAttempt={onDeleteAttempt} showAdminControls={true} />
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 text-muted-foreground bg-card/70 rounded-full hover:text-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover/sortableitem:opacity-100 transition-opacity"
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

  const [productToDelete, setProductToDelete] = useState<{id: string; name: string} | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!decodedCategory) return;
    setIsLoading(true);
    try {
      const productsCol = collection(db, 'products');
      const q = query(productsCol, where('category', '==', decodedCategory), orderBy('name'));
      const productsSnapshot = await getDocs(q);
      const fetchedProducts: Product[] = productsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Product));
      
      setOrderedProducts(fetchedProducts);

    } catch (error) {
      console.error(`Error fetching products for category ${decodedCategory}:`, error);
      if ((error as any)?.code === 'failed-precondition' && (error as any)?.message?.includes('requires an index')) {
         toast({
          title: "查詢需要索引",
          description: (
            <div>
              <p>Firestore 需要一個複合索引來執行此查詢。錯誤訊息中應包含建立索引的連結。</p>
              <p className="mt-2 text-xs">錯誤詳情: {(error as Error).message}</p>
            </div>
          ),
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({
          title: "讀取產品失敗",
          description: `無法從資料庫讀取 ${decodedCategory} 系列的產品。請檢查您的 Firebase 設定或網絡連線。`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [decodedCategory, toast]);

  useEffect(() => {
    document.title = `${decodedCategory} - 產品列表 - 智能點餐AI`;
    fetchProducts();
  }, [decodedCategory, fetchProducts]);

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
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleAttemptDeleteProduct = (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
  };

  const confirmDeleteSingleProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      setOrderedProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      toast({
        title: "產品刪除成功",
        description: `產品 "${productToDelete.name}" 已成功刪除。`,
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (error) {
      console.error(`Error deleting product ${productToDelete.name}:`, error);
      toast({
        title: "刪除產品失敗",
        description: `刪除產品 "${productToDelete.name}" 時發生錯誤。請重試。`,
        variant: "destructive",
      });
    } finally {
      setIsDeletingProduct(false);
      setProductToDelete(null);
    }
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
            瀏覽 {decodedCategory} 系列中的所有產品。您可以拖動卡片調整產品順序，編輯或刪除產品。
          </p>
        </div>
      </div>
      
      <Separator />

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除產品？</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除產品「{productToDelete?.name}」嗎？此操作**無法復原**。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSingleProduct} 
              disabled={isDeletingProduct}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeletingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
         <div className="text-center py-12">
            <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-xl text-muted-foreground">正在載入 {decodedCategory} 產品...</p>
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
                <SortableProductItem 
                    key={product.id} 
                    product={product} 
                    onDeleteAttempt={handleAttemptDeleteProduct} 
                />
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
