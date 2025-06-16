"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Tag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
      <CardHeader className="p-0">
        {product.imageUrl && (
          <div className="aspect-[3/2] w-full relative overflow-hidden">
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
      <CardContent className="p-6 flex-grow">
        <CardTitle className="text-2xl font-headline mb-2 text-primary">{product.name}</CardTitle>
        <Badge variant="secondary" className="mb-3 text-sm">
          <Tag className="w-4 h-4 mr-2" />
          {product.category}
        </Badge>
        <CardDescription className="text-base text-foreground/80 line-clamp-3">
          {product.description || '暫無描述。'}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-6 bg-muted/30">
        <div className="flex items-center justify-between w-full">
          <p className="text-2xl font-bold text-accent flex items-center">
            <DollarSign className="w-6 h-6 mr-1" />
            {`HK$${product.price.toFixed(2)}`}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
