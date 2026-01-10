"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession, verifyPaymentAndActivateSubscription } from "@/lib/actions/subscription-actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function UpgradeButton({ planId, planName }: { planId: string; planName: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const router = useRouter();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function handleUpgrade() {
    if (!scriptLoaded) {
      toast({
        title: "Error",
        description: "Payment system is loading. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await createCheckoutSession(planId);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!result.success || !result.orderId) {
      toast({
        title: "Error",
        description: "Failed to create payment session",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Initialize Razorpay Checkout
    const options = {
      key: result.keyId,
      amount: result.amount,
      currency: result.currency,
      name: "Chatter AI",
      description: `Upgrade to ${result.planName} Plan`,
      order_id: result.orderId,
      handler: async function (response: any) {
        try {
          // Verify payment and activate subscription
          const verifyResult = await verifyPaymentAndActivateSubscription(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            result.planId!,
            result.customerId!
          );

          if (verifyResult.error) {
            toast({
              title: "Payment Verification Failed",
              description: verifyResult.error,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Success!",
              description: `You've successfully upgraded to ${planName} plan!`,
            });
            router.refresh();
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to verify payment. Please contact support.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      },
      prefill: {
        name: "",
        email: "",
      },
      theme: {
        color: "#8b5cf6",
      },
      modal: {
        ondismiss: function () {
          setIsLoading(false);
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();

    razorpay.on("payment.failed", function (response: any) {
      toast({
        title: "Payment Failed",
        description: response.error.description || "Payment could not be processed",
        variant: "destructive",
      });
      setIsLoading(false);
    });
  }

  return (
    <Button className="w-full" onClick={handleUpgrade} disabled={isLoading || !scriptLoaded}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Upgrade to ${planName}`
      )}
    </Button>
  );
}

