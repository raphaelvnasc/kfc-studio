
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, CookingPot, Bike, PartyPopper, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const statuses = [
  { id: 1, name: 'Pedido Recebido', icon: CheckCircle, duration: 2000 },
  { id: 2, name: 'Em Preparação', icon: CookingPot, duration: 5000 },
  { id: 3, name: 'Saiu para Entrega', icon: Bike, duration: 8000 },
  { id: 4, name: 'Pedido Entregue!', icon: PartyPopper, duration: 0 },
];

export default function TrackOrderPage() {
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

  useEffect(() => {
    // Dispara o pixel do Facebook ou outros webhooks aqui, pois esta página só é acessada após o pagamento.
    if (typeof window !== 'undefined' && (window as any).fbq) {
        console.log('Disparando evento de Purchase para o Facebook Pixel na página de rastreio.');
        // Substitua por valores dinâmicos se os tiver
        (window as any).fbq('track', 'Purchase', { value: 99.99, currency: 'BRL' });
    }
  }, []);

  useEffect(() => {
    if (currentStatusIndex < statuses.length - 1) {
      const currentStep = statuses[currentStatusIndex];
      const timer = setTimeout(() => {
        setCurrentStatusIndex(prevIndex => prevIndex + 1);
      }, currentStep.duration);

      return () => clearTimeout(timer);
    }
  }, [currentStatusIndex]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-black text-center p-4">
      <div className="bg-white dark:bg-gray-950 p-6 md:p-10 rounded-2xl shadow-lg max-w-lg w-full">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Seu pedido está a caminho!</h1>
            <p className="text-gray-600 dark:text-gray-400">Acompanhe em tempo real o status do seu frango crocante.</p>
        </div>

        <div className="relative flex flex-col items-start w-full px-4">
          {statuses.map((status, index) => {
            const isActive = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const isLast = index === statuses.length - 1;

            return (
              <div key={status.id} className="relative flex items-start w-full mb-8 last:mb-0">
                <div className="flex flex-col items-center mr-6">
                  <div 
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500 ${
                      isActive
                        ? 'bg-red-600 border-red-700 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {isCurrent && !isLast ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <status.icon className="w-6 h-6" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`absolute top-12 left-1/2 -translate-x-1/2 h-full w-0.5 transition-colors duration-500 ${
                        isActive ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      style={{ height: 'calc(100% - 0.5rem)' }}
                    />
                  )}
                </div>
                <div className="text-left mt-2">
                  <h3 
                    className={`text-lg font-bold transition-colors duration-500 ${
                      isActive ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {status.name}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
        
        <Separator className="my-8"/>

        <div className="space-y-4">
          {currentStatusIndex === statuses.length - 1 ? (
              <>
                <p className="text-green-600 font-semibold">Seu pedido foi entregue. Bom apetite!</p>
                <Link href="/" passHref>
                    <Button size="lg" className="w-full bg-red-600 hover:bg-red-700">
                        Pedir Novamente
                    </Button>
                </Link>
              </>
          ) : (
            <Link href="/" passHref>
                <Button size="lg" variant="outline" className="w-full">
                    Voltar para a loja
                </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

    