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
  prompt: `You are an AI assistant that helps parse customer voice orders in a restaurant.

  Analyze the following order text and extract the items, quantities, and any special requests.
  Return the information in a structured JSON format.

  Order Text: {{{orderText}}}

  Make sure the output is a valid JSON.`,
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
