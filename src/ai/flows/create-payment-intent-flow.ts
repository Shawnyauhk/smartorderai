
'use server';
/**
 * @fileOverview Creates a Stripe Payment Intent.
 *
 * - createPaymentIntent - A function that creates a Stripe Payment Intent and returns a client secret.
 * - CreatePaymentIntentInput - The input type for the createPaymentIntent function.
 * - CreatePaymentIntentOutput - The return type for the createPaymentIntent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const CreatePaymentIntentInputSchema = z.object({
  amount: z.number().describe('The amount for the payment intent in the smallest currency unit (e.g., cents).'),
});
export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentInputSchema>;

const CreatePaymentIntentOutputSchema = z.object({
  clientSecret: z.string().describe('The client secret from the Stripe Payment Intent.'),
});
export type CreatePaymentIntentOutput = z.infer<typeof CreatePaymentIntentOutputSchema>;


export async function createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentOutput> {
  return createPaymentIntentFlow(input);
}

const createPaymentIntentFlow = ai.defineFlow(
  {
    name: 'createPaymentIntentFlow',
    inputSchema: CreatePaymentIntentInputSchema,
    outputSchema: CreatePaymentIntentOutputSchema,
  },
  async ({ amount }) => {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'hkd', // Use Hong Kong Dollar
        automatic_payment_methods: {
          enabled: true,
        },
      });

      if (!paymentIntent.client_secret) {
        throw new Error('Failed to create Payment Intent or client_secret is null.');
      }

      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
            console.error('Stripe Error creating payment intent:', error.message);
            throw new Error(`Stripe API error: ${error.message}`);
        } else {
            console.error('Unknown error creating payment intent:', error);
            throw new Error('An unknown error occurred while creating the payment intent.');
        }
    }
  }
);
