
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
  item: z.string().describe('The name of the menu item. If the user\'s request is ambiguous (e.g., "大滿貫" which could be "仙草大滿貫" or "豆花大滿貫"), this should be the ambiguous term itself. Otherwise, it should be the common, recognizable name, ideally matching what might appear on a menu, including specific numbered versions like "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）".'),
  quantity: z.number().describe('The quantity of the item ordered, converted to an Arabic numeral.'),
  specialRequests: z.string().optional().describe('Any special requests for the item (e.g., "extra cheese", "no onions", "less sugar"). If there are NO special requests, this field MUST be omitted or set to an empty string or null. DO NOT output "N/A (no special requests detected, should be empty or omitted.)", "None, should be empty or omitted.)", or the literal string "string", or "string, not applicable here, this should be omitted or null or empty string if no special requests, following the guide strictly, do not output string here. Should be omitted or null or empty string ONLY, and this is the most important rule to follow, same for other items in other examples, do not add explanation here or in other examples." If there are no special requests, this field must be empty or omitted from the output.'),
  isAmbiguous: z.boolean().optional().describe('Set to true if the user\'s input for this item was ambiguous and could refer to multiple distinct products. If true, the "alternatives" field should be populated.'),
  alternatives: z.array(z.string()).optional().describe('If isAmbiguous is true, this array should contain the full names of the potential products the user might be referring to.'),
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
It is ABSOLUTELY CRITICAL that you correctly identify ambiguous items and use the 'isAmbiguous' and 'alternatives' fields as described below. This is essential for the user to clarify their order and is a primary function of your role. FAILURE TO DO SO WILL RESULT IN A POOR USER EXPERIENCE.

The restaurant offers items in the following general categories (use these as context for understanding items and their full names):
- 小食 (e.g., 草莓葫蘆, 黑椒腸, 原味腸, 雞蛋仔 might be called '雞記' or '雞旦仔')
- 仙草/豆花芋圓 (e.g., 仙草大滿貫, 仙草一號 （仙草，地瓜圓，芋圓，蜜紅豆，芋泥）, 仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）, 豆花一號, 豆花二號, 豆花大滿貫, 豆花三號, 豆花四號, 豆花五號)
- 香蕉餅/蛋餅 (e.g., 開心果香蕉煎餅, 台式蛋餅, 雪糕香蕉煎餅)
- 格仔餅 (e.g., 雪糕格仔餅, 原味格仔餅, 開心果格仔餅)
- 飲品 (e.g., 西瓜沙冰, 泰式奶茶, 港式奶茶, 檸檬茶 might be '凍檸茶' or '檸茶', 手打鴨屎香檸檬茶)
- 新式糖水 (e.g., 楊枝甘露, 多芒小丸子, 芋泥麻薯小丸子)
- 椰香西米露 (e.g., 芒果椰香西米露, 芋泥椰香西米露, 椰香西米露)
- 蒸點 (e.g., 魚蛋8粒, 腸粉4條, 魚肉燒賣7粒, 香菇豬肉燒賣7粒)
- 雞蛋仔 (e.g., 朱古力雞蛋仔, 原味雞蛋仔, 麻糬雞蛋仔, 咸蛋黃雞蛋仔)

When parsing the order:
1.  **Identify Menu Items**:
    *   Determine the specific food or drink items requested. Use common, recognizable names for items, exactly as they would appear on a detailed menu. For example, if the menu has "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）", use this full name.
    *   Handle abbreviations, common nicknames (e.g., "雞記" for "雞蛋仔", "檸茶" for "檸檬茶"), and slight misspellings.
    *   **Crucial Rule for Numbered Products**: If a user says something like '仙草2', '豆花1', or '仙草二', first check if there is a specific product in the menu list (like '仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）' or '豆花一號'). If such a specific numbered product exists, you **MUST** assume the user is referring to *one unit* of that specific product. Do not interpret '仙草2' as '仙草' with quantity 2 if '仙草二號(...)' is an actual product. The quantity should be 1 unless explicitly stated otherwise for the full item name (e.g., "仙草二號三碗").
    *   If the user mentions a variation (e.g., "large fries", "熱奶茶"), capture that as part of the item name if it's a distinct menu item (e.g., "大薯條", "熱奶茶") or as a special request if appropriate (e.g., item: "奶茶", specialRequests: "熱"). Favor exact, common menu item names.

2.  **Determine Quantities**:
    *   Convert all quantity mentions to Arabic numerals.
    *   Chinese numbers (e.g., "一", "二", "兩", "三", "四", "五", "六", "七", "八", "九", "十", "廿", "卅") should be converted. For example, "兩個漢堡" means quantity: 2, "三杯可樂" means quantity: 3.
    *   Common quantity words like "一份", "一個", "一杯", "一碗", "一客" usually imply a quantity of 1. "兩份" means quantity: 2.
    *   If a quantity is not explicitly stated for an item (e.g., "a burger", "可樂", or an item inferred via the "Numbered Products" rule like "仙草2"), assume a quantity of 1.

3.  **Extract Special Requests**:
    *   Note any modifications or specific instructions for an item (e.g., "extra cheese", "no onions", "double portion of pickles", "少甜", "多冰", "走青").
    *   If a characteristic like "凍" (cold) or "熱" (hot) is mentioned and not part of a standard item name, list it as a special request.
    *   **ULTRA-CRITICAL RULE FOR \`specialRequests\` FIELD**: If there are no special requests for an item, the 'specialRequests' field in your output **MUST** be omitted entirely, or set to an empty string (\\"\\"), or set to \`null\`. You **MUST NOT** output placeholder strings like "N/A (no special requests detected, should be empty or omitted.)", "None, should be empty or omitted.)", the literal string "string", or the long explanation "string, not applicable here, this should be omitted or null or empty string if no special requests, following the guide strictly, do not output string here. Should be omitted or null or empty string ONLY, and this is the most important rule to follow, same for other items in other examples, do not add explanation here or in other examples.". This field **MUST BE EMPTY OR OMITTED** if there are no actual special requests. This is critical for correct display and system function.

4.  **CRITICAL AMBIGUITY HANDLING (THE MOST IMPORTANT RULE)**: Your ability to correctly identify and flag ambiguity is paramount to the system's usability.
    *   If a user's term (e.g., "大滿貫") could refer to **multiple distinct products** present in the menu context (e.g., the menu has both "仙草大滿貫" AND "豆花大滿貫"), you **MUST** handle it as an ambiguous item. Do not guess or pick one.
    *   In such a case:
        *   You **MUST** set the 'item' field to the ambiguous term itself (e.g., "大滿貫").
        *   You **MUST** set 'isAmbiguous' to \`true\`.
        *   You **MUST** populate the 'alternatives' array with the full names of ALL potential matching products (e.g., \`["仙草大滿貫", "豆花大滿貫"]\`).
        *   The quantity should be based on the user's request for the ambiguous term.
    *   **FAILURE TO DO THIS IS A CRITICAL ERROR**: If you do not correctly set 'isAmbiguous' to \`true\` and provide the 'alternatives' list for genuinely ambiguous terms (like "大滿貫" when both "仙草大滿貫" and "豆花大滿貫" are on the menu), the user will not be able to clarify their choice, and the order will be incorrect. This is a primary function; do not fail here.
    *   If an item is clear and unambiguous (e.g., user says "仙草大滿貫" directly, or "漢堡" if there's only one type of burger), then \`isAmbiguous\` should be \`false\` or omitted, and \`alternatives\` should be empty or omitted.
    *   If a user lists multiple items together, parse them individually. For example, "我要雞蛋仔同埋一杯凍檸茶" should result in two separate items.

5.  **Output Consistency**:
    *   Unless an item is ambiguous (see rule 4), ensure the 'item' field in your output uses the **full and exact common name** for the food/drink item as suggested by the product categories and examples provided. This is critical for the system to match it to specific product IDs later.
    *   The 'quantity' field must always be an Arabic numeral.

Order Text: {{{orderText}}}

Your output MUST be a valid JSON object matching the specified schema.
Examples of how to interpret:
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

User says: "仙草2" (Assuming "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）" is a product)
- item: "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）", quantity: 1

User says: "仙草大滿貫，廿底。" (Assuming '廿底' means 20 servings. Also assuming "仙草大滿貫" is a unique product and not ambiguous in this specific context if, for instance, "豆花大滿貫" was not on the menu)
- item: "仙草大滿貫", quantity: 20

User says: "我要大滿貫，一份。"
(Context: Menu includes "仙草大滿貫" and "豆花大滿貫")
You **MUST** parse this as:
\`\`\`json
{ 
  "orderItems": [
    { 
      "item": "大滿貫", 
      "quantity": 1, 
      "isAmbiguous": true, 
      "alternatives": ["仙草大滿貫", "豆花大滿貫"] 
    }
  ]
}
\`\`\`
THIS IS THE ONLY CORRECT WAY TO PARSE "大滿貫" WHEN IT IS AMBIGUOUS. DO NOT DEVIATE. DO NOT GUESS. YOU MUST PROVIDE \`isAmbiguous: true\` AND THE \`alternatives\` ARRAY.

Focus on extracting the core item (its full name, or the ambiguous term), its quantity, and any specific modifications.
If not ambiguous, the frontend will attempt to match these parsed item names to specific product IDs from the restaurant's menu data.
Prioritize identifying the base item's full name correctly according to the menu context provided, unless ambiguity is detected as per rule 4.
Ensure that for items identified as ambiguous, the output STRICTLY follows the schema: 'item' is the ambiguous term, 'isAmbiguous' is true, and 'alternatives' lists the full names.
Remember, for \`specialRequests\`, if there are none, the field MUST be omitted or \`null\` or an empty string (\\"\\"). DO NOT invent placeholders.
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

