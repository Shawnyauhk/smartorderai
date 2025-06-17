
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
  item: z.string().describe("Name of the item. If ambiguous (e.g., user says '大滿貫' or '3號' when multiple products match), this field must be the user's exact ambiguous term. Otherwise, it's the full product name."),
  quantity: z.number().describe('The quantity of the item ordered, as an Arabic numeral.'),
  specialRequests: z.string().optional().describe("Special requests for the item. This field MUST BE OMITTED ENTIRELY if there are no special requests. Do not include the key or any placeholder value if empty."),
  isAmbiguous: z.boolean().optional().describe("Set to true if the item is ambiguous and requires user clarification. If true, 'alternatives' must be populated."),
  alternatives: z.array(z.string()).optional().describe("If 'isAmbiguous' is true, this array must contain the full names of potential products the user might be referring to. Omit if not ambiguous."),
});
export type ParsedAiOrderItem = z.infer<typeof ParsedOrderItemSchema>;


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

The restaurant offers items in the following general categories (use these as context for understanding items and their full names):
- 小食 (e.g., 草莓葫蘆, 黑椒腸, 原味腸, 雞蛋仔 might be called '雞記' or '雞旦仔')
- 仙草/豆花芋圓 (e.g., 仙草大滿貫, 仙草一號 （仙草，地瓜圓，芋圓，蜜紅豆，芋泥）, 仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）, 仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）, 豆花一號, 豆花二號, 豆花大滿貫, 豆花三號, 豆花四號, 豆花五號)
- 香蕉餅/蛋餅 (e.g., 開心果香蕉煎餅, 台式蛋餅, 雪糕香蕉煎餅)
- 格仔餅 (e.g., 雪糕格仔餅, 原味格仔餅, 開心果格仔餅)
- 飲品 (e.g., 西瓜沙冰, 泰式奶茶, 港式奶茶, 檸檬茶 might be '凍檸茶' or '檸茶', 手打鴨屎香檸檬茶)
- 新式糖水 (e.g., 楊枝甘露, 多芒小丸子, 芋泥麻薯小丸子)
- 椰香西米露 (e.g., 芒果椰香西米露, 芋泥椰香西米露, 椰香西米露)
- 蒸點 (e.g., 魚蛋8粒, 腸粉4條, 魚肉燒賣7粒, 香菇豬肉燒賣7粒)
- 雞蛋仔 (e.g., 朱古力雞蛋仔, 原味雞蛋仔, 麻糬雞蛋仔, 咸蛋黃雞蛋仔)

When parsing the order:

0.  **ULTRA-CRITICAL RULE FOR \`specialRequests\` FIELD**: If there are NO special requests for an item, the \`specialRequests\` field in your JSON output for that item **MUST BE OMITTED ENTIRELY**. Do not include this key in the JSON for that item. Do not set it to \`null\`, an empty string, or ANY placeholder text or ANY explanatory text about this rule. Just OMIT the key entirely if no actual special requests exist. This is the absolute most important rule for this field and failure to comply will result in incorrect system behavior.

1.  **Identify Menu Items**:
    *   Determine the specific food or drink items requested. Use common, recognizable names for items, exactly as they would appear on a detailed menu. For example, if the menu has "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）", use this full name.
    *   Handle abbreviations, common nicknames (e.g., "雞記" for "雞蛋仔", "檸茶" for "檸檬茶"), and slight misspellings.
    *   If a user specifies a partial name with a number (e.g., '仙草2', '豆花1', or '仙草二號'), and a *unique* product in the menu context matches this (e.g., '仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）'), you **MUST** identify that specific product (quantity 1 unless specified otherwise, like "仙草二號三碗"). In this case, \`isAmbiguous\` should be \`false\` or omitted.
    *   If the user input is primarily a number that could refer to a numbered series of items (e.g., "三號", "2號", "五號"), and multiple distinct products in the menu context incorporate this number (e.g., menu has '仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）' and '豆花三號'), you **MUST** identify ALL such distinct products. Each identified product should be a separate entry in the \`orderItems\` array with its full name. For example, if the user says "三號", and both "仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）" and "豆花三號" are on the menu, your output should include two separate items: one for "仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）" (quantity 1) and one for "豆花三號" (quantity 1), unless quantities are otherwise specified. These items should NOT be marked as ambiguous; instead, list them as individual concrete items.

2.  **Determine Quantities**:
    *   Convert all quantity mentions to Arabic numerals.
    *   Chinese numbers (e.g., "一", "二", "兩", "三", "四", "五", "六", "七", "八", "九", "十", "廿", "卅") should be converted. For example, "兩個漢堡" means quantity: 2, "三杯可樂" means quantity: 3.
    *   Common quantity words like "一份", "一個", "一杯", "一碗", "一客" usually imply a quantity of 1. "兩份" means quantity: 2.
    *   If a quantity is not explicitly stated for an item (e.g., "a burger", "可樂"), assume a quantity of 1.

3.  **Extract Special Requests**:
    *   Note any modifications or specific instructions for an item (e.g., "extra cheese", "no onions", "double portion of pickles", "少甜", "多冰", "走青").
    *   If a characteristic like "凍" (cold) or "熱" (hot) is mentioned and not part of a standard item name, list it as a special request.
    *   REMEMBER RULE 0: If there are no special requests, the \`specialRequests\` field **MUST BE OMITTED**.

4.  **CRITICAL AMBIGUITY HANDLING (THE MOST IMPORTANT RULE OF ALL)**: Your ability to correctly identify and flag ambiguity is paramount to the system's usability. FAILURE TO FOLLOW THIS RULE IS A CRITICAL SYSTEM ERROR.
    *   If a user's term (e.g., "大滿貫") could refer to **multiple distinct products** present in the menu context (e.g., the menu has both "仙草大滿貫" AND "豆花大滿貫"), you **MUST** handle it as an ambiguous item. Do not guess or pick one. Outputting multiple "大滿貫" items for this case is INCORRECT. It must be ONE ambiguous item.
    *   **MANDATORY BEHAVIOR FOR "大滿貫" AMBIGUITY**: If the user says "我要大滿貫，一份。" AND the menu context includes "仙草大滿貫" AND "豆花大滿貫", your output for this specific item within the \`orderItems\` array **MUST BE EXACTLY** this JSON structure (this is the ONLY correct way for this specific ambiguous "大滿貫" case):
        \`\`\`json
        {
          "item": "大滿貫",
          "quantity": 1,
          "isAmbiguous": true,
          "alternatives": ["仙草大滿貫", "豆花大滿貫"]
        }
        \`\`\`
        There are NO exceptions to this. Any other output for this specific "大滿貫" ambiguous case is a SEVERE FAILURE.
    *   In general for ambiguous items:
        *   You **MUST** set the 'item' field to the ambiguous term itself as stated by the user (e.g., "大滿貫").
        *   You **MUST** set 'isAmbiguous' to \`true\`.
        *   You **MUST** populate the 'alternatives' array with the full names of ALL potential matching products.
        *   The quantity should be based on the user's request for the ambiguous term.
    *   If an item is clear and unambiguous (e.g., user says "仙草大滿貫" directly, or "漢堡" if there's only one type of burger), then \`isAmbiguous\` should be \`false\` or omitted, and \`alternatives\` should be empty or omitted.
    *   If a user lists multiple items together, parse them individually. For example, "我要雞蛋仔同埋一杯凍檸茶" should result in two separate items.

5.  **Output Consistency**:
    *   Unless an item is ambiguous (see rule 4), ensure the 'item' field in your output uses the **full and exact common name** for the food/drink item as suggested by the product categories and examples provided.
    *   The 'quantity' field must always be an Arabic numeral.

Order Text: {{{orderText}}}

Your output MUST be a valid JSON object matching the specified schema.
Examples of how to interpret (besides the mandatory "大滿貫" example above):
User says: "唔該，我想要一個雞記，要朱古力味，兩份魚蛋，同埋一杯凍檸茶，少甜。"
You might parse this into items like:
- item: "朱古力雞蛋仔", quantity: 1
- item: "魚蛋8粒", quantity: 2
- item: "檸檬茶", quantity: 1, specialRequests: "凍, 少甜"

User says: "一份原味格仔餅，加底，同一杯熱奶茶，唔要糖。"
- item: "原味格仔餅", quantity: 1, specialRequests: "加底"
- item: "奶茶", quantity: 1, specialRequests: "熱, 不要糖"

User says: "我要三碗豆花二號，唔該。"
- item: "豆花二號", quantity: 3

User says: "仙草2" (Assuming "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）" is a product and no other product is "X仙草2" or "仙草2Y")
- item: "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）", quantity: 1

Remember, for \`specialRequests\`, if there are none, the field **MUST BE OMITTED** (Rule 0).
For AMBIGUOUS items like "大滿貫" when multiple products match, you **MUST** follow the exact JSON structure provided in Rule 4.
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

    