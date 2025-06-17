
'use server';

/**
 * @fileOverview Parses voice orders into structured data.
 *
 * - parseOrder - A function that parses a voice order and extracts relevant information.
 * - ParseOrderInput - The input type for the parseOrder function.
 * - ParseOrderOutput - The return type for the parseOrder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseOrderInputSchema = z.object({
  orderText: z.string().describe('The order text from voice input.'),
});
export type ParseOrderInput = z.infer<typeof ParseOrderInputSchema>;

const ParsedOrderItemSchema = z.object({
  item: z.string().describe('The name of the menu item.'),
  quantity: z.number().describe('The quantity of the item ordered.'),
  specialRequests: z.string().optional().describe('Any special requests for the item.'),
});

const ParseOrderOutputSchema = z.object({
  orderItems: z.array(ParsedOrderItemSchema).describe('The list of parsed order items.'),
});
export type ParseOrderOutput = z.infer<typeof ParseOrderOutputSchema>;

export async function parseOrder(input: ParseOrderInput): Promise<ParseOrderOutput> {
  return parseOrderFlow(input);
}

const parseOrderPrompt = ai.definePrompt({
  name: 'parseOrderPrompt',
  input: {schema: ParseOrderInputSchema},
  output: {schema: ParseOrderOutputSchema},
  prompt: `You are an expert AI assistant for "SmartOrder AI", specializing in parsing customer voice and text orders for a restaurant with a diverse menu.
Your primary goal is to accurately convert natural language order requests into a structured list of items, quantities, and special requests.
Strive to understand the customer's intent even if their phrasing isn't precise or doesn't use exact menu item names.

The restaurant offers items in the following general categories:
- 小食 (e.g., 草莓葫蘆, 黑椒腸)
- 仙草/豆花芋圓 (e.g., 仙草大滿貫, 豆花一號)
- 香蕉餅/蛋餅 (e.g., 開心果香蕉煎餅, 台式蛋餅)
- 格仔餅 (e.g., 雪糕格仔餅, 原味格仔餅)
- 飲品 (e.g., 西瓜沙冰, 泰式奶茶)
- 新式糖水 (e.g., 楊枝甘露, 多芒小丸子)
- 椰香西米露 (e.g., 芒果椰香西米露, 芋泥椰香西米露)
- 蒸點 (e.g., 魚蛋8粒, 腸粉4條)
- 雞蛋仔 (e.g., 朱古力雞蛋仔, 原味雞蛋仔)

When parsing the order:
1.  **Identify Menu Items**: Determine the specific food or drink items requested. Use common names for items. If the user mentions a variation (e.g., "large fries"), try to capture that if it seems distinct, otherwise use the base item name.
2.  **Determine Quantities**: If a quantity is not explicitly stated (e.g., "a burger"), assume a quantity of 1. For "two cokes", the quantity is 2.
3.  **Extract Special Requests**: Note any modifications or specific instructions for an item (e.g., "extra cheese", "no onions", "double portion of pickles").
4.  **Handle Ambiguity**: If an item is unclear, make a reasonable interpretation based on common restaurant orders or the categories provided.
5.  **Output Consistency**: Ensure the 'item' field in your output uses a common and recognizable name for the food/drink item, ideally matching what might appear on a menu. For example, if the user says "I'd like a cola", output "可樂" or a common brand name.

Order Text: {{{orderText}}}

Your output MUST be a valid JSON object matching the specified schema.
Example of how to interpret:
User says: "I want a beef burger with no pickles, two large fries, and a coke."
You might parse this into items like:
- item: "牛肉漢堡", quantity: 1, specialRequests: "不要酸黃瓜"
- item: "大薯條", quantity: 2
- item: "可樂", quantity: 1
(Note: The exact item names should be common terms. The frontend will attempt to match these to specific product IDs.)`,
});

const parseOrderFlow = ai.defineFlow(
  {
    name: 'parseOrderFlow',
    inputSchema: ParseOrderInputSchema,
    outputSchema: ParseOrderOutputSchema,
  },
  async input => {
    const {output} = await parseOrderPrompt(input);
    return output!;
  }
);
