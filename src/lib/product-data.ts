import type { Product } from '@/types';

export const mockProducts: Product[] = [
  { 
    id: '1', 
    name: 'Classic Burger', 
    price: 12.99, 
    category: 'Burgers', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'burger food',
    description: '多汁牛肉餅配生菜、番茄及秘製醬汁。' 
  },
  { 
    id: '2', 
    name: 'Cheese Burger', 
    price: 13.99, 
    category: 'Burgers', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'cheeseburger food',
    description: '經典漢堡配車打芝士。' 
  },
  { 
    id: '3', 
    name: 'Fries', 
    price: 4.50, 
    category: 'Sides', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'fries food',
    description: '香脆金黃炸薯條。' 
  },
  { 
    id: '4', 
    name: 'Coke', 
    price: 2.50, 
    category: 'Drinks', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'soda drink',
    description: '冰鎮可口可樂。' 
  },
  { 
    id: '5', 
    name: 'Pizza Margherita', 
    price: 15.00, 
    category: 'Pizza', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'pizza food',
    description: '經典薄餅配番茄、水牛芝士及羅勒。' 
  },
  { 
    id: '6', 
    name: 'Caesar Salad', 
    price: 10.50, 
    category: 'Salads', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'salad food',
    description: '新鮮羅馬生菜配凱撒醬、麵包粒及巴馬臣芝士。' 
  },
  {
    id: '7',
    name: 'Spaghetti Carbonara',
    price: 16.50,
    category: 'Pasta',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'pasta dish',
    description: '香滑卡邦尼意粉配煙肉、蛋黃及羊奶芝士。'
  },
  {
    id: '8',
    name: 'Chocolate Lava Cake',
    price: 8.00,
    category: 'Desserts',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'chocolate cake',
    description: '暖心朱古力熔岩蛋糕配雲呢拿雪糕。'
  },
  {
    id: '9',
    name: 'Iced Tea',
    price: 3.00,
    category: 'Drinks',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'iced tea',
    description: '清爽鮮泡冰茶。'
  }
];

export const findProductByName = (name: string): Product | undefined => {
  const searchTerm = name.toLowerCase();
  return mockProducts.find(p => p.name.toLowerCase() === searchTerm);
};
