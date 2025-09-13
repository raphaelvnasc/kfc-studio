
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Order } from './types';

const ordersPath = path.resolve(process.cwd(), 'src/lib/orders.json');

async function ensureFileExists() {
  try {
    await fs.access(ordersPath);
  } catch (error) {
    // If the file doesn't exist, create it with an empty array
    await fs.writeFile(ordersPath, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function getOrders(): Promise<Order[]> {
  await ensureFileExists();
  try {
    const data = await fs.readFile(ordersPath, 'utf-8');
    return JSON.parse(data) as Order[];
  } catch (error) {
    console.error('Error reading orders file:', error);
    return [];
  }
}

export async function saveOrder(order: Omit<Order, 'createdAt'>): Promise<void> {
  try {
    const orders = await getOrders();
    const newOrder: Order = {
        ...order,
        id: order.id || new Date().getTime().toString(), // Ensure ID exists
        createdAt: new Date().toISOString(),
    };
    orders.unshift(newOrder); // Add new order to the beginning
    const data = JSON.stringify(orders, null, 2);
    await fs.writeFile(ordersPath, data, 'utf-8');
  } catch (error) {
    console.error('Error saving order:', error);
    throw new Error('Could not save order.');
  }
}
