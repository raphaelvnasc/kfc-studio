import type {Metadata} from 'next';
import { Inter } from 'next/font/google'
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KFC - Delivery de Frango Frito',
  description: 'O frango mais crocante e famoso do mundo, direto na sua casa. Peça agora pelo delivery oficial do KFC!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        <CartProvider>
          {children}
        </CartProvider>
        <Toaster />
      </body>
    </html>
  );
}
