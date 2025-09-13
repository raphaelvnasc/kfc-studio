
import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '@/actions/create-payment-action';
import { z } from 'zod';

const postSchema = z.object({
  transactionId: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = postSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'ID da transação é obrigatório.' }, { status: 400 });
    }
    
    const { transactionId } = parsed.data;
    const result = await checkPaymentStatus(transactionId);

    if (result.success) {
      return NextResponse.json({ status: result.status });
    } else {
      return NextResponse.json({ error: result.error || 'Erro ao verificar status.' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
