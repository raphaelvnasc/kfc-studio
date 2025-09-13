
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Product } from '@/components/ProductCard';

const productsPath = path.resolve(process.cwd(), 'src/lib/products.json');

export async function getProducts(): Promise<Product[]> {
  try {
    const data = await fs.readFile(productsPath, 'utf-8');
    return JSON.parse(data) as Product[];
  } catch (error) {
    console.error('Error reading products file:', error);
    return [];
  }
}

export async function saveProducts(products: Product[]): Promise<void> {
  try {
    const data = JSON.stringify(products, null, 2);
    await fs.writeFile(productsPath, data, 'utf-8');
  } catch (error) {
    console.error('Error saving products file:', error);
    throw new Error('Could not save products.');
  }
}

// Ação para o servidor que será usada pela API
export async function getProductsAction() {
    return await getProducts();
}

// Ação para o servidor que será usada pela API
export async function saveProductsAction(products: Product[]) {
    await saveProducts(products);
    return { success: true };
}

    