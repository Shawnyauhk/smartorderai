
"use client";

import { use, useState, useEffect, useCallback } from 'react';
import ProductCard from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftCircle, ListOrdered, GripVertical, Trash2, Loader2, PlusCircle, Save } from 'lucide-react';
import type { Product } from '@/types';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { collection, getDocs, query, where, orderBy, doc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
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
  isSelected: boolean;
  onToggleSelection: (productId: string) => void;
}

function SortableProductItem({ product, onDeleteAttempt, isSelected, onToggleSelection }: SortableProductItemProps) {
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
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggleSelection(product.id)}
        aria-label={`選擇 ${product.name}`}
        className="absolute top-3 left-3 z-20 bg-card/80 rounded-sm border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        onClick={(e) => e.stopPropagation()} // Prevent dnd-kit from capturing click
        onKeyDown={(e) => { if (e.key === ' ') { e.stopPropagation(); } }} // Allow space to toggle
      />
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
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const { toast } = useToast();

  const [productToDelete, setProductToDelete] = useState<{id: string; name: string} | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!decodedCategory) return;
    setIsLoading(true);
    setSelectedProductIds(new Set()); 
    try {
      const productsCol = collection(db, 'products');
      // Order by the 'order' field first, then by 'name' as a fallback
      const q = query(productsCol, 
        where('category', '==', decodedCategory), 
        orderBy('order', 'asc'),
        orderBy('name', 'asc') 
      );
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
              <p>您可能需要為 'products' 集合建立一個包含 'category' (ASC), 'order' (ASC) 和 'name' (ASC) 的複合索引。</p>
              <p className="mt-2 text-xs">錯誤詳情: {(error as Error).message}</p>
            </div>
          ),
          variant: "destructive",
          duration: 15000,
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
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Add distance constraint
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const saveProductOrder = async (productsToSave: Product[]) => {
    if (productsToSave.length === 0) return;
    setIsSavingOrder(true);
    const batch = writeBatch(db);
    productsToSave.forEach((product, index) => {
      const productRef = doc(db, 'products', product.id);
      batch.update(productRef, { order: index });
    });

    try {
      await batch.commit();
      toast({
        title: "排序已儲存",
        description: `產品在 ${decodedCategory} 系列中的新順序已成功儲存。`,
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (error) {
      console.error("Error saving product order:", error);
      toast({
        title: "儲存排序失敗",
        description: "儲存產品排序時發生錯誤。請重試。",
        variant: "destructive",
      });
      // Optionally, refetch products to revert to last saved order
      // fetchProducts(); 
    } finally {
      setIsSavingOrder(false);
    }
  };


  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items; // Should not happen
        
        const movedItems = arrayMove(items, oldIndex, newIndex);
        saveProductOrder(movedItems); // Save the new order
        return movedItems;
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
      // No need to manually filter here, as fetchProducts will be called if products change,
      // or the order will be re-saved if deletion affects order.
      // For immediate UI update:
      setOrderedProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setSelectedProductIds(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(productToDelete.id);
        return newSelected;
      });
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

  const handleToggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(productId)) {
        newSelected.delete(productId);
      } else {
        newSelected.add(productId);
      }
      return newSelected;
    });
  };

  const handleToggleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true || (checked === 'indeterminate' && selectedProductIds.size !== orderedProducts.length)) {
        setSelectedProductIds(new Set(orderedProducts.map(p => p.id)));
    } else {
        setSelectedProductIds(new Set());
    }
  };
  
  const isAllSelected = orderedProducts.length > 0 && selectedProductIds.size === orderedProducts.length;
  const isSomeSelected = selectedProductIds.size > 0 && !isAllSelected;

  const confirmBatchDeleteProducts = async () => {
    if (selectedProductIds.size === 0) return;
    setIsDeletingBatch(true);
    const batch = writeBatch(db);
    const idsToDelete = Array.from(selectedProductIds);
    idsToDelete.forEach(id => {
      batch.delete(doc(db, 'products', id));
    });
    try {
      await batch.commit();
      setOrderedProducts(prev => prev.filter(p => !selectedProductIds.has(p.id)));
      const deletedCount = selectedProductIds.size;
      setSelectedProductIds(new Set());
      toast({
        title: "批量刪除成功",
        description: `已成功刪除 ${deletedCount} 個產品。`,
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (error) {
      console.error("Error batch deleting products:", error);
      toast({
        title: "批量刪除失敗",
        description: "批量刪除產品時發生錯誤。請重試。",
        variant: "destructive",
      });
    } finally {
      setIsDeletingBatch(false);
      setIsBatchDeleteDialogOpen(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-grow">
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
            瀏覽 {decodedCategory} 系列中的所有產品。您可以拖動卡片調整產品順序（順序將自動儲存）、編輯、選擇或刪除產品。
          </p>
        </div>
        <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow transform hover:scale-105 self-start sm:self-auto mt-4 sm:mt-0">
          <Link href={`/admin/products/add?category=${encodeURIComponent(decodedCategory)}`}>
            <PlusCircle className="mr-2 h-5 w-5" />
            新增產品到此系列
          </Link>
        </Button>
      </div>
      
      {orderedProducts.length > 0 && !isLoading && (
        <div className="flex items-center gap-4 my-4 p-3 bg-card rounded-md shadow">
            <div className="flex items-center">
                <Checkbox
                    id="select-all-products"
                    aria-label="全選/取消全選當前頁產品"
                    checked={isAllSelected ? true : (isSomeSelected ? 'indeterminate' : false)}
                    onCheckedChange={handleToggleSelectAll}
                    disabled={isLoading || orderedProducts.length === 0 || isSavingOrder}
                />
                <Label htmlFor="select-all-products" className="ml-2 text-sm font-medium text-foreground">
                    {isAllSelected ? "取消全選" : "全選"} ({selectedProductIds.size} / {orderedProducts.length})
                </Label>
            </div>
            <Button
                variant="destructive"
                size="sm"
                onClick={() => { if (selectedProductIds.size > 0) setIsBatchDeleteDialogOpen(true); }}
                disabled={selectedProductIds.size === 0 || isDeletingBatch || isLoading || isSavingOrder}
                className="transition-opacity hover:opacity-90"
            >
                {isDeletingBatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                批量刪除選中 ({selectedProductIds.size})
            </Button>
             {isSavingOrder && (
                <div className="flex items-center text-sm text-muted-foreground ml-auto">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                    正在儲存排序...
                </div>
            )}
        </div>
      )}
      
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
            <AlertDialogCancel onClick={() => setProductToDelete(null)} disabled={isDeletingProduct}>取消</AlertDialogCancel>
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

      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={(open) => !open && setIsBatchDeleteDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認批量刪除產品？</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除選中的 {selectedProductIds.size} 個產品嗎？此操作**無法復原**。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsBatchDeleteDialogOpen(false)} disabled={isDeletingBatch}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBatchDeleteProducts} 
              disabled={isDeletingBatch || selectedProductIds.size === 0}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeletingBatch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認刪除 {selectedProductIds.size} 個產品
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
                    isSelected={selectedProductIds.has(product.id)}
                    onToggleSelection={handleToggleProductSelection}
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
        提示：產品拖曳排序結果將自動儲存到資料庫。
      </p>
    </div>
  );
}
    