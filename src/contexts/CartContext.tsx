
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/components/ProductCard';
import { useToast } from "@/hooks/use-toast";


export type CartItem = {
  product: Product;
  quantity: number;
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  increaseCartItemQuantity: (productId: string) => void;
  decreaseCartItemQuantity: (productId: string) => void;
  removeCartItem: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('kfc-cart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
      setCart([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kfc-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.product.id === product.id);
      let newCart = [...prevCart];
      if (existingItemIndex !== -1) {
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + quantity,
        };
      } else {
        newCart.push({ product, quantity });
      }
       /* toast({
        title: "Item adicionado!",
        description: `${product.name} foi adicionado à sua sacola.`,
       }); */
      return newCart;
    });
  };

  const increaseCartItemQuantity = (productId: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseCartItemQuantity = (productId: string) => {
    setCart(prevCart => {
      const itemToDecrease = prevCart.find(item => item.product.id === productId);
      if (itemToDecrease && itemToDecrease.quantity === 1) {
        // Remove the item if its quantity is 1
        return prevCart.filter(item => item.product.id !== productId);
      } else {
        // Otherwise, just decrease the quantity
        return prevCart.map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
    });
  };

  const removeCartItem = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
     /* toast({
        variant: "destructive",
        title: "Item removido",
        description: "O item foi removido da sua sacola.",
    }); */
  };
  
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('kfc-cart');
  };

  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const value = {
    cart,
    addToCart,
    increaseCartItemQuantity,
    decreaseCartItemQuantity,
    removeCartItem,
    clearCart,
    cartTotal,
    cartItemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
