
import { NextResponse } from 'next/server';
import { getPaymentConfig, savePaymentConfig } from '@/lib/payment-config';
import { z } from 'zod';

const postSchema = z.object({
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
});

export async function GET() {
  try {
    const config = await getPaymentConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = postSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }
    
    const currentConfig = await getPaymentConfig();

    const newConfig = {
        publicKey: parsed.data.publicKey || currentConfig.publicKey,
        secretKey: parsed.data.secretKey || currentConfig.secretKey,
    }

    await savePaymentConfig(newConfig);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
