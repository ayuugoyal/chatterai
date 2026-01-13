"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { useState, useEffect } from "react";
import { detectCurrency, formatCurrency, type Currency } from "@/lib/utils/currency";

interface Plan {
  name: string;
  priceINR: number;
  priceUSD: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}

const plans: Plan[] = [
  {
    name: "Free",
    priceINR: 0,
    priceUSD: 0,
    period: "forever",
    description: "Perfect for testing and small projects",
    features: [
      "1 AI Agent",
      "50 conversations/month",
      "5 URLs per agent",
      "Email support",
      "Community access",
      "Basic analytics",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    priceINR: 500,
    priceUSD: 6,
    period: "per month",
    description: "Best for growing businesses",
    features: [
      "5 AI Agents",
      "5,000 conversations/month",
      "50 URLs per agent",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "API access",
      "Remove 'Powered by' badge",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    priceINR: 2000,
    priceUSD: 24,
    period: "per month",
    description: "For large scale operations",
    features: [
      "Unlimited AI Agents",
      "Unlimited conversations",
      "Unlimited URLs",
      "24/7 Priority support",
      "Advanced analytics",
      "Custom branding",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "White-label solution",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingSection() {
  const { isSignedIn } = useAuth();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect currency on client-side
    const detectedCurrency = detectCurrency();
    setCurrency(detectedCurrency);
    setIsLoading(false);
  }, []);

  const getPrice = (plan: Plan): string => {
    const price = currency === "INR" ? plan.priceINR : plan.priceUSD;
    if (price === 0) {
      return "Free";
    }
    return formatCurrency(price, currency);
  };

  return (
    <section id="pricing" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/10 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-medium tracking-wider text-primary bg-primary/10 rounded-full uppercase">
            Simple Pricing
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 px-2">
            Choose the <span className="text-gradient">Perfect Plan</span> for Your Business
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Start free, upgrade as you grow. All plans include core features.
          </p>
          {!isLoading && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Prices shown in:</span>
              <Badge variant="secondary" className="font-mono">
                {currency}
              </Badge>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl border ${
                plan.popular
                  ? "border-primary shadow-xl shadow-primary/20 bg-gradient-to-b from-primary/5 to-background"
                  : "border-border bg-background"
              } p-6 md:p-8`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-primary-foreground bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  {isLoading ? (
                    <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <>
                      <span className="text-3xl md:text-4xl font-bold">{getPrice(plan)}</span>
                      {(plan.priceINR > 0 || plan.priceUSD > 0) && (
                        <span className="text-sm md:text-base text-muted-foreground">/{plan.period}</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <ul className="space-y-2.5 md:space-y-3 mb-6 md:mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2 md:gap-3">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={
                  plan.name === "Enterprise"
                    ? "mailto:support@chatterai.com"
                    : isSignedIn
                      ? "/dashboard/billing"
                      : "/sign-up"
                }
                className="block"
              >
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8 md:mt-12 px-4"
        >
          <p className="text-xs md:text-sm text-muted-foreground">
            All plans include SSL encryption, automatic backups, and 99.9% uptime SLA.
            <br className="hidden sm:block" />
            <span className="block sm:inline mt-1 sm:mt-0">Need a custom plan?{" "}
            <a href="mailto:support@chatterai.com" className="text-primary hover:underline">
              Contact us
            </a>
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
