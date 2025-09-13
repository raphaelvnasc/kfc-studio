
import fs from 'fs/promises';
import path from 'path';
import type { PaymentProviderConfig } from './types';

// O caminho para o arquivo JSON, seguro dentro do diretório do servidor
const configPath = path.resolve(process.cwd(), 'payment-config.json');

const defaultConfig: PaymentProviderConfig = {
    publicKey: null,
    secretKey: null,
};

// Função para obter a configuração
export async function getPaymentConfig(): Promise<PaymentProviderConfig> {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data) as PaymentProviderConfig;
  } catch (error: any) {
    // Se o arquivo não existir, retorna a configuração padrão (e não cria o arquivo ainda)
    if (error.code === 'ENOENT') {
      await savePaymentConfig(defaultConfig); // Cria o arquivo com valores padrão
      return defaultConfig;
    }
    console.error('Erro ao ler o arquivo de configuração de pagamento:', error);
    throw new Error('Não foi possível ler a configuração de pagamento.');
  }
}

// Função para salvar a configuração
export async function savePaymentConfig(config: PaymentProviderConfig): Promise<void> {
  try {
    const data = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, data, 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar o arquivo de configuração de pagamento:', error);
    throw new Error('Não foi possível salvar a configuração de pagamento.');
  }
}
