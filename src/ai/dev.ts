
import { config } from 'dotenv';
config();

import '@/ai/flows/parse-order.ts';
import '@/ai/flows/extract-products-from-image-flow.ts';
import '@/ai/flows/identify-language-flow.ts';
import '@/ai/flows/create-payment-intent-flow.ts';
