
import type { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: '經典漢堡',
    price: 12.99,
    category: '漢堡',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'burger food',
    description: '多汁牛肉餅配生菜、番茄及秘製醬汁。'
  },
  {
    id: '2',
    name: '芝士漢堡',
    price: 13.99,
    category: '漢堡',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'cheeseburger food',
    description: '經典漢堡配車打芝士。'
  },
  {
    id: '3',
    name: '薯條',
    price: 4.50,
    category: '小食',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'fries food',
    description: '香脆金黃炸薯條。'
  },
  {
    id: '4',
    name: '可樂',
    price: 2.50,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'soda drink',
    description: '冰鎮可口可樂。'
  },
  {
    id: '5',
    name: '瑪格麗特薄餅',
    price: 15.00,
    category: '薄餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'pizza food',
    description: '經典薄餅配番茄、水牛芝士及羅勒。'
  },
  {
    id: '6',
    name: '凱撒沙律',
    price: 10.50,
    category: '沙律',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'salad food',
    description: '新鮮羅馬生菜配凱撒醬、麵包粒及巴馬臣芝士。'
  },
  {
    id: '7',
    name: '卡邦尼意粉',
    price: 16.50,
    category: '意粉',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'pasta dish',
    description: '香滑卡邦尼意粉配煙肉、蛋黃及羊奶芝士。'
  },
  {
    id: '8',
    name: '朱古力心太軟',
    price: 8.00,
    category: '甜品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'chocolate cake',
    description: '暖心朱古力熔岩蛋糕配雲呢拿雪糕。'
  },
  {
    id: '9',
    name: '凍檸檬茶',
    price: 3.00,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'iced tea',
    description: '清爽鮮泡冰鎮檸檬茶。'
  },
  {
    id: '10',
    name: '公司三文治',
    price: 35.00,
    category: '三文治',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'club sandwich',
    description: '經典三層三文治，包含煙肉、雞蛋、生菜及番茄。'
  }
];

export const findProductByName = (name: string): Product | undefined => {
  // Assumes the AI will return the exact product name as defined in mockProducts.
  // This is more reliable for Chinese names where case-insensitivity is not standard.
  return mockProducts.find(p => p.name === name);
};
