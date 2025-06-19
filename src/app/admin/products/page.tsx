
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, FolderKanban, GripVertical, DatabaseZap, Loader2, BrainCircuit, Trash2, Edit3 } from 'lucide-react';
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
import { collection, getDocs, query, writeBatch, doc, where, deleteDoc } from 'firebase/firestore';
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
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CategoryEntry = { id: string; name: string; count: number };

interface SortableCategoryCardProps {
  categoryItem: CategoryEntry;
  children: React.ReactNode;
  onDeleteRequest: (category: CategoryEntry) => void;
  onEditRequest: (category: CategoryEntry) => void;
}

function SortableCategoryCard({ categoryItem, children, onDeleteRequest, onEditRequest }: SortableCategoryCardProps) {
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
    <div ref={setNodeRef} style={style} className="relative touch-manipulation group/categorycard">
      {children}
      {/* Admin Controls Toolbar */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover/categorycard:opacity-100 transition-opacity z-10">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 text-muted-foreground bg-card/80 backdrop-blur-sm rounded-md hover:text-foreground cursor-grab active:cursor-grabbing shadow"
          aria-label={`拖動排序 ${categoryItem.name}`}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <Button
            variant="outline"
            size="icon"
            className="p-1.5 h-auto w-auto border-blue-500 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700 bg-card/80 backdrop-blur-sm rounded-md shadow"
            onClick={(e) => {
                e.stopPropagation();
                onEditRequest(categoryItem);
            }}
            aria-label={`編輯系列 ${categoryItem.name}`}
        >
            <Edit3 className="h-4 w-4" />
        </Button>
        <Button 
            variant="outline"
            size="icon" 
            className="p-1.5 h-auto w-auto border-destructive text-destructive hover:bg-destructive/10 bg-card/80 backdrop-blur-sm rounded-md shadow"
            onClick={(e) => {
              e.stopPropagation(); 
              onDeleteRequest(categoryItem);
            }}
            aria-label={`刪除系列 ${categoryItem.name}`}
            >
            <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [orderedCategories, setOrderedCategories] = useState<CategoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const [categoryToDelete, setCategoryToDelete] = useState<CategoryEntry | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const [categoryToEdit, setCategoryToEdit] = useState<CategoryEntry | null>(null);
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');
  const [isEditingCategoryName, setIsEditingCategoryName] = useState(false);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const productsCol = collection(db, 'products');
      const productsSnapshot = await getDocs(query(productsCol)); // Consider adding orderBy here if needed, or rely on client-side sort
      const fetchedProducts: Product[] = productsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Product));

      const categoriesMap = fetchedProducts.reduce((acc, product) => {
        if (!product.category) return acc; // Skip products without a category
        const categoryName = product.category.trim();
        if (!categoryName) return acc; // Skip products with empty string category

        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName]++;
        return acc;
      }, {} as Record<string, number>);

      const initialCategories = Object.entries(categoriesMap)
        .map(([name, count]) => ({ id: name, name, count })) // id is name for DNDKit key
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-HK'));

      setOrderedCategories(initialCategories);

    } catch (error) {
      console.error("Error fetching products from Firestore:", error);
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
          title: "讀取產品資料失敗",
          description: "無法從資料庫讀取產品系列。請檢查您的 Firebase 設定、Firestore 安全性規則或網絡連線。",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    document.title = "產品系列 - 智能點餐AI";
    loadData();
  }, [loadData, refreshKey]);


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

  const handleRequestDeleteCategory = (category: CategoryEntry) => {
    setCategoryToDelete(category);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);
    try {
      const productsCol = collection(db, 'products');
      const q = query(productsCol, where('category', '==', categoryToDelete.name));
      const productsSnapshot = await getDocs(q);

      if (!productsSnapshot.empty) {
        const batch = writeBatch(db);
        productsSnapshot.docs.forEach((productDoc) => {
          batch.delete(doc(db, 'products', productDoc.id));
        });
        await batch.commit();
      }
      
      setOrderedCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
      toast({
        title: "系列刪除成功",
        description: `系列 "${categoryToDelete.name}" 及其所有產品已成功刪除。`,
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (error) {
      console.error(`Error deleting category ${categoryToDelete.name}:`, error);
      toast({
        title: "刪除系列失敗",
        description: `刪除系列 "${categoryToDelete.name}" 時發生錯誤。請重試。`,
        variant: "destructive",
      });
    } finally {
      setIsDeletingCategory(false);
      setCategoryToDelete(null);
    }
  };

  const handleRequestEditCategory = (category: CategoryEntry) => {
    setCategoryToEdit(category);
    setNewCategoryNameInput(category.name); // Pre-fill input with current name
  };

  const handleConfirmEditCategory = async () => {
    if (!categoryToEdit || !newCategoryNameInput.trim()) {
      toast({ title: "錯誤", description: "新系列名稱不能為空。", variant: "destructive" });
      return;
    }
    const newName = newCategoryNameInput.trim();
    if (newName === categoryToEdit.name) {
      toast({ title: "提示", description: "新舊系列名稱相同，無需修改。", variant: "default" });
      setCategoryToEdit(null); // Close dialog
      return;
    }
     // Check for name collision with other existing categories
    if (orderedCategories.some(cat => cat.name === newName && cat.id !== categoryToEdit.id)) {
      toast({ title: "錯誤", description: `系列名稱 "${newName}" 已存在。請使用不同的名稱。`, variant: "destructive" });
      return;
    }

    setIsEditingCategoryName(true);
    const oldCategoryName = categoryToEdit.name;
    const oldCategoryId = categoryToEdit.id;

    try {
      const productsCol = collection(db, 'products');
      const q = query(productsCol, where('category', '==', oldCategoryName));
      const productsSnapshot = await getDocs(q);

      if (!productsSnapshot.empty) {
        const batch = writeBatch(db);
        productsSnapshot.docs.forEach((productDoc) => {
          batch.update(doc(db, 'products', productDoc.id), { category: newName });
        });
        await batch.commit();
      }

      setOrderedCategories(prev =>
        prev.map(cat =>
          cat.id === oldCategoryId ? { ...cat, name: newName, id: newName } : cat // Update name and id
        ).sort((a, b) => a.name.localeCompare(b.name, 'zh-HK')) // Re-sort
      );

      toast({
        title: "系列名稱更新成功",
        description: `系列 "${oldCategoryName}" 已成功更名為 "${newName}"。`,
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (error) {
      console.error(`Error updating category name for ${oldCategoryName}:`, error);
      toast({
        title: "更新系列名稱失敗",
        description: `更新系列名稱時發生錯誤。請重試。錯誤: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsEditingCategoryName(false);
      setCategoryToEdit(null);
      setNewCategoryNameInput('');
    }
  };


  const handleSeedDatabase = useCallback(async () => {
    setIsSeeding(true);
    toast({
      title: "開始導入數據...",
      description: `正在將 ${mockProducts.length} 個模擬產品導入到 Firestore。請稍候。`,
    });

    try {
      const batchSize = 400;
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
      setRefreshKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error("Error seeding database:", error);
      toast({
        title: "數據導入失敗",
        description: "導入產品數據到 Firestore 時發生錯誤。請檢查瀏覽器主控台獲取詳細資訊，並確認 Firestore 安全性規則允許寫入。",
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
            選擇一個系列以查看詳細產品。您可以拖動卡片調整系列順序，或編輯/刪除系列。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
             <Button variant="outline" asChild className="border-purple-500 text-purple-600 hover:bg-purple-500/10 hover:text-purple-700 shadow-md hover:shadow-lg transition-shadow" disabled={isLoading}>
                <Link href="/admin/products/import-image">
                    <BrainCircuit className="mr-2 h-5 w-5" />
                    從圖片導入 (AI)
                </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-accent-foreground text-accent-foreground hover:bg-accent/20 hover:text-accent-foreground shadow-md hover:shadow-lg transition-shadow" disabled={isSeeding || isLoading}>
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
                  <AlertDialogAction onClick={handleSeedDatabase} className="bg-primary hover:bg-primary/90" disabled={isSeeding}>確認導入</AlertDialogAction>
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

      {/* Delete Category Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除系列？</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除系列「{categoryToDelete?.name}」嗎？
              此操作將同時刪除此系列下的所有 {categoryToDelete?.count} 個產品，且**無法復原**。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeleteCategory} 
              disabled={isDeletingCategory}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeletingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Category Name Dialog */}
      <AlertDialog open={!!categoryToEdit} onOpenChange={(open) => { if (!open) { setCategoryToEdit(null); setNewCategoryNameInput(''); }}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>編輯系列名稱</AlertDialogTitle>
            <AlertDialogDescription>
              為系列「{categoryToEdit?.name}」輸入新的名稱。此操作將更新此系列下所有產品的分類。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="newCategoryName" className="text-sm font-medium">
              新系列名稱*
            </Label>
            <Input
              id="newCategoryName"
              value={newCategoryNameInput}
              onChange={(e) => setNewCategoryNameInput(e.target.value)}
              placeholder="輸入新的系列名稱"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setCategoryToEdit(null); setNewCategoryNameInput(''); }}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmEditCategory}
              disabled={isEditingCategoryName || !newCategoryNameInput.trim() || newCategoryNameInput.trim() === categoryToEdit?.name}
            >
              {isEditingCategoryName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認更新
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


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
            items={orderedCategories.map(c => c.id)} // Ensure ID is stable and unique
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {orderedCategories.map((categoryItem) => (
                <SortableCategoryCard 
                    key={categoryItem.id} 
                    categoryItem={categoryItem} 
                    onDeleteRequest={handleRequestDeleteCategory}
                    onEditRequest={handleRequestEditCategory}
                >
                  <Card className="h-full flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
                    <Link
                      href={`/admin/products/${encodeURIComponent(categoryItem.name)}`}
                      className="block hover:no-underline flex-grow p-1"
                      onClick={(e) => {
                        // Prevent navigation if any of the buttons in the toolbar are active
                        if ((e.target as HTMLElement).closest('button[aria-label*="系列"]') || (e.target as HTMLElement).closest('button[aria-label*="排序"]')) {
                           e.preventDefault();
                        }
                      }}
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

