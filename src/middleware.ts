
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// O middleware não é mais necessário para essa lógica simples de autenticação,
// o AdminLayout.tsx agora cuida da proteção do lado do cliente.
// Isso evita problemas de loops de redirecionamento e é mais simples.

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // O matcher está vazio pois o middleware não faz mais nada.
  matcher: [],
};
