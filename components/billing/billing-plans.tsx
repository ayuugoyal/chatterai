"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { UpgradeButton } from "./upgrade-button";
import { detectCurrency, formatCurrency, type Currency } from "@/lib/utils/currency";

interface Plan {
  id: string;
  name: string;
  price: number; // Deprecated
  priceINR: number;
  priceUSD: number;
  maxAgents: number;
  maxConversations: number;
  maxUrlsPerAgent: number;
  features: string[];
}

interface BillingPlansProps {
  plans: Plan[];
  currentPlanId?: string;
}

export function BillingPlans({ plans, currentPlanId }: BillingPlansProps) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect currency on client-side
    const detectedCurrency = detectCurrency();
    setCurrency(detectedCurrency);
    setIsLoading(false);

    // Log for debugging
    console.log("💱 Detected currency:", detectedCurrency);
    console.log("🌍 Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log("🗣️ Language:", navigator.language);
  }, []);

  const getPriceForCurrency = (plan: Plan): number => {
    return currency === "INR" ? plan.priceINR : plan.priceUSD;
  };

  const formatPrice = (plan: Plan): string => {
    const price = getPriceForCurrency(plan);
    if (price === 0) {
      return "Free";
    }
    return formatCurrency(price / 100, currency);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Currency Indicator */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">Prices shown in:</span>
        <Badge variant="secondary" className="font-mono">
          {currency}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = getPriceForCurrency(plan);

          return (
            <Card
              key={plan.id}
              className={currentPlanId === plan.id ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {currentPlanId === plan.id && <Badge>Current</Badge>}
                </div>
                <CardDescription>
                  {price === 0 ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold">{formatPrice(plan)}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {currentPlanId === plan.id ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.name === "Enterprise" ? (
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:support@chatterai.com">Contact Sales</a>
                  </Button>
                ) : (
                  <UpgradeButton
                    planId={plan.id}
                    planName={plan.name}
                    currency={currency}
                    price={price}
                  />
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
