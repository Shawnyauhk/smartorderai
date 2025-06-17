
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
  item: z.string().describe('The name of the menu item. This should be a common, recognizable name, ideally matching what might appear on a menu.'),
  quantity: z.number().describe('The quantity of the item ordered, converted to an Arabic numeral.'),
  specialRequests: z.string().optional().describe('Any special requests for the item (e.g., "extra cheese", "no onions", "less sugar").'),
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
Strive to understand the customer's intent even if their phrasing isn't precise, uses abbreviations, Chinese numerals, or doesn't use exact menu item names.

The restaurant offers items in the following general categories (use these as context for understanding items):
- 小食 (e.g., 草莓葫蘆, 黑椒腸, 雞蛋仔 might be called '雞記' or '雞旦仔')
- 仙草/豆花芋圓 (e.g., 仙草大滿貫, 豆花一號)
- 香蕉餅/蛋餅 (e.g., 開心果香蕉煎餅, 台式蛋餅)
- 格仔餅 (e.g., 雪糕格仔餅, 原味格仔餅)
- 飲品 (e.g., 西瓜沙冰, 泰式奶茶, 檸檬茶 might be '凍檸茶' or '檸茶')
- 新式糖水 (e.g., 楊枝甘露, 多芒小丸子)
- 椰香西米露 (e.g., 芒果椰香西米露, 芋泥椰香西米露)
- 蒸點 (e.g., 魚蛋8粒, 腸粉4條, 燒賣)
- 雞蛋仔 (e.g., 朱古力雞蛋仔, 原味雞蛋仔)

When parsing the order:
1.  **Identify Menu Items**:
    *   Determine the specific food or drink items requested. Use common, recognizable names for items.
    *   Handle abbreviations, common nicknames, and slight misspellings. For example, if a user says "雞記" and the menu has "雞蛋仔", identify it as "雞蛋仔". "檸茶" should be identified as "檸檬茶".
    *   If the user mentions a variation (e.g., "large fries", "熱奶茶"), capture that as part of the item name if it seems distinct (e.g. "大薯條", "熱奶茶") or as a special request if appropriate (e.g. item: "奶茶", specialRequests: "熱"). Favor common menu item names.

2.  **Determine Quantities**:
    *   Convert all quantity mentions to Arabic numerals.
    *   Chinese numbers (e.g., "一", "二", "兩", "三", "四", "五", "六", "七", "八", "九", "十", "廿", "卅") should be converted. For example, "兩個漢堡" means quantity: 2, "三杯可樂" means quantity: 3.
    *   Common quantity words like "一份", "一個", "一杯", "一碗", "一客" usually imply a quantity of 1. "兩份" means quantity: 2.
    *   If a quantity is not explicitly stated for an item (e.g., "a burger", "可樂"), assume a quantity of 1.

3.  **Extract Special Requests**:
    *   Note any modifications or specific instructions for an item (e.g., "extra cheese", "no onions", "double portion of pickles", "少甜", "多冰", "走青").
    *   If a characteristic like "凍" (cold) or "熱" (hot) is mentioned and not part of a standard item name, list it as a special request.

4.  **Handle Ambiguity and Inference**:
    *   If an item is unclear, make a reasonable interpretation based on common restaurant orders, the provided categories, and context.
    *   If a user lists multiple items together, parse them individually. For example, "我要雞蛋仔同埋一杯凍檸茶" should result in two separate items.

5.  **Output Consistency**:
    *   Ensure the 'item' field in your output uses a common and recognizable name for the food/drink item. This helps the system match it to specific product IDs later.
    *   The 'quantity' field must always be an Arabic numeral.

Order Text: {{{orderText}}}

Your output MUST be a valid JSON object matching the specified schema.
Examples of how to interpret:
User says: "唔該，我想要一個雞記，要朱古力味，兩份魚蛋，同埋一杯凍檸茶，少甜。"
You might parse this into items like:
- item: "朱古力雞蛋仔", quantity: 1 (extracted "朱古力味" and combined with "雞記" to infer "朱古力雞蛋仔")
- item: "魚蛋", quantity: 2 (converted "兩份" to 2. Assuming default 8粒 per serving if not specified otherwise by restaurant data)
- item: "檸檬茶", quantity: 1, specialRequests: "凍, 少甜" (or item: "凍檸檬茶", quantity: 1, specialRequests: "少甜")

User says: "一份原味格仔餅，加底，同一杯熱奶茶，唔要糖。"
- item: "原味格仔餅", quantity: 1, specialRequests: "加底"
- item: "奶茶", quantity: 1, specialRequests: "熱, 不要糖" (or item: "熱奶茶", quantity: 1, specialRequests: "不要糖")

User says: "我要三碗豆花二號，唔該。"
- item: "豆花二號", quantity: 3

User says: "仙草大滿貫，廿底。" (Assuming '廿底' means 20 servings, though unusual, parse as given)
- item: "仙草大滿貫", quantity: 20

Focus on extracting the core item, its quantity, and any specific modifications.
The frontend will attempt to match these parsed item names to specific product IDs from the restaurant's menu data.
Prioritize identifying the base item correctly.
`,
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
