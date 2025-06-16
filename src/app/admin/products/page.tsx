import { mockProducts } from '@/lib/product-data';
import ProductCard from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, ListOrdered } from 'lucide-react';

export const metadata = {
  title: 'Manage Products - SmartOrder AI',
  description: 'View and manage restaurant products.',
};

export default function AdminProductsPage() {
  // In a real app, product data would be fetched from a database.
  // For now, we use mock data. Product creation/editing UI is not implemented for simplicity.

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
                <ListOrdered className="w-10 h-10 mr-3 text-accent"/>
                Product Menu
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
                Browse all available items in the restaurant.
            </p>
        </div>
        <Button variant="default" size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow transform hover:scale-105">
          <Link href="#"> {/* Placeholder for Add Product page */}
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Product (Coming Soon)
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
          <p className="text-xl text-muted-foreground">No products found.</p>
          <p className="mt-2 text-foreground">Add products to get started.</p>
        </div>
      )}
    </div>
  );
}
