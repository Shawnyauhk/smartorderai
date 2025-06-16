import type { Product } from '@/types';

export const mockProducts: Product[] = [
  { 
    id: '1', 
    name: 'Classic Burger', 
    price: 12.99, 
    category: 'Burgers', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'burger food',
    description: 'A juicy beef patty with lettuce, tomato, and our special sauce.' 
  },
  { 
    id: '2', 
    name: 'Cheese Burger', 
    price: 13.99, 
    category: 'Burgers', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'cheeseburger food',
    description: 'Classic burger with a slice of cheddar cheese.' 
  },
  { 
    id: '3', 
    name: 'Fries', 
    price: 4.50, 
    category: 'Sides', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'fries food',
    description: 'Crispy golden french fries.' 
  },
  { 
    id: '4', 
    name: 'Coke', 
    price: 2.50, 
    category: 'Drinks', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'soda drink',
    description: 'Chilled Coca-Cola.' 
  },
  { 
    id: '5', 
    name: 'Pizza Margherita', 
    price: 15.00, 
    category: 'Pizza', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'pizza food',
    description: 'Classic pizza with tomato, mozzarella, and basil.' 
  },
  { 
    id: '6', 
    name: 'Caesar Salad', 
    price: 10.50, 
    category: 'Salads', 
    imageUrl: 'https://placehold.co/300x200.png', 
    "data-ai-hint": 'salad food',
    description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan.' 
  },
  {
    id: '7',
    name: 'Spaghetti Carbonara',
    price: 16.50,
    category: 'Pasta',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'pasta dish',
    description: 'Creamy pasta with pancetta, egg yolk, and pecorino romano.'
  },
  {
    id: '8',
    name: 'Chocolate Lava Cake',
    price: 8.00,
    category: 'Desserts',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'chocolate cake',
    description: 'Warm chocolate cake with a gooey molten center, served with vanilla ice cream.'
  },
  {
    id: '9',
    name: 'Iced Tea',
    price: 3.00,
    category: 'Drinks',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'iced tea',
    description: 'Refreshing freshly brewed iced tea.'
  }
];

// Helper function to find a product by name (case-insensitive)
// This is a very basic search, could be improved with fuzzy matching
export const findProductByName = (name: string): Product | undefined => {
  const searchTerm = name.toLowerCase();
  return mockProducts.find(p => p.name.toLowerCase() === searchTerm);
};
