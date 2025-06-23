
"use client";

import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';
import type { StripePaymentElementOptions } from '@stripe/stripe-js';

interface StripePaymentFormProps {
    totalAmount: number;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ totalAmount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          toast({ title: "Payment Succeeded", description: "Your payment was successful." });
          break;
        case "processing":
          setMessage("Your payment is processing.");
          toast({ title: "Payment Processing", description: "We'll update you when your payment is processed." });
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          toast({ title: "Payment Failed", description: "Please try another payment method.", variant: "destructive" });
          break;
        default:
          setMessage("Something went wrong.");
          toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
          break;
      }
    });
  }, [stripe, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: window.location.origin,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message || "An unexpected error occurred.");
      toast({ title: "Payment Error", description: error.message || "Please check your card details.", variant: "destructive" });
    } else {
      setMessage("An unexpected error occurred.");
      toast({ title: "Error", description: "An unexpected error occurred during payment.", variant: "destructive" });
    }

    setIsLoading(false);
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: "tabs",
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full text-lg py-6">
        <span id="button-text">
          {isLoading ? (
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-6 w-6" />
          )}
          {isLoading ? "處理中..." : `支付 HK$${totalAmount.toFixed(2)}`}
        </span>
      </Button>
      {/* Show any error or success messages */}
      {message && <div id="payment-message" className="text-center text-sm text-destructive">{message}</div>}
    </form>
  );
}

export default StripePaymentForm;
