
"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Tag, PlusCircle, Trash2, Edit3 } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onDeleteAttempt?: (productId: string, productName: string) => void;
  showAdminControls?: boolean; // To show Edit/Delete buttons
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product,
  onAddToCart,
  onDeleteAttempt,
  showAdminControls = false,
}) => {
  return (
    <Card 
      className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 group/productcard"
    >
      <CardHeader className="p-0 relative">
        {product.imageUrl && (
          <div className="aspect-[4/3] w-full relative overflow-hidden">
            <Image
              src={product.imageUrl || 'https://placehold.co/300x200.png'}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover/productcard:scale-105 transition-transform duration-500 ease-in-out"
              data-ai-hint={product['data-ai-hint'] || 'food item'}
              priority={product.id === '1' || product.id === '2'} 
              onError={(e) => {
                // Fallback for broken images
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop if placeholder also fails
                target.src = 'https://placehold.co/300x200.png';
              }}
            />
          </div>
        )}
        {!product.imageUrl && (
           <div className="aspect-[4/3] w-full relative overflow-hidden bg-muted flex items-center justify-center">
            <Image
                src={'https://placehold.co/300x200.png'}
                alt={product.name}
                width={300}
                height={200}
                className="object-contain"
                data-ai-hint={product['data-ai-hint'] || 'food item'}
            />
           </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-2xl font-headline mb-1 text-primary">{product.name}</CardTitle>
        <Badge variant="secondary" className="mb-2 text-sm">
          <Tag className="w-4 h-4 mr-2" />
          {product.category}
        </Badge>
        <CardDescription className="text-sm text-foreground/80 line-clamp-3">
          {product.description || '暫無描述。'}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-3 bg-muted/30 flex flex-col items-stretch gap-2">
        <div className="flex items-center justify-between w-full">
          <p className="text-xl font-bold text-accent flex items-center">
            <DollarSign className="w-5 h-5 mr-1" />
            {`HK$${product.price.toFixed(2)}`}
          </p>
        </div>
        {onAddToCart && (
          <Button 
            onClick={() => onAddToCart(product)} 
            variant="outline" 
            size="sm" 
            className="w-full mt-1 border-primary text-primary hover:bg-primary/10 hover:text-primary"
            aria-label={`將 ${product.name} 加入購物車`}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            加入購物車
          </Button>
        )}
        {showAdminControls && (
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-blue-500 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700"
              asChild
            >
              <Link href={`/admin/products/edit/${product.id}`}>
                <Edit3 className="mr-2 h-4 w-4" />
                編輯
              </Link>
            </Button>
            {onDeleteAttempt && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  onDeleteAttempt(product.id, product.name);
                }}
                variant="outline" 
                size="sm" 
                className="w-full border-destructive text-destructive hover:bg-destructive/10"
                aria-label={`刪除產品 ${product.name}`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                刪除
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
