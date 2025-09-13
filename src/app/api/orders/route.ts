
import { NextResponse } from 'next/server';
import { getOrders, saveOrder } from '@/lib/orders';
import { z } from 'zod';
import type { Order } from '@/lib/types';
import { cookies } from 'next/headers';

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

const cartItemSchema = z.object({
  product: productSchema,
  quantity: z.number().min(1),
});

const orderSchema = z.object({
  id: z.string(),
  total: z.number(),
  items: z.array(cartItemSchema),
  customer: z.object({
      name: z.string(),
      email: z.string().email(),
  }),
});


function isUserAuthenticated() {
    const session = cookies().get('kfc-admin-session');
    return session?.value === 'true';
}

export async function GET() {
  if (!isUserAuthenticated()) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const orders = await getOrders();
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = orderSchema.safeParse(json);

    if (!parsed.success) {
      console.error('Validation error:', parsed.error.errors);
      return NextResponse.json({ error: 'Dados do pedido inválidos.', details: parsed.error.errors }, { status: 400 });
    }
    
    // Anyone can create an order, so no auth check here
    await saveOrder(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
