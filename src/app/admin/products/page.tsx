
import { mockProducts } from '@/lib/product-data';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, FolderKanban } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata = {
  title: '產品系列 - 智能點餐AI',
  description: '瀏覽和管理餐廳產品系列。',
};

export default function AdminProductsPage() {
  const categories = mockProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = 0;
    }
    acc[product.category]++;
    return acc;
  }, {} as Record<string, number>);

  const categoryEntries = Object.entries(categories);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <FolderKanban className="w-10 h-10 mr-3 text-accent" />
            產品系列
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            選擇一個系列以查看詳細產品。
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

      {categoryEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoryEntries.map(([category, count]) => (
            <Link key={category} href={`/admin/products/${encodeURIComponent(category)}`} legacyBehavior>
              <a className="block hover:no-underline">
                <Card className="h-full flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-2xl font-headline text-primary">{category}</CardTitle>
                    <CardDescription>{count} 種產品</CardDescription>
                  </CardHeader>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">未找到任何產品系列。</p>
          <p className="mt-2 text-foreground">新增產品以開始使用。</p>
        </div>
      )}
    </div>
  );
}
