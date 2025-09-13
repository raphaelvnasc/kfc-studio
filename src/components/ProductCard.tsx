
'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  imageHint: string;
  discount?: string;
  category: string;
  serves?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

type ProductCardProps = {
  product: Product;
  onProductClick: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
};

export const ProductCard = ({ product, onProductClick, onQuickAdd }: ProductCardProps) => (
  <div 
    className="flex items-start gap-4 cursor-pointer group"
    onClick={() => onProductClick(product)}
  >
    <div className="flex-grow">
       <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-red-600 transition-colors">{product.name}</h3>
       <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
       <div className="flex items-baseline gap-2">
        <span className="text-base font-bold text-gray-900">
             R$ {product.price.toFixed(2).replace('.', ',')}
        </span>
         {product.originalPrice && (
          <span className="text-xs text-gray-500 line-through">
            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
          </span>
        )}
       </div>
    </div>
    <div className="relative w-24 h-24 shrink-0">
      <Image 
        src={product.imageUrl} 
        alt={product.name} 
        width={96} 
        height={96}
        data-ai-hint={product.imageHint}
        className="w-full h-full object-cover rounded-lg" 
      />
      <Button 
        size="icon" 
        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 shadow-lg"
        onClick={(e) => { e.stopPropagation(); onQuickAdd(product); }}
      >
        <Plus className="w-5 h-5"/>
      </Button>
    </div>
  </div>
);
