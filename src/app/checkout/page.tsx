
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCart } from '@/contexts/CartContext';
import { ChevronLeft, PlusCircle, Loader2, Copy, AlertTriangle, Clock, CreditCard, QrCode } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/components/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { createPayment } from '@/actions/create-payment-action';
import { PaymentPayload } from '@/lib/types';
import { cn } from '@/lib/utils';


const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Nome completo é obrigatório.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  phone: z.string().min(10, { message: 'Telefone é obrigatório.' }),
  document: z.string().min(11, { message: 'CPF é obrigatório.' }),
  zipCode: z.string().min(8, { message: 'CEP é obrigatório.' }),
  street: z.string().min(2, { message: 'Rua é obrigatória.' }),
  number: z.string().min(1, { message: 'Número é obrigatório.' }),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, { message: 'Bairro é obrigatório.' }),
  city: z.string().min(2, { message: 'Cidade é obrigatória.' }),
  state: z.string().min(2, { message: 'Estado é obrigatório.' }),
  // Card fields - optional because they depend on payment method
  cardHolderName: z.string().optional(),
  cardNumber: z.string().optional(),
  cardExpiryMonth: z.string().optional(),
  cardExpiryYear: z.string().optional(),
  cardCvv: z.string().optional(),
}).superRefine((data, ctx) => {
    // This is a way to conditionally validate card fields if payment method is credit_card
    // For now, we assume a state 'paymentMethod' will be available to check this.
    // In this implementation, we will perform the check inside the onSubmit handler.
});

type FormData = z.infer<typeof formSchema>;

const orderBumps: Product[] = [
    { id: '30', name: 'Molho Extra', description: 'Um delicioso molho para acompanhar', price: 1.00, imageUrl: 'https://picsum.photos/seed/kfc-sauce1/100/100', imageHint: 'sauce', category: 'Molhos' },
    { id: '25', name: 'Batata Média', description: 'Porção de batatas fritas', price: 9.90, imageUrl: 'https://picsum.photos/seed/kfc-side1/100/100', imageHint: 'french fries', category: 'Acompanhamentos' },
];

const PAYMENT_TIMEOUT_SECONDS = 120; // 2 minutos

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { cart, cartTotal, addToCart, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'error' | 'expired' | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeText, setQrCodeText] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(PAYMENT_TIMEOUT_SECONDS);
  
  const deliveryFee = 0;
  const finalTotal = cartTotal + deliveryFee;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      document: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      cardHolderName: '',
      cardNumber: '',
      cardExpiryMonth: '',
      cardExpiryYear: '',
      cardCvv: '',
    },
  });

  const saveOrder = async () => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: transactionId, 
            total: finalTotal, 
            items: cart,
            customer: {
                name: form.getValues('fullName'),
                email: form.getValues('email')
            }
        }),
      });
      if (!response.ok) {
          throw new Error('Falha ao salvar o pedido');
      }
    } catch (error) {
        console.error("Error saving order:", error);
        // Não mostrar erro para o usuário, apenas logar
    }
  }

  const handleSuccessfulPayment = async () => {
    await saveOrder();
    setPaymentStatus('paid');
    clearCart();
    // Atraso para o usuário ver a mensagem de sucesso antes do redirecionamento
    setTimeout(() => {
        router.push('/track-order');
    }, 1500); 
  };


   useEffect(() => {
    let paymentCheckInterval: NodeJS.Timeout | null = null;
    let countdownInterval: NodeJS.Timeout | null = null;
    
    if (transactionId && isModalOpen && paymentStatus === 'pending') {
      if (paymentMethod === 'pix') {
         // Inicia verificação de status para PIX
        paymentCheckInterval = setInterval(async () => {
            try {
            const response = await fetch('/api/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId }),
            });
            const result = await response.json();
            if (result.status === 'paid') {
                if (paymentCheckInterval) clearInterval(paymentCheckInterval);
                if (countdownInterval) clearInterval(countdownInterval);
                handleSuccessfulPayment();
            }
            } catch (error) {
                console.error('Error checking payment status:', error);
                setPaymentStatus('error');
                if (paymentCheckInterval) clearInterval(paymentCheckInterval);
                if (countdownInterval) clearInterval(countdownInterval);
            }
        }, 3000); // Verifica a cada 3 segundos

        // Inicia cronômetro de timeout para PIX
        setCountdown(PAYMENT_TIMEOUT_SECONDS);
        countdownInterval = setInterval(() => {
            setCountdown(prevCountdown => {
                if (prevCountdown <= 1) {
                    if (countdownInterval) clearInterval(countdownInterval);
                    if (paymentCheckInterval) clearInterval(paymentCheckInterval);
                    setPaymentStatus('expired');
                    return 0;
                }
                return prevCountdown - 1;
            });
        }, 1000);
      }
    }

    return () => {
      if (paymentCheckInterval) clearInterval(paymentCheckInterval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, isModalOpen, paymentStatus, paymentMethod]);


  const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const zipCode = e.target.value.replace(/\D/g, '');
    if (zipCode.length !== 8) {
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
      const data = await response.json();
      if (!data.erro) {
        form.setValue('street', data.logradouro);
        form.setValue('neighborhood', data.bairro);
        form.setValue('city', data.localidade);
        form.setValue('state', data.uf);
      } else {
         toast({
            variant: "destructive",
            title: "Erro ao buscar CEP",
            description: "Não foi possível encontrar o CEP informado.",
        })
      }
    } catch (error) {
       toast({
            variant: "destructive",
            title: "Erro de rede",
            description: "Não foi possível conectar à API de CEP.",
        })
    }
  };
  
  const handleAddOrderBump = (product: Product) => {
    addToCart(product, 1);
  }
  
  const copyToClipboard = () => {
    if (qrCodeText) {
        navigator.clipboard.writeText(qrCodeText);
        toast({
            title: "Copiado!",
            description: "O código PIX Copia e Cola foi copiado para sua área de transferência.",
        });
    }
  }

  async function onSubmit(values: FormData) {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Sacola vazia",
        description: "Adicione itens à sua sacola antes de finalizar o pedido.",
      });
      return;
    }

    if (paymentMethod === 'credit_card') {
      const cardValidation = z.object({
        cardHolderName: z.string().min(3, 'Nome no cartão é obrigatório.'),
        cardNumber: z.string().min(13, 'Número do cartão inválido.').max(19, 'Número do cartão inválido.'),
        cardExpiryMonth: z.string().min(1, 'Mês inválido.').max(2, 'Mês inválido.'),
        cardExpiryYear: z.string().min(2, 'Ano inválido.').max(4, 'Ano inválido.'),
        cardCvv: z.string().min(3, 'CVV inválido.').max(4, 'CVV inválido.'),
      });

      const validationResult = cardValidation.safeParse(values);
      if (!validationResult.success) {
        validationResult.error.errors.forEach((err) => {
          form.setError(err.path[0] as keyof FormData, { message: err.message });
        });
        toast({
            variant: "destructive",
            title: "Dados do cartão inválidos",
            description: "Por favor, verifique os dados do seu cartão de crédito.",
        });
        return;
      }
    }

    setIsSubmitting(true);

    const totalInCents = Math.round(finalTotal * 100);

    const payload: PaymentPayload = {
      amount: totalInCents,
      paymentMethod: paymentMethod,
      items: cart.map(item => ({
        title: item.product.name,
        unitPrice: Math.round(item.product.price * 100),
        quantity: item.quantity,
        tangible: true, // Assuming physical products
      })),
      customer: {
        name: values.fullName,
        email: values.email,
        phone: values.phone.replace(/\D/g, ''),
        document: {
            number: values.document.replace(/\D/g, ''),
            type: "cpf"
        }
      },
    };
    
    if (paymentMethod === 'credit_card' && values.cardNumber && values.cardExpiryMonth && values.cardExpiryYear && values.cardCvv && values.cardHolderName) {
        payload.card = {
            holderName: values.cardHolderName,
            number: values.cardNumber.replace(/\D/g, ''),
            expiryMonth: values.cardExpiryMonth,
            expiryYear: values.cardExpiryYear.length === 2 ? `20${values.cardExpiryYear}` : values.cardExpiryYear,
            cvv: values.cardCvv,
        };
    }

    try {
      const result = await createPayment(payload);

      if (result.success && result.transactionId) {
        setTransactionId(result.transactionId);
        setIsModalOpen(true);

        if (paymentMethod === 'pix' && result.qrCode && result.qrCodeText) {
            setQrCode(result.qrCode);
            setQrCodeText(result.qrCodeText);
            setPaymentStatus('pending'); // Starts polling
        } else if (paymentMethod === 'credit_card' && result.status) {
            if (result.status === 'paid') {
              handleSuccessfulPayment(); // Already paid
            } else {
              setPaymentStatus('error'); // Card declined or other error
            }
        } else {
             throw new Error(result.error || 'Resposta inválida do servidor de pagamento.');
        }

      } else {
        throw new Error(result.error || 'Ocorreu um erro desconhecido.');
      }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erro ao processar pagamento",
            description: error.message || "Não foi possível criar a cobrança. Tente novamente.",
        });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const buttonText = {
    pix: 'Confirmar e pagar com PIX',
    credit_card: 'Confirmar e pagar com Cartão'
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="p-4 flex items-center gap-4 border-b bg-white dark:bg-gray-950 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">Finalizar Pedido</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <section>
              <h2 className="text-lg font-semibold mb-4">Selecione o pagamento</h2>
              <div className="grid grid-cols-2 gap-4">
                  <Button type="button" variant={paymentMethod === 'pix' ? 'default' : 'outline'} className="h-14 text-lg" onClick={() => setPaymentMethod('pix')}>
                      <QrCode className="mr-2 h-6 w-6"/>
                      PIX
                  </Button>
                  <Button type="button" variant={paymentMethod === 'credit_card' ? 'default' : 'outline'} className="h-14 text-lg" onClick={() => setPaymentMethod('credit_card')}>
                      <CreditCard className="mr-2 h-6 w-6"/>
                      Cartão
                  </Button>
              </div>
            </section>

            {paymentMethod === 'credit_card' && (
                <section>
                    <h2 className="text-lg font-semibold mb-4">Dados do Cartão</h2>
                    <div className="space-y-4">
                         <FormField
                            control={form.control}
                            name="cardHolderName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nome no cartão</FormLabel>
                                <FormControl>
                                    <Input placeholder="Como aparece no cartão" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="cardNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Número do cartão</FormLabel>
                                <FormControl>
                                    <Input placeholder="0000 0000 0000 0000" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="cardExpiryMonth"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mês</FormLabel>
                                    <FormControl>
                                    <Input placeholder="MM" {...field} maxLength={2} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cardExpiryYear"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ano</FormLabel>
                                    <FormControl>
                                    <Input placeholder="AA ou AAAA" {...field} maxLength={4} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cardCvv"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CVV</FormLabel>
                                    <FormControl>
                                    <Input placeholder="123" {...field} maxLength={4} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </section>
            )}

            <section>
              <h2 className="text-lg font-semibold mb-4">Seus dados</h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-lg font-semibold mb-4">Endereço de entrega</h2>
              <div className="space-y-4">
                 <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} onBlur={handleZipCodeBlur} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rua</FormLabel>
                      <FormControl>
                        <Input placeholder="Sua rua" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                     <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="Nº" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input placeholder="Apto, bloco" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  <div className="grid grid-cols-2 gap-4">
                     <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Sua cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input placeholder="UF" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
              </div>
            </section>
            
            <Separator />

            <section>
              <h2 className="text-lg font-semibold mb-2">Que tal adicionar?</h2>
              <p className="text-sm text-gray-500 mb-4">Complete seu pedido com nossos extras!</p>
              <div className="space-y-3">
                {orderBumps.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-lg border">
                        <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="rounded-md object-cover" />
                        <div className="flex-grow">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-green-600 font-bold">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => handleAddOrderBump(item)}>
                            <PlusCircle />
                        </Button>
                    </div>
                ))}
              </div>
            </section>

             <Separator />

            <section>
                <h2 className="text-lg font-semibold mb-4">Resumo do pedido</h2>
                <div className="space-y-3 text-sm bg-white dark:bg-gray-900 p-4 rounded-lg border">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxa de entrega</span>
                      <span className="text-green-600 font-semibold">{deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            </section>
            
            <div className="pt-4">
                <Button type="submit" size="lg" className="w-full h-14 rounded-lg bg-red-600 hover:bg-red-700 text-lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    buttonText[paymentMethod]
                  )}
                </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>

    <AlertDialog open={isModalOpen} onOpenChange={(open) => {
        // Don't allow closing the modal manually if payment is pending for PIX
        if (paymentMethod === 'pix' && paymentStatus === 'pending' && open) return;
        setIsModalOpen(open);
    }}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="text-center text-2xl">
                    {paymentMethod === 'pix' ? 'Pague com PIX' : 'Status do Pagamento'}
                </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="flex flex-col items-center justify-center p-4 gap-4">
                
                {paymentMethod === 'pix' && paymentStatus === 'pending' && (
                <>
                    <AlertDialogDescription className="text-center">
                        Aponte a câmera do seu celular para o QR Code ou copie o código abaixo.
                    </AlertDialogDescription>
                    <p className="text-lg font-bold">Valor total: R$ {finalTotal.toFixed(2).replace('.', ',')}</p>
                    {qrCode && (
                        <Image
                            src={qrCode}
                            alt="QR Code PIX"
                            width={250}
                            height={250}
                        />
                    )}
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin"/>
                        <span>Aguardando pagamento...</span>
                        <span className="font-mono">({Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')})</span>
                    </div>
                    {qrCodeText && (
                        <div className="w-full">
                            <p className="text-xs text-gray-500 mb-1">PIX Copia e Cola:</p>
                            <div className="relative">
                                <Input 
                                    value={qrCodeText} 
                                    readOnly 
                                    className="pr-10 bg-gray-100"
                                />
                                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={copyToClipboard}>
                                    <Copy className="w-4 h-4"/>
                                </Button>
                            </div>
                        </div>
                    )}
                </>
                )}

                {paymentStatus === 'paid' && (
                     <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold">Pagamento Aprovado!</h3>
                        <p className="text-gray-600">Seu pedido foi confirmado. Redirecionando...</p>
                    </div>
                )}
                 {paymentStatus === 'error' && (
                     <div className="text-center space-y-4 text-red-600">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-10 h-10"/>
                        </div>
                        <h3 className="text-2xl font-bold">Falha no Pagamento</h3>
                        <p className="text-gray-600 dark:text-gray-400">Não foi possível confirmar seu pagamento. Por favor, feche este aviso e tente novamente.</p>
                         <Button onClick={() => setIsModalOpen(false)}>Fechar</Button>
                    </div>
                 )}
                 {paymentMethod === 'pix' && paymentStatus === 'expired' && (
                    <div className="text-center space-y-4 text-amber-600">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                            <Clock className="w-10 h-10"/>
                        </div>
                        <h3 className="text-2xl font-bold">Tempo Esgotado</h3>
                        <p className="text-gray-600 dark:text-gray-400">O tempo para pagamento expirou. Por favor, feche este aviso para gerar um novo pedido.</p>
                        <Button onClick={() => setIsModalOpen(false)}>Fechar</Button>
                    </div>
                 )}
            </div>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );

}
