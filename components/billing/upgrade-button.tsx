"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession, verifyPaymentAndActivateSubscription, switchToFreePlan, reactivateSubscription } from "@/lib/actions/subscription-actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  error?: {
    description: string;
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme: {
    color: string;
  };
  modal?: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: RazorpayResponse) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface UpgradeButtonProps {
  planId: string;
  planName: string;
  currency: "INR" | "USD";
  price: number; // in smallest unit (paise/cents)
}

export function UpgradeButton({ planId, planName, currency, price }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const router = useRouter();

  // Load Razorpay script
  useEffect(() => {
    // Check if script is already loaded
    if (window.Razorpay) {
      console.log("✅ Razorpay already loaded from previous session");
      setScriptLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      console.log("⏳ Razorpay script tag exists, checking if loaded...");
      // Script tag exists, but check if Razorpay is available
      // Use a small interval to check if Razorpay becomes available
      const checkInterval = setInterval(() => {
        if (window.Razorpay) {
          console.log("✅ Razorpay script loaded successfully");
          setScriptLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);

      // Cleanup function
      return () => {
        clearInterval(checkInterval);
      };
    }

    console.log("Loading Razorpay script...");
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("✅ Razorpay script loaded successfully");
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error("❌ Failed to load Razorpay script");
    };
    document.body.appendChild(script);

    // Don't remove the script on cleanup - let it persist across re-renders
    // This prevents reload issues when switching between plans
  }, []);

  async function handleUpgrade() {
    console.log("=== UPGRADE BUTTON CLICKED ===");
    console.log("Script Loaded:", scriptLoaded);
    console.log("Plan ID:", planId);
    console.log("Plan Name:", planName);
    console.log("Currency:", currency);
    console.log("Price:", price);

    // Check if this is Free plan (price is 0)
    if (planName === "Free" || price === 0) {
      console.log("Switching to Free plan (no payment required)");
      setIsLoading(true);
      const result = await switchToFreePlan();

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "You've successfully switched to the Free plan!",
        });
        router.refresh();
      }
      setIsLoading(false);
      return;
    }

    if (!scriptLoaded) {
      console.error("Razorpay script not loaded yet");
      toast({
        title: "Error",
        description: "Payment system is loading. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Creating checkout session with currency:", currency);
    const result = await createCheckoutSession(planId, currency);
    console.log("Checkout session result:", result);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Check if we should reactivate instead of charging
    if (result.reactivate && result.subscriptionId) {
      console.log("♻️ Reactivating existing paid subscription instead of charging");
      const reactivateResult = await reactivateSubscription(result.subscriptionId);

      if (reactivateResult.error) {
        toast({
          title: "Error",
          description: reactivateResult.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: `You've been switched back to ${planName} plan! No additional charge since you already paid for this month.`,
        });
        router.refresh();
      }
      setIsLoading(false);
      return;
    }

    if (!result.success || !result.orderId) {
      console.error("Invalid session result:", result);
      toast({
        title: "Error",
        description: "Failed to create payment session",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    console.log("Razorpay Key ID from result:", result.keyId);

    if (!result.keyId) {
      console.error("❌ NEXT_PUBLIC_RAZORPAY_KEY_ID is missing! Did you restart the dev server?");
      toast({
        title: "Configuration Error",
        description: "Razorpay key not found. Please restart your dev server after setting NEXT_PUBLIC_RAZORPAY_KEY_ID",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!window.Razorpay) {
      console.error("❌ window.Razorpay is not available!");
      toast({
        title: "Script Error",
        description: "Razorpay script failed to load. Please refresh the page.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    console.log("✅ All checks passed. Opening Razorpay Checkout...");

    // Initialize Razorpay Checkout
    const options = {
      key: result.keyId,
      amount: result.amount,
      currency: result.currency,
      name: "Chatter AI",
      description: `Upgrade to ${result.planName} Plan`,
      order_id: result.orderId,
      handler: async function (response: RazorpayResponse) {
        try {
          // Verify payment and activate subscription
          const verifyResult = await verifyPaymentAndActivateSubscription(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            result.planId!,
            result.customerId!,
            currency
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
        } catch {
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

    razorpay.on("payment.failed", function (response: RazorpayResponse) {
      toast({
        title: "Payment Failed",
        description: response.error?.description || "Payment could not be processed",
        variant: "destructive",
      });
      setIsLoading(false);
    });
  }

  // Free plan doesn't need Razorpay script, so don't disable button for it
  const isFreeplan = planName === "Free" || price === 0;
  const isDisabled = isLoading || (!isFreeplan && !scriptLoaded);

  return (
    <Button className="w-full" onClick={handleUpgrade} disabled={isDisabled}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : !isFreeplan && !scriptLoaded ? (
        "Loading..."
      ) : (
        `Upgrade to ${planName}`
      )}
    </Button>
  );
}

