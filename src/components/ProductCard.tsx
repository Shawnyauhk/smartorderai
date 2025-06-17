
"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Tag, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product,
  onAddToCart,
}) => {
  return (
    <Card 
      className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1"
    >
      <CardHeader className="p-0">
        {product.imageUrl && (
          <div className="aspect-[4/3] w-full relative overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
              data-ai-hint={product['data-ai-hint'] || 'food item'}
              priority={product.id === '1' || product.id === '2'} 
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
      </CardFooter>
    </Card>
  );
};

export default ProductCard;

