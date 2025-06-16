import { mockProducts } from '@/lib/product-data';
import ProductCard from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, ListOrdered } from 'lucide-react';

export const metadata = {
  title: '管理產品 - 智能點餐AI',
  description: '查看和管理餐廳產品。',
};

export default function AdminProductsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
                <ListOrdered className="w-10 h-10 mr-3 text-accent"/>
                產品餐牌
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
                瀏覽餐廳內所有供應的食品。
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

      {mockProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">未找到任何產品。</p>
          <p className="mt-2 text-foreground">新增產品以開始使用。</p>
        </div>
      )}
    </div>
  );
}
