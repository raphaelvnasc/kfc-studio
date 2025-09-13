
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  publicKey: z.string().min(1, { message: 'Public Key é obrigatória.' }),
  secretKey: z.string().min(1, { message: 'Secret Key é obrigatória.' }),
});

type FormData = z.infer<typeof formSchema>;

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publicKey: '',
      secretKey: '',
    },
  });

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.publicKey) {
            form.setValue('publicKey', data.publicKey);
          }
          if (data.secretKey) {
            form.setValue('secretKey', data.secretKey);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar configurações',
          description: 'Não foi possível buscar as configurações atuais.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchConfig();
  }, [form, toast]);

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar as chaves.');
      }

      toast({
        title: 'Configurações salvas!',
        description: 'Suas chaves de API foram atualizadas com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-black">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Configurações de Pagamento</CardTitle>
          <CardDescription>
            Gerencie suas integrações de pagamento. Cole aqui suas chaves da Pagloop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="publicKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagloop Public Key</FormLabel>
                    <FormControl>
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                           <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                           <span>Carregando...</span>
                        </div>
                      ) : (
                        <Input
                          placeholder="pk_..."
                          {...field}
                          disabled={isSubmitting}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secretKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagloop Secret Key</FormLabel>
                    <FormControl>
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                           <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                           <span>Carregando...</span>
                        </div>
                      ) : (
                        <Input
                          type="password"
                          placeholder="sk_..."
                          {...field}
                          disabled={isSubmitting}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Chaves'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
