
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
  item: z.string().describe('The name of the menu item. If the user\'s request is ambiguous (e.g., "大滿貫" which could be "仙草大滿貫" or "豆花大滿貫"; or "3號" which could be "仙草三號" or "豆花三號"), this field should be the ambiguous term itself as stated by the user (e.g., "大滿貫", "3號"). Otherwise, it should be the common, recognizable name, ideally matching what might appear on a menu, including specific numbered versions like "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）".'),
  quantity: z.number().describe('The quantity of the item ordered, converted to an Arabic numeral.'),
  specialRequests: z.string().optional().describe('Any special requests for the item (e.g., "extra cheese", "no onions", "less sugar"). If there are NO special requests for an item, this field SHOULD BE OMITTED from the output. Avoid placeholders or explanatory text in this field like "None", "N/A", or any descriptive sentences explaining this rule (e.g., DO NOT output "string, not applicable here, this should be omitted or null or empty string if no special requests..."). Just OMIT the key entirely if no special requests exist.'),
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

0.  **ULTRA-CRITICAL RULE FOR \`specialRequests\` FIELD**: If there are NO special requests for an item, the \`specialRequests\` field in your JSON output for that item **MUST be omitted entirely**. Do not include it with \`null\`, an empty string, or ANY placeholder text like "None", "N/A", "string", or any descriptive sentences explaining this rule (e.g., DO NOT output "string, not applicable here, this should be omitted or null or empty string if no special requests..."). Just OMIT the key entirely if no special requests exist. This is the absolute most important rule for this field and failure to comply will result in incorrect system behavior.

1.  **Identify Menu Items**:
    *   Determine the specific food or drink items requested. Use common, recognizable names for items, exactly as they would appear on a detailed menu. For example, if the menu has "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）", use this full name.
    *   Handle abbreviations, common nicknames (e.g., "雞記" for "雞蛋仔", "檸茶" for "檸檬茶"), and slight misspellings.
    *   **Crucial Rule for Numbered Products**:
        *   If a user specifies a partial name with a number (e.g., '仙草2', '豆花1', or '仙草二號'), and a *unique* product in the menu context matches this specific numbered product (e.g., '仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）' or '豆花一號'), you **MUST** identify that specific product. The quantity should be 1 unless explicitly stated otherwise (e.g., "仙草二號三碗"). In this case, \`isAmbiguous\` should be \`false\` or omitted.
        *   However, if the user *only* provides a number (e.g., "3號", "三號", "No. 3", "1", "一") and this number could correspond to multiple distinct products (e.g., "仙草三號(...)" AND "豆花三號" both exist for "3號"; or "仙草一號(...)" and "豆花一號(...)" both exist for "1號"), this is an AMBIGUOUS case. It **MUST** be handled according to Rule 4 (CRITICAL AMBIGUITY HANDLING). The \`item\` field should be the user's stated number (e.g., "3號", "1號"), \`isAmbiguous\` set to \`true\`, and \`alternatives\` populated with the full names of all matching distinct products.
    *   If the user mentions a variation (e.g., "large fries", "熱奶茶"), capture that as part of the item name if it's a distinct menu item (e.g., "大薯條", "熱奶茶") or as a special request if appropriate (e.g., item: "奶茶", specialRequests: "熱"). Favor exact, common menu item names.

2.  **Determine Quantities**:
    *   Convert all quantity mentions to Arabic numerals.
    *   Chinese numbers (e.g., "一", "二", "兩", "三", "四", "五", "六", "七", "八", "九", "十", "廿", "卅") should be converted. For example, "兩個漢堡" means quantity: 2, "三杯可樂" means quantity: 3.
    *   Common quantity words like "一份", "一個", "一杯", "一碗", "一客" usually imply a quantity of 1. "兩份" means quantity: 2.
    *   If a quantity is not explicitly stated for an item (e.g., "a burger", "可樂"), assume a quantity of 1. This also applies if an item is inferred via the "Numbered Products" rule and it's identified as a single ambiguous term (e.g., "3號" implying one instance of an ambiguous "3號" product).

3.  **Extract Special Requests**:
    *   Note any modifications or specific instructions for an item (e.g., "extra cheese", "no onions", "double portion of pickles", "少甜", "多冰", "走青").
    *   If a characteristic like "凍" (cold) or "熱" (hot) is mentioned and not part of a standard item name, list it as a special request.
    *   REMEMBER RULE 0: If there are no special requests, the \`specialRequests\` field **MUST BE OMITTED**.

4.  **CRITICAL AMBIGUITY HANDLING (THE MOST IMPORTANT RULE OF ALL)**: Your ability to correctly identify and flag ambiguity is paramount to the system's usability. FAILURE TO FOLLOW THIS RULE IS A CRITICAL SYSTEM ERROR.
    *   If a user's term (e.g., "大滿貫", or "3號" as described in Rule 1) could refer to **multiple distinct products** present in the menu context, you **MUST** handle it as an ambiguous item. Do not guess or pick one.
    *   **MANDATORY BEHAVIOR FOR "大滿貫" AMBIGUITY**: If the user says "我要大滿貫，一份。" AND the menu context includes "仙草大滿貫" AND "豆花大滿貫", your output for this specific item within the \`orderItems\` array **MUST BE EXACTLY** this JSON structure:
        \`\`\`json
        {
          "item": "大滿貫",
          "quantity": 1,
          "isAmbiguous": true,
          "alternatives": ["仙草大滿貫", "豆花大滿貫"]
        }
        \`\`\`
        There are NO exceptions to this. Any other output for this specific "大滿貫" ambiguous case is a SEVERE FAILURE.
    *   **MANDATORY BEHAVIOR FOR "X號" (NUMBER-BASED) AMBIGUITY**: If the user says "3號" (or "三號"), and the menu has both "仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）" AND "豆花三號", your output for this item **MUST BE EXACTLY** this JSON structure:
        \`\`\`json
        {
          "item": "3號",
          "quantity": 1,
          "isAmbiguous": true,
          "alternatives": ["仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）", "豆花三號"]
        }
        \`\`\`
        The \`item\` field must be the user's stated term (e.g., "3號"). There are NO exceptions to this.
    *   In general for ambiguous items:
        *   You **MUST** set the 'item' field to the ambiguous term itself as stated by the user (e.g., "大滿貫", "3號").
        *   You **MUST** set 'isAmbiguous' to \`true\`.
        *   You **MUST** populate the 'alternatives' array with the full names of ALL potential matching products.
        *   The quantity should be based on the user's request for the ambiguous term.
    *   If an item is clear and unambiguous (e.g., user says "仙草大滿貫" directly, or "漢堡" if there's only one type of burger, or "仙草3號" if only "仙草三號(...)" matches), then \`isAmbiguous\` should be \`false\` or omitted, and \`alternatives\` should be empty or omitted.
    *   If a user lists multiple items together, parse them individually. For example, "我要雞蛋仔同埋一杯凍檸茶" should result in two separate items.

5.  **Output Consistency**:
    *   Unless an item is ambiguous (see rule 4), ensure the 'item' field in your output uses the **full and exact common name** for the food/drink item as suggested by the product categories and examples provided.
    *   The 'quantity' field must always be an Arabic numeral.

Order Text: {{{orderText}}}

Your output MUST be a valid JSON object matching the specified schema.
Examples of how to interpret (besides the mandatory "大滿貫" and "X號" examples above):
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
For AMBIGUOUS items like "大滿貫" or "3號" when multiple products match, you **MUST** follow the exact JSON structure provided in Rule 4.
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

