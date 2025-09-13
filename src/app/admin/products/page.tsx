
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Edit } from 'lucide-react';
import type { Product } from '@/components/ProductCard';
import Image from 'next/image';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Nome é obrigatório.' }),
  description: z.string().min(1, { message: 'Descrição é obrigatória.' }),
  price: z.coerce.number().min(0.01, { message: 'Preço deve ser maior que zero.' }),
  category: z.string().min(1, { message: 'Categoria é obrigatória.' }),
  imageUrl: z.string().url({ message: 'URL da imagem inválida.' }),
  imageHint: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      imageUrl: 'https://picsum.photos/seed/product/600/400',
      imageHint: '',
    },
  });

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data: Product[] = await response.json();
        setProducts(data);
        const uniqueCategories = [...new Set(data.map(p => p.category))];
        setCategories(uniqueCategories);
      } else {
        throw new Error('Falha ao carregar produtos');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  const handleOpenDialog = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      form.reset(product);
    } else {
      form.reset({
        name: '',
        description: '',
        price: 0,
        category: '',
        imageUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
        imageHint: '',
      });
    }
    setIsDialogOpen(true);
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    const updatedProducts = products.filter(p => p.id !== productId);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProducts),
      });

      if (!response.ok) throw new Error('Falha ao excluir produto.');
      
      setProducts(updatedProducts);
      toast({ title: 'Sucesso', description: 'Produto excluído.' });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    
    let updatedProducts: Product[];

    if (editingProduct) { // Edit
      updatedProducts = products.map(p => p.id === editingProduct.id ? { ...p, ...values, id: p.id } : p);
    } else { // Add
      const newProduct: Product = { ...values, id: new Date().getTime().toString() };
      updatedProducts = [...products, newProduct];
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProducts),
      });

      if (!response.ok) throw new Error('Falha ao salvar produto.');
      
      setProducts(updatedProducts);
      const uniqueCategories = [...new Set(updatedProducts.map(p => p.category))];
      setCategories(uniqueCategories);

      toast({ title: 'Sucesso!', description: `Produto ${editingProduct ? 'atualizado' : 'adicionado'}.` });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum produto encontrado.
                    </TableCell>
                </TableRow>
            ) : (
              products.map(product => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="rounded-md object-cover" />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>R$ {product.price.toFixed(2).replace('.', ',')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenDialog(product)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Produto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Balde Mega" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Descreva o produto" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preço</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="29.90" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <FormControl>
                                        <Input list="categories-datalist" placeholder="Ex: Baldes" {...field} />
                                    </FormControl>
                                    <datalist id="categories-datalist">
                                        {categories.map(cat => <option key={cat} value={cat} />)}
                                    </datalist>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL da Imagem</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Produto
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    