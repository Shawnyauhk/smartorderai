
'use server';
/**
 * @fileOverview Identifies the primary language of a given text.
 *
 * - identifyLanguage - A function that analyzes text and returns its BCP 47 language code.
 * - IdentifyLanguageInput - The input type for the identifyLanguage function.
 * - IdentifyLanguageOutput - The return type for the identifyLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyLanguageInputSchema = z.object({
  textToIdentify: z.string().describe('The text whose language needs to be identified.'),
});
export type IdentifyLanguageInput = z.infer<typeof IdentifyLanguageInputSchema>;

const IdentifyLanguageOutputSchema = z.object({
  identifiedLanguage: z.string().describe("The identified BCP 47 language code. Expected values: 'yue-Hant-HK' (Cantonese), 'cmn-Hans-CN' (Mandarin), 'en-US' (English), 'mixed' (if multiple languages are significantly present), or 'unknown' (if unidentifiable)."),
});
export type IdentifyLanguageOutput = z.infer<typeof IdentifyLanguageOutputSchema>;

export async function identifyLanguage(input: IdentifyLanguageInput): Promise<IdentifyLanguageOutput> {
  return identifyLanguageFlow(input);
}

const identifyLanguagePrompt = ai.definePrompt({
  name: 'identifyLanguagePrompt',
  input: {schema: IdentifyLanguageInputSchema},
  output: {schema: IdentifyLanguageOutputSchema},
  prompt: `You are a language identification expert. Analyze the following text and determine its primary language or if it's a mix of languages.
The text might be a direct user input or a transcription from speech, so it might contain colloquialisms or transcription inaccuracies.

Focus on identifying one of the following:
- Cantonese (Traditional Hong Kong): return 'yue-Hant-HK'
- Mandarin Chinese (Simplified Mainland): return 'cmn-Hans-CN'
- English (United States): return 'en-US'

If multiple languages from the list above are significantly present and intermingled, return 'mixed'.
If the language is none of these, or if it's too short or garbled to be confidently identified, return 'unknown'.

Text to analyze:
"{{{textToIdentify}}}"

Return your response as a JSON object matching the output schema.
`,
});

const identifyLanguageFlow = ai.defineFlow(
  {
    name: 'identifyLanguageFlow',
    inputSchema: IdentifyLanguageInputSchema,
    outputSchema: IdentifyLanguageOutputSchema,
  },
  async (input) => {
    const {output} = await identifyLanguagePrompt(input);
    // Ensure a valid default if the model fails to provide one
    return output || { identifiedLanguage: 'unknown' };
  }
);
