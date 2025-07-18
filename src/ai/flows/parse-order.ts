
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
  inputLanguage: z.string().optional().describe('The BCP 47 language code of the order text, e.g., "yue-Hant-HK", "cmn-Hans-CN", "en-US", or "mixed". Helps the AI better interpret the text.'),
});
export type ParseOrderInput = z.infer<typeof ParseOrderInputSchema>;

const ParsedOrderItemSchema = z.object({
  item: z.string().describe("Name of the item. If ambiguous, this is the user's term."),
  quantity: z.number().describe('The quantity of the item ordered, as an Arabic numeral.'),
  specialRequests: z.string().optional().describe("Special requests for the item. Omit this field entirely if there are no special requests."),
  isAmbiguous: z.boolean().optional().describe("True if item requires clarification."),
  alternatives: z.array(z.string()).optional().describe("Potential products if ambiguous."),
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

{{#if inputLanguage}}
The order text has been identified as primarily in {{inputLanguage}}. Please take this into account, especially for language-specific nicknames, grammar, or common phrases.
If the language is \`mixed\` or \`unknown\`, be flexible in your interpretation.
{{/if}}

The restaurant offers items in the following general categories (use these as context for understanding items and their full names):
- 小食 (e.g., 草莓葫蘆, 黑椒腸, 原味腸, 雞蛋仔 might be called '雞記' or '雞旦仔' in Cantonese)
- 仙草系列 (e.g., 仙草大滿貫, 仙草一號 （仙草，地瓜圓，芋圓，蜜紅豆，芋泥）, 仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）, 仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）, 仙草四號（仙草，地瓜圓，芋圓，小丸子，蜜紅豆）, 仙草五號（仙草，地瓜圓，芋圓，紫米，椰果）)
- 豆花系列 (e.g., 豆花大滿貫, 豆花一號 （豆花，地瓜圓，芋圓，蜜紅豆，芋泥）, 豆花二號（豆花，地瓜圓，芋圓，黑糖粉條，珍珠）, 豆花三號（豆花，地瓜圓，芋圓，珍珠，椰果）, 豆花四號（豆花，地瓜圓，芋圓，小丸子，蜜紅豆）, 豆花五號（豆花，地瓜圓，芋圓，紫米，椰果）)
- 香蕉餅/蛋餅 (e.g., 開心果香蕉煎餅, 台式蛋餅, 雪糕香蕉煎餅)
- 格仔餅 (e.g., 雪糕格仔餅, 原味格仔餅, 開心果格仔餅)
- 飲品 (e.g., 西瓜沙冰, 泰式奶茶, 港式奶茶, 檸檬茶 might be '凍檸茶' or '檸茶' in Cantonese or '柠檬茶' in Mandarin, 手打鴨屎香檸檬茶, 開心果鮮奶冰)
- 新式糖水 (e.g., 楊枝甘露, 多芒小丸子, 芋泥麻薯小丸子)
- 椰香西米露 (e.g., 芒果椰香西米露, 芋泥椰香西米露, 椰香西米露)
- 蒸點 (e.g., 魚蛋8粒, 腸粉4條, 魚肉燒賣7粒, 香菇豬肉燒賣7粒)
- 雞蛋仔 (e.g., 朱古力雞蛋仔, 原味雞蛋仔, 麻糬雞蛋仔, 咸蛋黃雞蛋仔, 葡撻雞蛋仔)

When parsing the order:

0.  **ULTRA-CRITICAL RULE FOR \`specialRequests\` FIELD**: If there are NO special requests for an item, the \`specialRequests\` field in your JSON output for that item **MUST BE OMITTED ENTIRELY**. Do NOT include this key. Do NOT set it to \`null\`, an empty string, or ANY placeholder/explanatory text. Just OMIT THE KEY if no actual special requests exist. This is the absolute most important rule for this field and failure to comply will result in incorrect system behavior.

1.  **Identify Menu Items**:
    *   Determine the specific food or drink items requested. Use common, recognizable names for items, exactly as they would appear on a detailed menu. For example, if the menu has "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）", use this full name.
    *   Handle abbreviations, common nicknames (e.g., "雞記" for "雞蛋仔", "檸茶" for "檸檬茶"), and slight misspellings, considering the identified inputLanguage if provided.
    *   **IMPORTANT FOR "大滿貫" VARIANTS AND SIMILAR PARTIAL MATCHES**: If a user says a term like "豆花滿貫" (missing '大') and the menu explicitly contains "豆花大滿貫", you **MUST** interpret this as a request for "豆花大滿貫" and set \`isAmbiguous\` to \`false\` (or omit it). The same applies if the user says "仙草滿貫" and "仙草大滿貫" is on the menu; interpret it as "仙草大滿貫" without ambiguity. Apply similar logic to other close matches where user input strongly implies a specific full menu item if that item is unique. If "朱古力雞記" is said and "朱古力雞蛋仔" is the only matching chocolate egg waffle, interpret it as "朱古力雞蛋仔".
    *   **CRITICAL FOR SLIGHT VARIATIONS LIKE "沙冰" vs "鮮奶冰"**: If a user requests an item like '開心果沙冰', and the menu explicitly contains '開心果鮮奶冰', you **MUST** recognize this as a request for '開心果鮮奶冰', especially if '開心果鮮奶冰' is the primary pistachio-based cold beverage on the menu. Be flexible with descriptive terms like '沙冰', '鮮奶冰', '冰', '特飲' when the core components (e.g., '開心果') match a unique and relevant menu item. The goal is to map the user's intent to the closest relevant single menu item if the core meaning is clear.
    *   If a user specifies a partial name with a number (e.g., '仙草2', '豆花1', '仙草二號', or even a slight variation like '先做3號' which should be interpreted as likely '仙草三號' if '仙草三號(...full name...)' exists), and a *unique* product in the menu context matches this (e.g., '仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）' for '仙草2', or '仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）' for '先做3號'), you **MUST** identify that specific product. **Crucially, if a quantity is specified with this item (e.g., '兩個仙草三號', '仙草三號兩個', or '我要兩個先做3號'), you MUST apply that specified quantity (e.g., 2 in these examples) to the identified product.** If no quantity is specified with the item, then assume quantity 1. For such direct matches or clear intentions where a unique product is identified, \`isAmbiguous\` should be \`false\` or omitted.
    *   **EXPANDING GENERIC TERMS INTO CONCRETE ITEMS**:
        *   If the user input is a generic term like a number ("三號", "2號", "五號") or a specific keyword ("大滿貫") that could refer to multiple distinct products, you **MUST** identify ALL such distinct products. Each identified product should be a separate entry in the \`orderItems\` array with its full name.
        *   Example 1 (Numbered item): If the user says "三號", and the menu has both "仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）" and "豆花三號", your output must include two separate items: one for "仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）" (quantity 1) and one for "豆花三號" (quantity 1), unless a quantity is specified for "三號".
        *   Example 2 (Keyword item): If the user says "大滿貫" (or "一份大滿貫"), and the menu has both "仙草大滿貫" and "豆花大滿貫", your output must include two separate items: one for "仙草大滿貫" (quantity 1) and one for "豆花大滿貫" (quantity 1).
        *   For these cases, you **MUST NOT** mark the items as ambiguous, and you **MUST NOT** create an additional ambiguous item for the original term itself (e.g., for "三號" or "大滿貫"). The output should only contain the identified, expanded concrete product items.

2.  **Determine Quantities**:
    *   Convert all quantity mentions to Arabic numerals.
    *   Chinese numbers (e.g., "一", "二", "兩", "三", "四", "五", "六", "七", "八", "九", "十", "廿", "卅") should be converted. For example, "兩個漢堡" means quantity: 2, "三杯可樂" means quantity: 3.
    *   Common quantity words and Chinese measure words like "一份" (yī fèn), "一個" (yī ge), "一杯" (yī bēi), "一碗" (yī wǎn), "一客" (yī kè), "个" (ge) usually imply a quantity of 1 (unless a different number precedes them, e.g., "兩個" means 2). "兩份" means quantity: 2.
    *   If a quantity is not explicitly stated for an item (e.g., "a burger", "可樂"), assume a quantity of 1.

3.  **Extract Special Requests**:
    *   Note any modifications or specific instructions for an item (e.g., "extra cheese", "no onions", "double portion of pickles", "少甜", "多冰", "走青").
    *   If a characteristic like "凍" (cold) or "熱" (hot) is mentioned and not part of a standard item name, list it as a special request.
    *   **Clarification on Quantities**: Phrases primarily indicating quantity (e.g., "一份", "兩個", "a cup of", "三碗") or simple Chinese measure words (like "个", "杯", "碗", "份") are used to determine the \`quantity\` field. Such phrases and measure words are NOT themselves special requests and MUST NOT be placed in the \`specialRequests\` field. If the only specific instruction related to an item is its quantity, and there are no other modifications or preferences, the \`specialRequests\` field MUST be omitted according to Rule 0.
    *   REMEMBER RULE 0: If there are no special requests, the \`specialRequests\` field **MUST BE OMITTED**.

4.  **CRITICAL AMBIGUITY HANDLING (FOR USER CLARIFICATION)**: Your ability to correctly identify and flag ambiguity for user clarification is paramount. This rule applies when a user's term is too generic and expanding it into all possibilities would be impractical (e.g., asking for "雞蛋仔" when there are 10+ types).
    *   **MANDATORY BEHAVIOR FOR GENERIC BASE NAMES (e.g., "雞蛋仔", "奶茶")**: If a user's term is a generic base name (like "雞蛋仔" or its common nickname "雞記") and the menu context contains multiple *specific* items that include this base name (e.g., "原味雞蛋仔", "朱古力雞蛋仔", "麻糬雞蛋仔"), then:
        *   You **MUST** produce exactly one item in the \`orderItems\` array for the generic term.
        *   This item **MUST** have \`item: "雞蛋仔"\` (using the most common form of the generic term if a nickname was used, e.g., "雞蛋仔" for "雞記").
        *   This item **MUST** have \`isAmbiguous: true\`.
        *   This item **MUST** have \`alternatives\` populated with the full names of ALL specific matching products (e.g., \`["原味雞蛋仔", "朱古力雞蛋仔", "麻糬雞蛋仔", "咸蛋黃雞蛋仔", "葡撻雞蛋仔"]\` if all those exist in the menu context).
        *   The \`quantity\` should be determined from the user's request for the generic term (e.g., "一份雞蛋仔" means quantity 1).
        *   The \`specialRequests\` field must follow Rule 0.
        *   **ULTRA-IMPORTANT CLARIFICATION for Generic Base Names**: This specific ambiguous item (e.g., the one for \`雞蛋仔\`) is the **sole and complete representation** for that part of the user's request. You **MUST NOT** also include any of the items from the \`alternatives\` list (e.g., "原味雞蛋仔", "朱古力雞蛋仔") as separate, concrete items in the \`orderItems\` list if they are your interpretation of that same ambiguous generic utterance. The purpose of the ambiguous item is to defer this choice to the user.
    *   If an item is clear and unambiguous (e.g., user says "仙草大滿貫" directly, or "漢堡" if there's only one type of burger, or "豆花滿貫" if it clearly means "豆花大滿貫" based on Rule 1, or "開心果沙冰" if it clearly means "開心果鮮奶冰" based on Rule 1), then \`isAmbiguous\` should be \`false\` or omitted, and \`alternatives\` should be empty or omitted.
    *   If a user lists multiple items together, parse them individually. For example, "我要雞蛋仔同埋一杯凍檸茶" should result in two separate items, where "雞蛋仔" might be ambiguous (following this rule) and "凍檸茶" might resolve to "檸檬茶" with special requests.

5.  **Output Consistency**:
    *   Unless an item is ambiguous (see rule 4), ensure the \`item\` field in your output uses the **full and exact common name** for the food/drink item as suggested by the product categories and examples provided.
    *   The \`quantity\` field must always be an Arabic numeral.

Order Text: {{{orderText}}}

Your output MUST be a valid JSON object matching the specified schema.
Examples of how to interpret (besides the mandatory examples above):
User says: "唔該，我想要一個雞記，要朱古力味，兩份魚蛋，同埋一杯凍檸茶，少甜。"
You might parse this into items like:
- item: "朱古力雞蛋仔", quantity: 1 (Assuming "雞記" + "朱古力味" clearly points to "朱古力雞蛋仔")
- item: "魚蛋8粒", quantity: 2
- item: "檸檬茶", quantity: 1, specialRequests: "凍, 少甜"

User says: "一份原味格仔餅，加底，同一杯熱奶茶，唔要糖。"
- item: "原味格仔餅", quantity: 1, specialRequests: "加底"
- item: "港式奶茶", quantity: 1, specialRequests: "熱, 不要糖" (Assuming 港式奶茶 is the default if not specified, adjust if needed. If "奶茶" is ambiguous with other types, it should follow Rule 4 for generic base names.)

User says: "我要三碗豆花二號，唔該。"
- item: "豆花二號（豆花，地瓜圓，芋圓，黑糖粉條，珍珠）", quantity: 3

User says: "仙草2" (Assuming "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）" is a product and no other product is "X仙草2" or "仙草2Y")
- item: "仙草二號（仙草，地瓜圓，芋圓，黑糖粉條，珍珠）", quantity: 1

User says: "我要兩個先做3號"
- item: "仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）", quantity: 2 (Assuming "先做3號" uniquely resolves to "仙草三號（仙草，地瓜圓，芋圓，珍珠，椰果）")

User says: "一份雞蛋仔"
- item: "雞蛋仔", quantity: 1, isAmbiguous: true, alternatives: ["朱古力雞蛋仔", "原味雞蛋仔", "麻糬雞蛋仔", "咸蛋黃雞蛋仔", "葡撻雞蛋仔"] (or other 雞蛋仔 types from the menu)

User says: "一杯 開心果沙冰"
- item: "開心果鮮奶冰", quantity: 1 (Assuming "開心果鮮奶冰" is the only/primary pistachio cold drink on the menu)


Remember, for \`specialRequests\`, if there are none, the field **MUST BE OMITTED** (Rule 0).
For ambiguous items like "雞蛋仔" where user clarification is needed, you **MUST** follow the exact JSON structure provided in Rule 4.
For generic terms like "大滿貫" or "三號" that should be expanded, you **MUST** follow Rule 1.
For near-matches like "豆花滿貫", you should directly map to "豆花大滿貫" if it exists and is unambiguous.
And critically, for inputs like "我要兩個先做3號", if "先做3號" resolves to "仙草三號(...full name...)", the quantity MUST be 2.
`,
});

const parseOrderFlow = ai.defineFlow(
  {
    name: 'parseOrderFlow',
    inputSchema: ParseOrderInputSchema,
    outputSchema: ParseOrderOutputSchema,
  },
  async (input) => {
    const {output} = await parseOrderPrompt(input);
    // Ensure a valid default if the model fails to provide one
    return output || { orderItems: [] };
  }
);
    

    




