
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, User, AlertCircle } from 'lucide-react';
import { Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const POLLING_INTERVAL = 5000; // 5 segundos

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Não autorizado. Faça login novamente.');
            }
          throw new Error('Falha ao carregar os dados do dashboard.');
        }
        const data: Order[] = await response.json();
        setOrders(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders(); // Fetch inicial
    const intervalId = setInterval(fetchOrders, POLLING_INTERVAL); // Inicia o polling

    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todaysOrders = orders.filter(order => new Date(order.createdAt) >= today);

    const totalRevenue = todaysOrders.reduce((acc, order) => acc + order.total, 0);
    const totalSales = todaysOrders.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalRevenue,
      totalSales,
      averageTicket,
    };
  }, [orders]);

  const chartData = useMemo(() => {
    const now = new Date();
    const hours = Array.from({ length: 24 }, (_, i) => {
        const date = new Date(now);
        date.setHours(now.getHours() - i, 0, 0, 0);
        return date;
    }).reverse();

    const data = hours.map(hourStart => {
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourStart.getHours() + 1);

        const hourlyOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= hourStart && orderDate < hourEnd;
        });

        const total = hourlyOrders.reduce((acc, order) => acc + order.total, 0);

        return {
            name: `${hourStart.getHours().toString().padStart(2, '0')}:00`,
            Faturamento: total,
        };
    });

    return data;
  }, [orders]);
  
  if (error) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro no Dashboard</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento (Hoje)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2).replace('.', ',')}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas (Hoje)</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">+{stats.totalSales}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio (Hoje)</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">R$ {stats.averageTicket.toFixed(2).replace('.', ',')}</div>
            </CardContent>
            </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral do Faturamento (Últimas 24h)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             {isLoading ? (
                 <Skeleton className="h-[350px]" />
             ) : (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                    <Tooltip 
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)"
                        }}
                        formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, 'Faturamento']}
                    />
                    <Bar dataKey="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             )}
          </CardContent>
        </Card>
        {/* Futuro card de Pedidos Recentes */}
      </div>
    </div>
  );
}
