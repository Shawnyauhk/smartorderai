
import type { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: '草莓葫蘆',
    price: 13.00,
    category: '小食',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'candied fruit',
    description: '美味的草莓糖葫蘆。',
    order: 0
  },
  {
    id: '2',
    name: '青提葫蘆',
    price: 12.00,
    category: '小食',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'candied fruit',
    description: '美味的青提糖葫蘆。',
    order: 1
  },
  {
    id: '3',
    name: '黑椒腸',
    price: 13.00,
    category: '小食',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sausage snack',
    description: '香烤黑椒腸。',
    order: 2
  },
  {
    id: '4',
    name: '原味腸',
    price: 12.00,
    category: '小食',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sausage snack',
    description: '香烤原味腸。',
    order: 3
  },
  {
    id: '5',
    name: '豆花大滿貫',
    price: 49.00,
    category: '豆花系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'tofu pudding',
    description: '配料豐富的豆花大滿貫。',
    order: 0 // Order within "豆花系列"
  },
  {
    id: '10', // Assuming original ID for 豆花一號
    name: '豆花一號', // Full name: 豆花一號（豆花，地瓜圓，芋圓，蜜紅豆，芋泥）
    price: 38.00,
    category: '豆花系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'dessert bowl',
    description: '豆花，地瓜圓，芋圓，蜜紅豆，芋泥。',
    order: 1
  },
  {
    id: '9', // Assuming original ID for 豆花二號
    name: '豆花二號', // Full name: 豆花二號（豆花，地瓜圓，芋圓，黑糖粉條，珍珠）
    price: 36.00,
    category: '豆花系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'dessert bowl',
    description: '豆花，地瓜圓，芋圓，黑糖粉條，珍珠。',
    order: 2
  },
  {
    id: '8', // Assuming original ID for 豆花三號
    name: '豆花三號', // Full name: 豆花三號（豆花，地瓜圓，芋圓，珍珠，椰果）
    price: 36.00,
    category: '豆花系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'dessert bowl',
    description: '豆花，地瓜圓，芋圓，珍珠，椰果。',
    order: 3
  },
  {
    id: '7', // Assuming original ID for 豆花四號
    name: '豆花四號', // Full name: 豆花四號（豆花，地瓜圓，芋圓，小丸子，蜜紅豆）
    price: 36.00,
    category: '豆花系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'dessert bowl',
    description: '豆花，地瓜圓，芋圓，小丸子，蜜紅豆。',
    order: 4
  },
  {
    id: '6', // Assuming original ID for 豆花五號
    name: '豆花五號', // Full name: 豆花五號（豆花，地瓜圓，芋圓，紫米，椰果）
    price: 36.00,
    category: '豆花系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'dessert bowl',
    description: '豆花，地瓜圓，芋圓，紫米，椰果。',
    order: 5
  },
  {
    id: '11',
    name: '仙草大滿貫',
    price: 49.00,
    category: '仙草系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'grass jelly',
    description: '配料豐富的仙草大滿貫。',
    order: 0 // Order within "仙草系列"
  },
  {
    id: '16',
    name: '仙草一號 （仙草，地瓜圓，芋圓，蜜紅豆，芋泥）',
    price: 38.00,
    category: '仙草系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'grass jelly',
    description: '仙草，地瓜圓，芋圓，蜜紅豆，芋泥。',
    order: 1
  },
  {
    id: '15',
    name: '仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）',
    price: 36.00,
    category: '仙草系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'grass jelly',
    description: '仙草，地瓜圓，芋圓，黑糖粉條，珍珠。',
    order: 2
  },
  {
    id: '14',
    name: '仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）',
    price: 36.00,
    category: '仙草系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'grass jelly',
    description: '仙草，地瓜圓，芋圓，珍珠，椰果。',
    order: 3
  },
  {
    id: '13',
    name: '仙草四號（仙草，地瓜圓，芋圓，小丸子，蜜紅豆）',
    price: 36.00,
    category: '仙草系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'grass jelly',
    description: '仙草，地瓜圓，芋圓，小丸子，蜜紅豆。',
    order: 4
  },
  {
    id: '12',
    name: '仙草五號（仙草，地瓜圓，芋圓，紫米，椰果）',
    price: 36.00,
    category: '仙草系列',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'grass jelly',
    description: '仙草，地瓜圓，芋圓，紫米，椰果。',
    order: 5
  },
  {
    id: '17',
    name: '開心果香蕉煎餅',
    price: 42.00,
    category: '香蕉餅/蛋餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'banana pancake',
    description: '香甜開心果配搭香蕉煎餅。',
    order: 0
  },
  {
    id: '18',
    name: 'Oreo粒朱古力醬香蕉煎餅',
    price: 36.00,
    category: '香蕉餅/蛋餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'banana pancake',
    description: 'Oreo碎、朱古力醬及香蕉煎餅。',
    order: 1
  },
  {
    id: '19',
    name: '芝士肉鬆香蕉煎餅',
    price: 38.00,
    category: '香蕉餅/蛋餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'banana pancake',
    description: '鹹香芝士肉鬆配搭香蕉煎餅。',
    order: 2
  },
  {
    id: '20',
    name: '阿華田脆脆香蕉煎餅',
    price: 36.00,
    category: '香蕉餅/蛋餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'banana pancake',
    description: '阿華田脆脆配搭香蕉煎餅。',
    order: 3
  },
  {
    id: '21',
    name: '花生粒醬香蕉煎餅',
    price: 35.00,
    category: '香蕉餅/蛋餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'banana pancake',
    description: '香濃花生醬及花生粒配搭香蕉煎餅。',
    order: 4
  },
  {
    id: '22',
    name: '雪糕香蕉煎餅',
    price: 36.00,
    category: '香蕉餅/蛋餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'banana pancake',
    description: '冰涼雪糕配搭香蕉煎餅。',
    order: 5
  },
  {
    id: '23',
    name: '美祿朱古力香蕉煎餅',
    price: 35.00,
    category: '香蕉餅/蛋餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'banana pancake',
    description: '美祿朱古力配搭香蕉煎餅。',
    order: 6
  },
  {
    id: '24',
    name: '榛子醬香蕉煎餅',
    price: 35.00,
    category: '香蕉餅/蛋餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'banana pancake',
    description: '香甜榛子醬配搭香蕉煎餅。',
    order: 7
  },
  {
    id: '25',
    name: '煉奶醬香蕉煎餅',
    price: 31.00,
    category: '香蕉餅/蛋餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'banana pancake',
    description: '經典煉奶醬配搭香蕉煎餅。',
    order: 8
  },
  {
    id: '26',
    name: '台式蛋餅',
    price: 24.00,
    category: '香蕉餅/蛋餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg pancake',
    description: '美味台式蛋餅。',
    order: 9
  },
  {
    id: '27',
    name: '雪糕格仔餅',
    price: 38.00,
    category: '格仔餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'waffle dessert',
    description: '冰涼雪糕配搭格仔餅。',
    order: 0
  },
  {
    id: '28',
    name: '開心果格仔餅',
    price: 42.00,
    category: '格仔餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'waffle dessert',
    description: '香甜開心果配搭格仔餅。',
    order: 1
  },
  {
    id: '29',
    name: '芋泥肉鬆格仔餅',
    price: 36.00,
    category: '格仔餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'waffle dessert',
    description: '香滑芋泥配搭肉鬆格仔餅。',
    order: 2
  },
  {
    id: '30',
    name: '芝士肉鬆格仔餅',
    price: 36.00,
    category: '格仔餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'waffle dessert',
    description: '鹹香芝士肉鬆配搭格仔餅。',
    order: 3
  },
  {
    id: '31',
    name: '香蕉朱古力格仔餅',
    price: 36.00,
    category: '格仔餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'waffle dessert',
    description: '香蕉朱古力配搭格仔餅。',
    order: 4
  },
  {
    id: '32',
    name: '金莎醬格仔餅',
    price: 26.00,
    category: '格仔餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'waffle dessert',
    description: '香濃金莎醬配搭格仔餅。',
    order: 5
  },
  {
    id: '33',
    name: '榛子朱古力醬格仔餅',
    price: 26.00,
    category: '格仔餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'waffle dessert',
    description: '香甜榛子朱古力醬配搭格仔餅。',
    order: 6
  },
  {
    id: '34',
    name: '牛油咖央格仔餅',
    price: 32.00,
    category: '格仔餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'waffle dessert',
    description: '經典牛油咖央配搭格仔餅。',
    order: 7
  },
  {
    id: '35',
    name: '原味格仔餅',
    price: 26.00,
    category: '格仔餅',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'waffle plain',
    description: '經典原味格仔餅。',
    order: 8
  },
  {
    id: '36',
    name: '西瓜沙冰',
    price: 32.00,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'watermelon smoothie',
    description: '清涼解渴的西瓜沙冰。',
    order: 0
  },
  {
    id: '37',
    name: '芋泥珍珠鲜奶',
    price: 28.00,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'taro milk',
    description: '香滑芋泥珍珠鮮奶。',
    order: 1
  },
  {
    id: '38',
    name: '碧根果酸奶昔',
    price: 36.00,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'yogurt smoothie',
    description: '健康美味的碧根果酸奶昔。',
    order: 2
  },
  {
    id: '39',
    name: '酸奶昔',
    price: 32.00,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'yogurt smoothie',
    description: '健康美味的酸奶昔。',
    order: 3
  },
  {
    id: '40',
    name: '開心果鮮奶冰',
    price: 42.00,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'pistachio milk',
    description: '香濃開心果鮮奶冰。',
    order: 4
  },
  {
    id: '41',
    name: '手打苦瓜鴨屎香檸檬茶',
    price: 34.00,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'lemon tea',
    description: '特色手打苦瓜鴨屎香檸檬茶。',
    order: 5
  },
  {
    id: '42',
    name: '手打鴨屎香檸檬茶',
    price: 30.00,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'lemon tea',
    description: '特色手打鴨屎香檸檬茶。',
    order: 6
  },
  {
    id: '43',
    name: '泰式奶茶',
    price: 16.00,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'thai milk tea',
    description: '正宗泰式奶茶。',
    order: 7
  },
  {
    id: '44',
    name: '港式奶茶',
    price: 16.00,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'hk milk tea',
    description: '經典港式奶茶。',
    order: 8
  },
  {
    id: '45',
    name: '芋泥紫米椰奶',
    price: 32.00,
    category: '飲品',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'taro coconut milk',
    description: '香滑芋泥紫米椰奶。',
    order: 9
  },
  {
    id: '46',
    name: '麻薯開心果糊',
    price: 45.00,
    category: '新式糖水',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'dessert soup',
    description: '創新麻薯開心果糊。',
    order: 0
  },
  {
    id: '47',
    name: '黃小桂',
    price: 46.00,
    category: '新式糖水',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'chinese dessert',
    description: '特色糖水黃小桂。',
    order: 1
  },
  {
    id: '48',
    name: '鮮果班斕河粉',
    price: 46.00,
    category: '新式糖水',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'fruit dessert',
    description: '鮮甜水果班斕河粉。',
    order: 2
  },
  {
    id: '49',
    name: '芋泥麻薯小丸子',
    price: 46.00,
    category: '新式糖水',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'taro mochi',
    description: '香糯芋泥麻薯小丸子。',
    order: 3
  },
  {
    id: '50',
    name: '多芒小丸子河粉',
    price: 46.00,
    category: '新式糖水',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'mango dessert',
    description: '芒果控必點的多芒小丸子河粉。',
    order: 4
  },
  {
    id: '51',
    name: '雪頂多芒小丸子',
    price: 48.00,
    category: '新式糖水',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'mango dessert',
    description: '冰涼雪頂多芒小丸子。',
    order: 5
  },
  {
    id: '52',
    name: '多芒小丸子紫米',
    price: 46.00,
    category: '新式糖水',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'mango dessert',
    description: '多芒小丸子配搭養生紫米。',
    order: 6
  },
  {
    id: '53',
    name: '多芒小丸子',
    price: 44.00,
    category: '新式糖水',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'mango dessert',
    description: '經典多芒小丸子。',
    order: 7
  },
  {
    id: '54',
    name: '楊枝甘露',
    price: 46.00,
    category: '新式糖水',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'mango pomelo sago',
    description: '港式經典甜品楊枝甘露。',
    order: 8
  },
  {
    id: '55',
    name: '紫米西米露',
    price: 35.00,
    category: '椰香西米露',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sago dessert',
    description: '養生紫米椰香西米露。',
    order: 0
  },
  {
    id: '56',
    name: '雪燕桃膠西米',
    price: 46.00,
    category: '椰香西米露',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sago dessert',
    description: '滋潤雪燕桃膠椰香西米露。',
    order: 1
  },
  {
    id: '57',
    name: '芋泥椰香西米露',
    price: 35.00,
    category: '椰香西米露',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sago dessert',
    description: '香滑芋泥椰香西米露。',
    order: 2
  },
  {
    id: '58',
    name: '芋圓椰香西米露',
    price: 38.00,
    category: '椰香西米露',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sago dessert',
    description: 'Q彈芋圓椰香西米露。',
    order: 3
  },
  {
    id: '59',
    name: '雲尼拿雪糕椰香西米露',
    price: 35.00,
    category: '椰香西米露',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sago dessert',
    description: '雲尼拿雪糕配搭椰香西米露。',
    order: 4
  },
  {
    id: '60',
    name: '紅豆椰香西米露',
    price: 35.00,
    category: '椰香西米露',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sago dessert',
    description: '經典紅豆椰香西米露。',
    order: 5
  },
  {
    id: '61',
    name: '香蕉椰香西米露',
    price: 35.00,
    category: '椰香西米露',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sago dessert',
    description: '香甜香蕉椰香西米露。',
    order: 6
  },
  {
    id: '62',
    name: '桃膠椰香西米露',
    price: 38.00,
    category: '椰香西米露',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sago dessert',
    description: '滋潤桃膠椰香西米露。',
    order: 7
  },
  {
    id: '63',
    name: '西瓜椰香西米露',
    price: 35.00,
    category: '椰香西米露',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sago dessert',
    description: '清爽西瓜椰香西米露。',
    order: 8
  },
  {
    id: '64',
    name: '芒果椰香西米露',
    price: 40.00,
    category: '椰香西米露',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sago dessert',
    description: '鮮甜芒果椰香西米露。',
    order: 9
  },
  {
    id: '65',
    name: '椰香西米露',
    price: 29.00,
    category: '椰香西米露',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'sago plain',
    description: '經典原味椰香西米露。',
    order: 10
  },
  {
    id: '66',
    name: '魚蛋8粒',
    price: 12.00,
    category: '蒸點',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'fish ball',
    description: '彈牙魚蛋8粒。',
    order: 0
  },
  {
    id: '67',
    name: 'XO醬炒腸粉',
    price: 42.00,
    category: '蒸點',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'rice roll',
    description: '惹味XO醬炒腸粉。',
    order: 1
  },
  {
    id: '68',
    name: '魚肉燒賣7粒',
    price: 12.00,
    category: '蒸點',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'siu mai',
    description: '經典魚肉燒賣7粒。',
    order: 2
  },
  {
    id: '69',
    name: '撈面',
    price: 16.00,
    category: '蒸點',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'noodles dry',
    description: '簡單美味撈面。',
    order: 3
  },
  {
    id: '70',
    name: '撈麵套餐',
    price: 29.00,
    category: '蒸點',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'noodle set',
    description: '超值撈麵套餐。',
    order: 4
  },
  {
    id: '71',
    name: '腸粉套餐',
    price: 24.00,
    category: '蒸點',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'rice roll set',
    description: '超值腸粉套餐。',
    order: 5
  },
  {
    id: '72',
    name: '香菇豬肉燒賣7粒',
    price: 15.00,
    category: '蒸點',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'pork siu mai',
    description: '香菇豬肉燒賣7粒。',
    order: 6
  },
  {
    id: '73',
    name: '山竹牛肉',
    price: 15.00,
    category: '蒸點',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'beef ball',
    description: '經典山竹牛肉。',
    order: 7
  },
  {
    id: '74',
    name: '腸粉4條',
    price: 14.00,
    category: '蒸點',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'rice roll',
    description: '滑溜腸粉4條。',
    order: 8
  },
  {
    id: '75',
    name: '朱古力雞蛋仔',
    price: 28.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg waffle',
    description: '香濃朱古力雞蛋仔。',
    order: 0
  },
  {
    id: '76',
    name: '煉奶花生醬雞蛋仔',
    price: 28.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg waffle',
    description: '經典煉奶花生醬雞蛋仔。',
    order: 1
  },
  {
    id: '77',
    name: '粟米紫菜雞蛋仔',
    price: 36.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg waffle',
    description: '香甜粟米配搭紫菜雞蛋仔。',
    order: 2
  },
  {
    id: '78',
    name: '粟米肉鬆雞蛋仔',
    price: 36.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg waffle',
    description: '香甜粟米配搭肉鬆雞蛋仔。',
    order: 3
  },
  {
    id: '79',
    name: '粟米芝士雞蛋仔',
    price: 36.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg waffle',
    description: '香甜粟米配搭芝士雞蛋仔。',
    order: 4
  },
  {
    id: '80',
    name: '雪糕雞蛋仔',
    price: 32.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg waffle ice cream',
    description: '冰涼雪糕配搭雞蛋仔。',
    order: 5
  },
  {
    id: '81',
    name: '芝士肉鬆雞蛋仔',
    price: 36.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg waffle',
    description: '鹹香芝士肉鬆雞蛋仔。',
    order: 6
  },
  {
    id: '82',
    name: '紫菜肉鬆雞蛋仔',
    price: 36.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg waffle',
    description: '鹹香紫菜肉鬆雞蛋仔。',
    order: 7
  },
  {
    id: '83',
    name: '牛油咖央雞蛋仔',
    price: 28.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg waffle',
    description: '經典牛油咖央雞蛋仔。',
    order: 8
  },
  {
    id: '84',
    name: '芋泥肉鬆雞蛋仔',
    price: 36.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg waffle',
    description: '香滑芋泥配搭肉鬆雞蛋仔。',
    order: 9
  },
  {
    id: '85',
    name: '爆多芫茜雞蛋仔',
    price: 26.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg waffle',
    description: '芫茜控最愛！爆多芫茜雞蛋仔。',
    order: 10
  },
  {
    id: '86',
    name: '葡撻雞蛋仔',
    price: 38.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'egg tart waffle',
    description: '香濃葡撻雞蛋仔。',
    order: 11
  },
  {
    id: '87',
    name: '雙重芝士雞蛋仔',
    price: 32.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'cheese waffle',
    description: '雙重芝士，雙重享受。',
    order: 12
  },
  {
    id: '88',
    name: '芝士葡撻雞蛋仔',
    price: 42.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'cheese tart waffle',
    description: '香濃芝士葡撻雞蛋仔。',
    order: 13
  },
  {
    id: '89',
    name: '咸蛋黃雞蛋仔',
    price: 28.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'salted egg waffle',
    description: '鹹香咸蛋黃雞蛋仔。',
    order: 14
  },
  {
    id: '90',
    name: '麻糬雞蛋仔',
    price: 30.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'mochi waffle',
    description: 'Q彈麻糬雞蛋仔。',
    order: 15
  },
  {
    id: '91',
    name: '原味雞蛋仔',
    price: 20.00,
    category: '雞蛋仔',
    imageUrl: 'https://placehold.co/300x200.png',
    "data-ai-hint": 'plain waffle',
    description: '經典原味雞蛋仔。',
    order: 16
  }
];

export const findProductByName = (name: string): Product | undefined => {
  return mockProducts.find(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
};

    
