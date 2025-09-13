
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingBag, X, Plus, Minus, Trash2, ChevronLeft, ChevronRight, Tag, Settings } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/components/ProductCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import React, { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProducts } from '@/lib/products';
import { Skeleton } from '@/components/ui/skeleton';


const ProductDetailsSheet = ({ product, onOpenChange }: { product: Product | null, onOpenChange: (open: boolean) => void }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = React.useState(1);
  
  React.useEffect(() => {
    if (product) {
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const increaseQuantity = () => setQuantity(q => q + 1);
  const decreaseQuantity = () => setQuantity(q => Math.max(1, q - 1));

  const total = (product.price * quantity).toFixed(2).replace('.', ',');

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onOpenChange(false);
  };

  return (
    <Sheet open={!!product} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="w-full max-w-md mx-auto rounded-t-2xl p-0">
          <SheetHeader className="p-4 bg-white rounded-t-2xl z-10 flex flex-row justify-between items-center">
            <SheetTitle className="sr-only">{product.name}</SheetTitle>
             <SheetClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </SheetClose>
          </SheetHeader>
           <div className="relative">
            <div className="overflow-y-auto max-h-[80vh]">
              <div className="relative h-48">
                  <Image 
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      data-ai-hint={product.imageHint}
                  />
                  {product.discount && (
                    <Badge variant="destructive" className="absolute top-2 left-2 text-base">{product.discount}</Badge>
                  )}
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                     <Image 
                      src="https://picsum.photos/seed/kfc-logo/100/100" 
                      alt="KFC"
                      data-ai-hint="KFC logo" 
                      width={40}
                      height={40}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <p className="font-bold">KFC</p>
                    <p className="text-xs text-gray-500">30-40 min · R$ 6.99</p>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-2">{product.description}</p>
                {product.serves && <p className="text-sm text-gray-500 mb-4">{product.serves}</p>}

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-2xl font-bold">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                  {product.originalPrice && (
                    <span className="text-gray-500 line-through">R$ {product.originalPrice.toFixed(2).replace('.', ',')}</span>
                  )}
                   {product.discount && (
                    <Badge variant="destructive" className="font-bold">{product.discount}</Badge>
                  )}
                </div>

                <div className="border-t border-b py-6">
                   <div className="flex items-center justify-between">
                      <p className="font-semibold text-lg">Quantidade</p>
                      <div className="flex items-center gap-4">
                          <Button variant="ghost" size="icon" onClick={decreaseQuantity} disabled={quantity === 1} className="rounded-full bg-gray-100 disabled:opacity-50">
                              <Minus className="w-5 h-5" />
                          </Button>
                          <span className="font-bold text-xl">{quantity}</span>
                          <Button variant="destructive" size="icon" onClick={increaseQuantity} className="rounded-full bg-red-600">
                              <Plus className="w-5 h-5" />
                          </Button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="p-4 bg-white border-t sticky bottom-0">
            <Button size="lg" className="w-full h-14 rounded-lg bg-red-600 hover:bg-red-700 text-lg" onClick={handleAddToCart}>Adicionar R$ {total}</Button>
          </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const CartSheet = ({ 
  isOpen, 
  onOpenChange,
}: { 
  isOpen: boolean, 
  onOpenChange: (open: boolean) => void,
}) => {
  const router = useRouter();
  const { 
    cart, 
    increaseCartItemQuantity, 
    decreaseCartItemQuantity, 
    removeCartItem,
    cartTotal
  } = useCart();
  const deliveryFee = 0; // Hardcoded for now
  const finalTotal = cartTotal + deliveryFee;

  const handleFinishOrder = () => {
    onOpenChange(false);
    router.push('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md mx-auto p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-xl text-center font-bold">Sua sacola</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full absolute top-3 right-3">
              <X className="w-5 h-5" />
            </Button>
          </SheetClose>
        </SheetHeader>
        
        {cart.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-10">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-700">Sua sacola está vazia</p>
            <p className="text-gray-500">Adicione itens para fazer um pedido.</p>
          </div>
        ) : (
          <>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {cart.map(item => (
                <div key={item.product.id} className="bg-white p-4 rounded-xl shadow-sm flex items-start gap-4">
                  <Image 
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    width={64}
                    height={64}
                    className="rounded-lg object-cover"
                    data-ai-hint={item.product.imageHint}
                  />
                  <div className="flex-grow">
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-red-600 font-bold">R$ {item.product.price.toFixed(2).replace('.', ',')}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => decreaseCartItemQuantity(item.product.id)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-bold text-lg">{item.quantity}</span>
                       <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => increaseCartItemQuantity(item.product.id)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-600 shrink-0" onClick={() => removeCartItem(item.product.id)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-white border-t mt-auto">
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxa de entrega</span>
                      <span className="text-green-600 font-semibold">{deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            </div>

            <SheetFooter className="p-4 bg-white border-t">
              <Button size="lg" className="w-full h-14 rounded-lg bg-red-600 hover:bg-red-700 text-lg" onClick={handleFinishOrder}>Finalizar Pedido</Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};


export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState('Todos');
  const [headerTitle, setHeaderTitle] = React.useState('Destaques');
  const [location, setLocation] = useState('KFC - Perto de você');

  const { addToCart, cartTotal, cartItemCount } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products');
        const fetchedProducts = await response.json();
        setProducts(fetchedProducts);
        // Extrai categorias únicas dos produtos e adiciona "Todos" no início
        const uniqueCategories = ['Todos', ...Array.from(new Set(fetchedProducts.map((p: Product) => p.category))) as string[]];
        setCategories(uniqueCategories);
        setHeaderTitle(uniqueCategories.includes('PROMOÇÕES') ? 'PROMOÇÕES' : 'Destaques')
        setSelectedCategory(uniqueCategories.includes('PROMOÇÕES') ? 'PROMOÇÕES' : 'Todos')
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    async function buscarLocalizacao() {
      try {
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (!response.ok) {
          throw new Error('Failed to fetch location');
        }
        const data = await response.json();
        if (data.city) {
          setLocation(`KFC - ${data.city}`);
        }
      } catch (error) {
        console.error('Erro ao buscar localização com a API geo.js:', error);
      }
    }
    buscarLocalizacao();
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };
  
  const handleQuickAdd = (product: Product) => {
    addToCart(product, 1);
  };


  const openCart = () => setIsCartOpen(true);


  const filteredProducts = selectedCategory === 'Todos' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setHeaderTitle(category === 'Todos' ? 'Destaques' : category);
  }
  
  const renderProductSkeletons = () => (
    Array.from({ length: 5 }).map((_, index) => (
       <div key={index} className="flex items-start gap-4">
        <div className="flex-grow space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/4" />
        </div>
        <Skeleton className="w-24 h-24 shrink-0 rounded-lg" />
    </div>
    ))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-grow">
        <header className="relative">
          <div className="h-40">
            <Image
              src="https://picsum.photos/seed/kfc-banner/1200/400"
              alt="KFC Banner"
              fill
              className="object-cover"
              data-ai-hint="KFC food collage"
            />
          </div>
          <div className="absolute top-4 left-4">
              <Button variant="ghost" size="icon" className="bg-white/90 rounded-full shadow-md hover:bg-white">
                  <ChevronLeft />
              </Button>
          </div>
          <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" className="bg-white/90 rounded-full shadow-md hover:bg-white">
                  <Search />
              </Button>
          </div>

          <div className="relative -mt-16 mx-4 bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden -mt-8 border-4 border-white">
                <Image 
                  src="https://picsum.photos/seed/kfc-logo/200/200" 
                  alt="KFC"
                  data-ai-hint="KFC logo" 
                  width={64}
                  height={64}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h1 id="user-location" className="text-xl font-bold text-gray-900">{location}</h1>
                <div className="flex items-center text-sm text-gray-600 cursor-pointer hover:text-red-600">
                  <span>Frango Frito</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs mt-4 pt-4 border-t">
                <div>
                    <p className="text-gray-500">Prazo de entrega</p>
                    <p className="font-bold">20-35 Min</p>
                </div>
                <div>
                    <p className="text-gray-500">Taxa de entrega</p>
                    <p className="font-bold text-green-600">Grátis</p>
                </div>
                <div>
                    <p className="text-gray-500">Mínimo</p>
                    <p className="font-bold">R$20,00</p>
                </div>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-1 mt-4" style={{ scrollbarWidth: 'none' }}>
                <Badge className="bg-green-100 text-green-800 border-green-200 py-2 px-3 rounded-lg text-xs flex items-center gap-1">
                  <Tag className="w-3 h-3"/> 50% OFF no 1º pedido
                </Badge>
                <Badge className="bg-green-100/60 text-green-800/80 border-green-200/60 py-2 px-3 rounded-lg text-xs">
                  40% OFF
                </Badge>
                <Badge className="bg-green-100/60 text-green-800/80 border-green-200/60 py-2 px-3 rounded-lg text-xs">
                  20% OFF
                </Badge>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="sticky top-0 bg-gray-50 z-10 py-2 -mx-4 px-4 border-b">
            <div className="flex space-x-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-9 w-24 rounded-full" />)
                ) : (
                  categories.map((category) => (
                    <Button 
                      key={category} 
                      variant={selectedCategory === category ? "default" : "secondary"} 
                      className={`rounded-full whitespace-nowrap transition-colors duration-300 px-4 py-2 text-sm h-auto ${selectedCategory === category ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category}
                    </Button>
                  ))
                )}
            </div>
          </div>
          
          <section className="mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{headerTitle}</h2>
            <div className="space-y-4">
              {isLoading ? renderProductSkeletons() : (
                  filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onProductClick={handleProductClick}
                      onQuickAdd={handleQuickAdd}
                    />
                  ))
              )}
            </div>
          </section>
        </main>
      </div>

      <footer className="w-full bg-gray-100 p-4 mt-8">
          <div className="max-w-7xl mx-auto flex justify-center items-center">
              <Link href="/admin/login" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Admin
              </Link>
          </div>
      </footer>

      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-transparent pointer-events-none">
          <div className="max-w-7xl mx-auto pointer-events-auto" onClick={openCart}>
            <div className="max-w-md mx-auto bg-red-600 text-white rounded-lg p-4 shadow-2xl cursor-pointer transform hover:scale-[1.02] transition-all flex justify-between items-center">
                <div>
                  <p className="font-semibold">{cartItemCount} item{cartItemCount > 1 ? 's' : ''}</p>
                  <p className="text-sm">R$ {cartTotal.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span>Ver sacola</span>
                  <ShoppingBag className="w-5 h-5" />
                </div>
            </div>
          </div>
        </div>
      )}
      
      <ProductDetailsSheet 
        product={selectedProduct}
        onOpenChange={(open) => {
            if (!open) {
                setSelectedProduct(null);
            }
        }}
      />

      <CartSheet 
        isOpen={isCartOpen}
        onOpenChange={setIsCartOpen}
      />
    </div>
  );
}

    

    

    