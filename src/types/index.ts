export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  // For AI hint for image search for placeholders
  "data-ai-hint"?: string; 
  options?: {
    name: string;
    choices: { name: string; priceAdjustment?: number }[];
  }[];
}

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  specialRequests?: string;
  // selectedOptions?: { [optionName: string]: string };
  imageUrl?: string;
  "data-ai-hint"?: string;
}

export interface Order {
  items: CartItem[];
  totalAmount: number;
  paymentMethod?: string;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
}

export interface ParsedAiOrderItem {
  item: string;
  quantity: number;
  specialRequests?: string;
}
