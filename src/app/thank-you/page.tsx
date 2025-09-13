
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function ThankYouPage() {

    useEffect(() => {
        // Exemplo de como você poderia disparar um evento para o Facebook Pixel
        // Certifique-se de que o script do Pixel está carregado no seu layout ou nesta página.
        if (typeof window !== 'undefined' && (window as any).fbq) {
            console.log('Disparando evento de Purchase para o Facebook Pixel');
            // O valor e a moeda devem ser dinâmicos, vindos do estado ou de um parâmetro de URL
            (window as any).fbq('track', 'Purchase', { value: 99.99, currency: 'BRL' });
        }

        // Exemplo de chamada para um webhook como Utmify
        // fetch('https://webhook.utmify.com.br/...');

    }, []);


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Obrigado pela sua compra!</h1>
        <p className="text-gray-600 mb-8">
          Seu pedido foi confirmado e já está sendo preparado. Você receberá atualizações por e-mail.
        </p>
        <div className="space-y-4">
             <Link href="/" passHref>
                <Button size="lg" className="w-full bg-red-600 hover:bg-red-700">
                    Voltar para a loja
                </Button>
            </Link>
             <Link href="/track-order" passHref>
                <Button size="lg" variant="outline" className="w-full">
                    Acompanhar meu pedido
                </Button>
             </Link>
        </div>
      </div>
    </div>
  );
}
