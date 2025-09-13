
import { NextResponse } from 'next/server';
import { getProducts, saveProducts } from '@/lib/products';
import { z } from 'zod';
import type { Product } from '@/components/ProductCard';

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  imageUrl: z.string().url(),
  imageHint: z.string().optional(),
  discount: z.string().optional(),
  category: z.string(),
  serves: z.string().optional(),
});

const productsSchema = z.array(productSchema);

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Simple auth check, could be improved with actual session management
  const session = request.headers.get('cookie')?.includes('kfc-admin-session=true');
  if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = productsSchema.safeParse(json);

    if (!parsed.success) {
      console.error('Validation error:', parsed.error.errors);
      return NextResponse.json({ error: 'Dados dos produtos inválidos.', details: parsed.error.errors }, { status: 400 });
    }
    
    await saveProducts(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

    