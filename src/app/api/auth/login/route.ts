
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados de login inválidos.' }, { status: 400 });
    }

    const { username, password } = parsed.data;

    // AVISO: Autenticação insegura, apenas para prototipagem.
    // Em um ambiente de produção, use um sistema de hash de senhas e um banco de dados.
    if (username === 'admin' && password === 'mavylegras123456') {
      cookies().set('kfc-admin-session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 dia
        path: '/',
      });
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Usuário ou senha inválidos.' }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

    
