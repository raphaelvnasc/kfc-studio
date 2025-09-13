
'use server';

import type { PaymentPayload } from '@/lib/types';
import { getPaymentConfig } from '@/lib/payment-config';

export async function createPayment(
  payload: PaymentPayload
): Promise<{ success: boolean; qrCode?: string; qrCodeText?: string, transactionId?: string, error?: string, status?: string }> {
  try {
    const config = await getPaymentConfig();
    const { publicKey, secretKey } = config;

    if (!publicKey || !secretKey) {
      throw new Error('Chaves da Pagloop não configuradas. Acesse /admin/settings para configurar.');
    }
    
    // Aparar espaços em branco para garantir que as chaves estão limpas
    const cleanPublicKey = publicKey.trim();
    const cleanSecretKey = secretKey.trim();

    const auth = Buffer.from(`${cleanPublicKey}:${cleanSecretKey}`).toString('base64');
    
    const response = await fetch('https://api.pagloop.com/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro da API Pagloop:', { status: response.status, body: data });
      const errorMessage = data?.message || data?.error || 'Erro ao criar a transação. Verifique as credenciais e os dados enviados.';
       if (response.status === 401) {
         throw new Error('Usuário não autorizado. Verifique se a Public Key e a Secret Key estão corretas no painel de administração.');
       }
      throw new Error(errorMessage);
    }
    
    if (payload.paymentMethod === 'pix') {
      const qrCodeText = data?.pix?.qrcode ?? data?.data?.pix?.qrcode;
      const transactionId = data?.id ?? data?.data?.id;

      if (!qrCodeText) {
          throw new Error('QR Code PIX não recebido da Pagloop.');
      }
      if (!transactionId) {
          throw new Error('ID da transação não recebido da Pagloop.');
      }
      
      const qrCodeImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrCodeText)}`;
      return { success: true, qrCode: qrCodeImageUrl, qrCodeText, transactionId };

    } else if (payload.paymentMethod === 'credit_card') {
      const status = data?.status ?? data?.data?.status;
      const transactionId = data?.id ?? data?.data?.id;
       if (!transactionId) {
          throw new Error('ID da transação não recebido da Pagloop.');
      }
      return { success: true, status, transactionId };
    }

    return { success: false, error: 'Método de pagamento não suportado na resposta.' };

  } catch (error: any) {
    console.error('Erro na Server Action createPayment:', error);
    return { success: false, error: error.message };
  }
}

export async function checkPaymentStatus(
  transactionId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const config = await getPaymentConfig();
    const { publicKey, secretKey } = config;

    if (!publicKey || !secretKey) {
      throw new Error('Chaves da Pagloop não configuradas.');
    }

    const cleanPublicKey = publicKey.trim();
    const cleanSecretKey = secretKey.trim();

    const auth = Buffer.from(`${cleanPublicKey}:${cleanSecretKey}`).toString('base64');

    const response = await fetch(`https://api.pagloop.com/v1/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
       console.error('Erro ao verificar status na API Pagloop:', { status: response.status, body: data });
       const errorMessage = data?.message || 'Erro ao verificar o status da transação.';
       throw new Error(errorMessage);
    }

    // Corrigido: O status pode estar em data.status ou data.data.status
    const status = data?.status ?? data?.data?.status;

    if (!status) {
      console.error('Resposta de status inesperada da Pagloop:', data);
      return { success: false, error: 'Resposta de status inesperada.' };
    }

    return { success: true, status };
  } catch (error: any) {
    console.error('Erro na Server Action checkPaymentStatus:', error);
    return { success: false, error: error.message };
  }
}
