// app/(dashboard)/dashboard/billing/page.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { getUserSubscription, getSubscriptionPlans } from "@/lib/actions/subscription-actions";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { CancelSubscriptionButton } from "@/components/billing/cancel-subscription-button";
import { format } from "date-fns";

export default async function BillingPage() {
  const subscription = await getUserSubscription();
  const plans = await getSubscriptionPlans();

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription and billing information</p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{subscription.plan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {subscription.plan.price === 0
                    ? "Free plan"
                    : `₹${(subscription.plan.price / 100).toFixed(0)}/month`}
                </p>
              </div>
              <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                {subscription.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Agents:</span>
                <span className="font-medium">
                  {subscription.plan.maxAgents === -1 ? "Unlimited" : subscription.plan.maxAgents}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Conversations/month:</span>
                <span className="font-medium">
                  {subscription.plan.maxConversations === -1
                    ? "Unlimited"
                    : subscription.plan.maxConversations.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max URLs per Agent:</span>
                <span className="font-medium">
                  {subscription.plan.maxUrlsPerAgent === -1 ? "Unlimited" : subscription.plan.maxUrlsPerAgent}
                </span>
              </div>
              {subscription.plan.price > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Period:</span>
                    <span className="font-medium">
                      {format(new Date(subscription.currentPeriodStart), "MMM dd")} -{" "}
                      {format(new Date(subscription.currentPeriodEnd), "MMM dd, yyyy")}
                    </span>
                  </div>
                  {subscription.cancelAtPeriodEnd && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Your subscription will be canceled on{" "}
                        {format(new Date(subscription.currentPeriodEnd), "MMMM dd, yyyy")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
          {subscription.plan.name !== "Free" && subscription.plan.name !== "Enterprise" && (
            <CardFooter>
              {subscription.cancelAtPeriodEnd ? (
                <Button variant="outline" className="w-full">
                  Reactivate Subscription
                </Button>
              ) : (
                <CancelSubscriptionButton />
              )}
            </CardFooter>
          )}
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={
                subscription?.planId === plan.id ? "border-primary shadow-lg" : ""
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {subscription?.planId === plan.id && <Badge>Current</Badge>}
                </div>
                <CardDescription>
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold">₹{(plan.price / 100).toFixed(0)}</span>
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
                {subscription?.planId === plan.id ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.name === "Enterprise" ? (
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:support@chatterai.com">Contact Sales</a>
                  </Button>
                ) : (
                  <UpgradeButton planId={plan.id} planName={plan.name} />
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>Compare features across all plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-3 px-2">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 px-2">AI Agents</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-2">
                      {plan.maxAgents === -1 ? "Unlimited" : plan.maxAgents}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2">Conversations/month</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-2">
                      {plan.maxConversations === -1 ? "Unlimited" : plan.maxConversations.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2">URLs per Agent</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-2">
                      {plan.maxUrlsPerAgent === -1 ? "Unlimited" : plan.maxUrlsPerAgent}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2">Priority Support</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-2">
                      {plan.name === "Free" ? (
                        <X className="h-4 w-4 text-muted-foreground inline" />
                      ) : (
                        <Check className="h-4 w-4 text-green-500 inline" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-2">Custom Branding</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-2">
                      {plan.name === "Free" ? (
                        <X className="h-4 w-4 text-muted-foreground inline" />
                      ) : (
                        <Check className="h-4 w-4 text-green-500 inline" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}