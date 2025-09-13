

import type { Product, CartItem } from '@/components/ProductCard';

export type CreditCardPayload = {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
};

export type PaymentPayload = {
    customer: {
        name: string;
        email: string;
        phone: string;
        document: {
          number: string;
          type: string;
        };
    };
    items: {
        title: string;
        unitPrice: number;
        quantity: number;
        tangible: boolean;
    }[];
    amount: number;
    paymentMethod: "pix" | "credit_card";
    card?: CreditCardPayload;
};

export type PaymentProviderConfig = {
    publicKey: string | null;
    secretKey: string | null;
}

export type Order = {
    id: string;
    createdAt: string; // ISO 8601 date string
    total: number; // in reais, not cents
    items: CartItem[];
    customer: {
        name: string;
        email: string;
    };
}
