
"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Tag, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  showSortButtons?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showSortButtons = false, 
  isFirst, 
  isLast, 
  onMoveUp, 
  onMoveDown 
}) => {
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
              priority={product.id === '1' || product.id === '2'} // Example priority, adjust as needed
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
      <CardFooter className="p-4 bg-muted/30 flex flex-col items-stretch gap-2">
        <div className="flex items-center justify-between w-full">
          <p className="text-2xl font-bold text-accent flex items-center">
            <DollarSign className="w-6 h-6 mr-1" />
            {`HK$${product.price.toFixed(2)}`}
          </p>
        </div>
        {showSortButtons && (
          <div className="flex justify-end space-x-2 w-full border-t pt-2 mt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label={`將 ${product.name} 上移`}
              className="h-8 w-8"
            >
              <ArrowUpCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label={`將 ${product.name} 下移`}
              className="h-8 w-8"
            >
              <ArrowDownCircle className="h-5 w-5" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
