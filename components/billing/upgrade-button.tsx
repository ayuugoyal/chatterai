"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/actions/subscription-actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export function UpgradeButton({ planId, planName }: { planId: string; planName: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleUpgrade() {
    setIsLoading(true);
    const result = await createCheckoutSession(planId);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      setIsLoading(false);
    } else if (result.url) {
      window.location.href = result.url;
    }
  }

  return (
    <Button className="w-full" onClick={handleUpgrade} disabled={isLoading}>
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

