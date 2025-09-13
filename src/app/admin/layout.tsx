
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar, SidebarProvider, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Home, Settings, ShoppingBag, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Se estivermos na página de login, não precisamos verificar a sessão,
    // apenas mostramos a página.
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    const verifySession = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        if (!response.ok) {
          router.replace('/admin/login');
        } else {
          setIsAuthenticated(true);
          // Redireciona de /admin para /admin/dashboard
          if (pathname === '/admin' || pathname === '/admin/') {
             router.replace('/admin/dashboard');
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        router.replace('/admin/login');
      }
    };
    verifySession();
  }, [router, pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  };
  
  // Se for a página de login, renderiza apenas o children sem o layout
  if (pathname === '/admin/login') {
      return <>{children}</>;
  }

  if (isLoading || (pathname === '/admin' || pathname === '/admin/')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // ou um loader, enquanto redireciona
  }

  return (
     <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarHeader>
            <h2 className="text-xl font-bold">Admin</h2>
          </SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/" passHref>
                <SidebarMenuButton>
                  <Home />
                  <span>Ver Loja</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="/admin/dashboard" passHref>
                    <SidebarMenuButton>
                        <LayoutDashboard />
                        <span>Dashboard</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="/admin/products" passHref>
                    <SidebarMenuButton>
                        <ShoppingBag />
                        <span>Produtos</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/settings" passHref>
                <SidebarMenuButton>
                  <Settings />
                  <span>Configurações</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
            </Button>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </SidebarProvider>
  );
}
