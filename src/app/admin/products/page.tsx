
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
import { collection, getDocs, query, writeBatch, doc, where, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
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

const CATEGORY_ORDER_COLLECTION = 'app_configuration';
const CATEGORY_ORDER_DOC_ID = 'categoryDisplayOrder';

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

  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [newCategoryNameForCreation, setNewCategoryNameForCreation] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const productsCol = collection(db, 'products');
      const productsSnapshot = await getDocs(query(productsCol));
      const fetchedProducts: Product[] = productsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Product));

      const categoriesMap = fetchedProducts.reduce((acc, product) => {
        if (!product.category) return acc;
        const categoryName = product.category.trim();
        if (!categoryName) return acc;

        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName]++;
        return acc;
      }, {} as Record<string, number>);

      let initialCategories = Object.entries(categoriesMap)
        .map(([name, count]) => ({ id: name, name, count }));

      const orderDocRef = doc(db, CATEGORY_ORDER_COLLECTION, CATEGORY_ORDER_DOC_ID);
      const orderDocSnap = await getDoc(orderDocRef);
      let storedOrderedNames: string[] = [];
      if (orderDocSnap.exists()) {
        const data = orderDocSnap.data();
        if (data && Array.isArray(data.orderedNames)) {
            storedOrderedNames = data.orderedNames.filter((name): name is string => typeof name === 'string' && name.trim() !== '');
        } else {
            console.warn(`'orderedNames' in ${CATEGORY_ORDER_DOC_ID} is not an array or document is malformed. Using empty order.`);
            storedOrderedNames = [];
        }
      }
      
      // Ensure all categories from storedOrderedNames are present in categoriesMap, even if they have 0 products
      storedOrderedNames.forEach(name => {
        if (!categoriesMap[name]) { 
          categoriesMap[name] = 0; 
        }
      });

       initialCategories = Object.entries(categoriesMap)
        .map(([name, count]) => ({ id: name, name, count }))
        ;


      initialCategories.sort((a, b) => {
        const indexA = storedOrderedNames.indexOf(a.name);
        const indexB = storedOrderedNames.indexOf(b.name);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB; 
        }
        if (indexA !== -1) {
          return -1; 
        }
        if (indexB !== -1) {
          return 1; 
        }
        // Fallback sort for categories not in storedOrderedNames
        return a.name.localeCompare(b.name, 'zh-HK');
      });
      
      const finalOrderedCategories = [];
      // Add categories based on storedOrderedNames first
      for (const name of storedOrderedNames) {
        const category = initialCategories.find(c => c.name === name);
        if (category) {
          finalOrderedCategories.push(category);
        }
      }

      // Add any remaining categories (those in products but not in storedOrder)
      const remainingCategories = initialCategories
        .filter(c => !storedOrderedNames.includes(c.name))
        .sort((a,b) => a.name.localeCompare(b.name, 'zh-HK')); // Ensure these are also sorted
      
      finalOrderedCategories.push(...remainingCategories);
      
      setOrderedCategories(finalOrderedCategories);

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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      let newOrderedItems: CategoryEntry[] = [];
      setOrderedCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        newOrderedItems = arrayMove(items, oldIndex, newIndex);
        return newOrderedItems;
      });

      if (newOrderedItems.length > 0) {
        try {
          const newOrderNames = newOrderedItems.map(item => item.name);
          const orderDocRef = doc(db, CATEGORY_ORDER_COLLECTION, CATEGORY_ORDER_DOC_ID);
          await setDoc(orderDocRef, { orderedNames: newOrderNames }, { merge: true });
          toast({
            title: "系列順序已儲存",
            description: "新的系列排列順序已成功儲存到資料庫。",
            className: "bg-green-500 text-white border-green-600",
          });
        } catch (error) {
          console.error("Error saving category order:", error);
          toast({
            title: "儲存順序失敗",
            description: "儲存系列排列順序時發生錯誤。",
            variant: "destructive",
          });
        }
      }
    }
  }

  const handleRequestDeleteCategory = (category: CategoryEntry) => {
    setCategoryToDelete(category);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);
    try {
      // Delete all products within this category
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
      
      // Update local state for categories
      setOrderedCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
      
      // Update categoryDisplayOrder in Firestore
      const orderDocRef = doc(db, CATEGORY_ORDER_COLLECTION, CATEGORY_ORDER_DOC_ID);
      const orderDocSnap = await getDoc(orderDocRef);
      if (orderDocSnap.exists()) {
        const data = orderDocSnap.data();
        if (data && Array.isArray(data.orderedNames)) {
            let currentOrderedNames = data.orderedNames;
            const updatedOrderedNames = currentOrderedNames.filter((name: string) => name !== categoryToDelete.name);
            if (updatedOrderedNames.length !== currentOrderedNames.length) {
                await setDoc(orderDocRef, { orderedNames: updatedOrderedNames }, { merge: true });
            }
        }
      }

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
    setNewCategoryNameInput(category.name);
  };

  const handleConfirmEditCategory = async () => {
    if (!categoryToEdit || !newCategoryNameInput.trim()) {
      toast({ title: "錯誤", description: "新系列名稱不能為空。", variant: "destructive" });
      return;
    }
    const newName = newCategoryNameInput.trim();
    if (newName === categoryToEdit.name) {
      toast({ title: "提示", description: "新舊系列名稱相同，無需修改。", variant: "default" });
      setCategoryToEdit(null);
      return;
    }
    if (orderedCategories.some(cat => cat.name === newName && cat.id !== categoryToEdit.id)) {
      toast({ title: "錯誤", description: `系列名稱 "${newName}" 已存在。請使用不同的名稱。`, variant: "destructive" });
      return;
    }

    setIsEditingCategoryName(true);
    const oldCategoryName = categoryToEdit.name;

    try {
      // Update category for all products in this category
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
      
      // Update categoryDisplayOrder in Firestore
      const orderDocRef = doc(db, CATEGORY_ORDER_COLLECTION, CATEGORY_ORDER_DOC_ID);
      const orderDocSnap = await getDoc(orderDocRef);
      let newOrderedNamesList = [];
      if (orderDocSnap.exists()) {
        const data = orderDocSnap.data();
        if (data && Array.isArray(data.orderedNames)) {
            newOrderedNamesList = data.orderedNames.map((name: string) => name === oldCategoryName ? newName : name);
        } else {
            // If orderedNames is malformed, initialize with the new name if no products exist for it yet,
            // or rely on loadData to reconstruct order based on product categories.
            // For simplicity, we update it, and loadData will re-sort based on this.
            newOrderedNamesList = [newName]; 
        }
      } else {
        newOrderedNamesList = [newName]; // Create if doesn't exist
      }
      await setDoc(orderDocRef, { orderedNames: newOrderedNamesList }, { merge: true });
      
      toast({
        title: "系列名稱更新成功",
        description: `系列 "${oldCategoryName}" 已成功更名為 "${newName}"。頁面將重新載入以更新。`,
        className: "bg-green-500 text-white border-green-600",
      });
      
      setRefreshKey(prev => prev + 1); // Trigger data reload

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

  const handleCreateNewCategory = async () => {
    setIsCreatingCategory(true);
    const trimmedName = newCategoryNameForCreation.trim();

    if (!trimmedName) {
      toast({ title: "錯誤", description: "新系列名稱不能為空。", variant: "destructive" });
      setIsCreatingCategory(false);
      return;
    }

    if (orderedCategories.some(cat => cat.name === trimmedName)) {
      toast({ title: "錯誤", description: `系列名稱 "${trimmedName}" 已存在。請使用不同的名稱。`, variant: "destructive" });
      setIsCreatingCategory(false);
      return;
    }

    try {
      // Update categoryDisplayOrder in Firestore
      const orderDocRef = doc(db, CATEGORY_ORDER_COLLECTION, CATEGORY_ORDER_DOC_ID);
      const orderDocSnap = await getDoc(orderDocRef);
      
      let currentOrderedNames: string[] = [];
      if (orderDocSnap.exists()) {
        const data = orderDocSnap.data();
        // Ensure data.orderedNames is an array, default to empty array if not
        if (data && Array.isArray(data.orderedNames)) { 
          currentOrderedNames = data.orderedNames.filter((name): name is string => typeof name === 'string' && name.trim() !== '');
        } else {
          // If orderedNames doesn't exist or is not an array, initialize as empty
          currentOrderedNames = [];
        }
      }
      
      // Ensure currentOrderedNames is always an array before push
      if (!Array.isArray(currentOrderedNames)) {
           console.warn(`${CATEGORY_ORDER_DOC_ID} document's orderedNames was not an array. Reinitializing.`);
           currentOrderedNames = [];
      }

      if (!currentOrderedNames.includes(trimmedName)) {
        currentOrderedNames.push(trimmedName);
        await setDoc(orderDocRef, { orderedNames: currentOrderedNames }, { merge: true });
      }

      toast({
        title: "新增系列成功",
        description: `系列 "${trimmedName}" 已成功新增。`,
        className: "bg-green-500 text-white border-green-600",
      });

      setIsNewCategoryDialogOpen(false);
      setNewCategoryNameForCreation('');
      setRefreshKey(prev => prev + 1); // Trigger data reload
    } catch (error) {
      console.error(`Error creating new category ${trimmedName}:`, error);
      toast({
        title: "新增系列失敗",
        description: `新增系列 "${trimmedName}" 時發生錯誤。請重試。`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const productsCol = collection(db, 'products');
      const batch = writeBatch(db);

      mockProducts.forEach((product: Product) => { // No index needed if using product.order
        const productIdString = String(product.id); 
        const productRef = doc(productsCol, productIdString);
        
        const productDataForFirestore: Product = {
          id: productIdString,
          name: String(product.name),
          price: Number(product.price) || 0,
          category: String(product.category),
          description: product.description || '',
          imageUrl: product.imageUrl || `https://placehold.co/300x200.png`,
          'data-ai-hint': product['data-ai-hint'] || product.name.toLowerCase().split(' ').slice(0,2).join(' ') || 'food item',
          order: product.order, // Use order from mockProducts directly
          options: product.options || [],
        };
        batch.set(productRef, productDataForFirestore);
      });

      await batch.commit();

      // Update categoryDisplayOrder based on mockProducts
      const uniqueCategoriesFromSeed = Array.from(new Set(mockProducts.map(p => p.category.trim()).filter(Boolean)));
      
      const orderDocRef = doc(db, CATEGORY_ORDER_COLLECTION, CATEGORY_ORDER_DOC_ID);
      const orderDocSnap = await getDoc(orderDocRef);
      let existingOrderedNames: string[] = [];

      if (orderDocSnap.exists()) {
        const data = orderDocSnap.data();
        if (data && Array.isArray(data.orderedNames)) {
            existingOrderedNames = data.orderedNames.filter((name): name is string => typeof name === 'string' && name.trim() !== '');
        }
      }
      
      // Filter existingOrderedNames to only include those present in uniqueCategoriesFromSeed
      let updatedOrderedNames = existingOrderedNames.filter(name => uniqueCategoriesFromSeed.includes(name));
      
      // Add new categories from seed data that are not already in updatedOrderedNames
      const newlyAddedCategoriesFromSeed = uniqueCategoriesFromSeed.filter(name => !updatedOrderedNames.includes(name));
      // Sort newly added categories alphabetically (or by preferred locale) before appending
      newlyAddedCategoriesFromSeed.sort((a,b) => a.localeCompare(b, 'zh-HK'));
      
      updatedOrderedNames.push(...newlyAddedCategoriesFromSeed);
      
      // If updatedOrderedNames is still empty but uniqueCategoriesFromSeed is not, initialize with sorted uniqueCategoriesFromSeed
      if (updatedOrderedNames.length === 0 && uniqueCategoriesFromSeed.length > 0) {
          // This case is covered by the newlyAddedCategories logic if existingOrderedNames was empty
          // We can simplify: if uniqueCategoriesFromSeed has items, updatedOrderedNames will get them.
          // If uniqueCategoriesFromSeed is empty, updatedOrderedNames remains empty (or filtered empty).
      }
      
      await setDoc(orderDocRef, { orderedNames: updatedOrderedNames });

      toast({
        title: "模擬數據導入成功！",
        description: `${mockProducts.length} 項模擬產品已成功導入到資料庫（包含預設排序值），並且產品系列順序已根據模擬數據更新。`,
        className: "bg-green-500 text-white border-green-600",
        duration: 8000,
      });
      setRefreshKey(prev => prev + 1); // Trigger data reload
    } catch (error) {
      console.error("Error seeding database:", error);
      toast({
        title: "導入模擬數據失敗",
        description: `導入模擬產品時發生錯誤: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <FolderKanban className="w-10 h-10 mr-3 text-accent" />
            產品系列
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            選擇一個系列以查看詳細產品。您可以拖動卡片調整系列順序，或編輯/刪除系列。調整後的順序將會儲存。
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
                    此操作將會把系統內建的模擬產品數據 (共 {mockProducts.length} 項) 導入到您的 Firebase Firestore 產品庫中，並為每個產品設定其在模擬數據中定義的排序值。
                    如果您的產品庫中已有相同 ID 的產品，此操作將會**覆蓋**它們。
                    同時，產品系列的顯示順序將會根據模擬數據中存在的分類進行更新，移除不存在於模擬數據中的舊系列名稱。
                    建議在產品庫為空或可安全覆蓋時使用。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSeedDatabase} className="bg-primary hover:bg-primary/90" disabled={isSeeding}>確認導入</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
             <Button 
                variant="default"
                size="lg"
                onClick={() => setIsNewCategoryDialogOpen(true)} 
                disabled={isLoading || isSeeding}
                className="shadow-md hover:shadow-lg transition-shadow transform hover:scale-105"
            >
                <PlusCircle className="mr-2 h-5 w-5" />
                新增系列
            </Button>
            <Button variant="default" size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow transform hover:scale-105" disabled={isLoading}>
            <Link href="/admin/products/add">
                <PlusCircle className="mr-2 h-5 w-5" />
                新增產品
            </Link>
            </Button>
        </div>
      </div>

      <Separator />

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

      <AlertDialog open={!!categoryToEdit} onOpenChange={(open) => { if (!open) { setCategoryToEdit(null); setNewCategoryNameInput(''); }}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>編輯系列名稱</AlertDialogTitle>
            <AlertDialogDescription>
              為系列「{categoryToEdit?.name}」輸入新的名稱。此操作將更新此系列下所有產品的分類，並儲存系列順序。
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
              disabled={isEditingCategoryName}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setCategoryToEdit(null); setNewCategoryNameInput(''); }} disabled={isEditingCategoryName}>取消</AlertDialogCancel>
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

      <AlertDialog open={isNewCategoryDialogOpen} onOpenChange={(open) => { if(!open) {setIsNewCategoryDialogOpen(false); setNewCategoryNameForCreation('');} }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>新增產品系列</AlertDialogTitle>
            <AlertDialogDescription>
              輸入新系列的名稱。建立後，您可以開始向此系列新增產品。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="newCategoryNameCreation" className="text-sm font-medium">
              新系列名稱*
            </Label>
            <Input
              id="newCategoryNameCreation"
              value={newCategoryNameForCreation}
              onChange={(e) => setNewCategoryNameForCreation(e.target.value)}
              placeholder="例如：熱門推介"
              autoFocus
              disabled={isCreatingCategory}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsNewCategoryDialogOpen(false); setNewCategoryNameForCreation(''); }} disabled={isCreatingCategory}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateNewCategory}
              disabled={isCreatingCategory || !newCategoryNameForCreation.trim()}
            >
              {isCreatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認新增
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
            items={orderedCategories.map(c => c.id)} 
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
            您的產品庫目前是空的，或者未能成功讀取。您可以透過「新增產品」按鈕手動加入產品，使用「從模擬數據導入產品」功能來快速填充產品庫（這將確保產品包含排序欄位），或使用「新增系列」來建立一個空的產品系列。
          </p>
           <p className="text-xs text-muted-foreground mt-4">
            如果已導入或新增但仍未顯示，請檢查您的Firebase設定、Firestore安全性規則和資料庫連線，或嘗試使用「從模擬數據導入產品」功能來同步分類列表並確保產品包含必要的排序欄位。
          </p>
        </div>
      )}
    </div>
  );
}

    

    
    
