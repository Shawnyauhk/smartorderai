
'use server';
/**
 * @fileOverview Extracts product information from an image.
 *
 * - extractProductsFromImage - A function that analyzes an image and extracts product details.
 * - ExtractProductsInput - The input type for the extractProductsFromImage function.
 * - ExtractProductsOutput - The return type for the extractProductsFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractedProductSchema = z.object({
  name: z.string().describe("The full name of the product as accurately as possible from the image."),
  price: z.number().optional().describe("The price of the product as a number. Omit if not found or unclear."),
  category: z.string().optional().describe("The category of the product if discernible from the image or context. Omit if not found or highly ambiguous."),
  description: z.string().optional().describe("A brief description of the product if available in the image. Omit if not found."),
});
export type ExtractedProduct = z.infer<typeof ExtractedProductSchema>;

const ExtractProductsInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a menu or product list, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  contextPrompt: z.string().optional().describe("Optional additional context or instructions for the AI, e.g., 'This is a dessert menu', 'Focus on items with prices'.")
});
export type ExtractProductsInput = z.infer<typeof ExtractProductsInputSchema>;

const ExtractProductsOutputSchema = z.object({
  extractedProducts: z.array(ExtractedProductSchema).describe('A list of product details extracted from the image.'),
});
export type ExtractProductsOutput = z.infer<typeof ExtractProductsOutputSchema>;

export async function extractProductsFromImage(input: ExtractProductsInput): Promise<ExtractProductsOutput> {
  return extractProductsFlow(input);
}

const extractProductsPrompt = ai.definePrompt({
  name: 'extractProductsPrompt',
  input: {schema: ExtractProductsInputSchema},
  output: {schema: ExtractProductsOutputSchema},
  prompt: `You are an expert AI assistant specializing in extracting structured product information from images of menus, product lists, or spreadsheets.
Your goal is to accurately identify product names, prices, categories (if discernible), and descriptions (if available) from the provided image.

Image to analyze: {{media url=imageDataUri}}

{{#if contextPrompt}}
Additional context for extraction: {{{contextPrompt}}}
{{/if}}

Instructions:
1.  **Product Name**: Identify the full name of each product. Be as accurate as possible.
2.  **Price**: Extract the numerical price for each product. If a price is not clearly associated with a product or is ambiguous, omit the 'price' field for that product. Do not guess. Ensure the price is a number, not text.
3.  **Category**: If the image provides clear categorization (e.g., sections like "Appetizers", "Main Courses", "Drinks"), assign the product to that category. If categories are not explicit or are very ambiguous, you may omit the 'category' field or use a general term like "Uncategorized" if appropriate.
4.  **Description**: If a brief description for a product is present, extract it. Otherwise, omit the 'description' field.
5.  **Structure**: Return the extracted information as a list of product objects, adhering to the output JSON schema.
6.  **Accuracy**: Prioritize accuracy. If you are unsure about a piece of information for a product, it's better to omit that specific field for that product than to provide incorrect data.
7.  **Completeness**: Try to extract all discernible products from the image.

Your output MUST be a valid JSON object matching the specified schema.
If no products can be reliably extracted, return an empty list for "extractedProducts".
`,
});

const extractProductsFlow = ai.defineFlow(
  {
    name: 'extractProductsFlow',
    inputSchema: ExtractProductsInputSchema,
    outputSchema: ExtractProductsOutputSchema,
  },
  async (input) => {
    // Set a higher safety threshold for HARM_CATEGORY_DANGEROUS_CONTENT
    // as menus can sometimes contain words that might be flagged.
    const {output} = await extractProductsPrompt(input, {
      config: {
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
        ],
      }
    });
    return output || { extractedProducts: [] }; // Ensure a valid output even if the model returns null
  }
);
