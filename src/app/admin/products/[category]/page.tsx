
import { mockProducts } from '@/lib/product-data';
import ProductCard from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftCircle, ListOrdered } from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { category: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const decodedCategory = decodeURIComponent(params.category);
  return {
    title: `${decodedCategory} - 產品列表 - 智能點餐AI`,
    description: `查看 ${decodedCategory} 系列中的所有產品。`,
  };
}

export default function CategoryProductsPage({ params }: Props) {
  const decodedCategory = decodeURIComponent(params.category);
  const productsInCategory = mockProducts.filter(
    (product) => product.category === decodedCategory
  );

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
            瀏覽 {decodedCategory} 系列中的所有產品。
          </p>
        </div>
      </div>
      
      <Separator />

      {productsInCategory.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productsInCategory.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">在此系列中未找到任何產品。</p>
        </div>
      )}
    </div>
  );
}
