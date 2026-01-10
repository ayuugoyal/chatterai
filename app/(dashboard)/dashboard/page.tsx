import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Bot, ExternalLink, Link as LinkIcon, Crown, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getUserAgents } from "@/lib/actions/agent-actions"
import { AgentPopUp } from "@/components/agents-popup"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getUserSubscription, getUsageStatistics } from "@/lib/actions/subscription-actions"

export default async function DashboardPage() {
  const agents = await getUserAgents()
  const subscription = await getUserSubscription()
  const usage = await getUsageStatistics()

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          {subscription && (
            <p className="text-sm text-muted-foreground mt-1">
              Current Plan: <span className="font-medium text-foreground">{subscription.plan.name}</span>
            </p>
          )}
        </div>
        <AgentPopUp />
      </div>

      {/* Subscription & Usage Card */}
      {subscription && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{subscription.plan.name} Plan</CardTitle>
              </div>
              <Link href="/dashboard/billing">
                <Button variant="outline" size="sm">
                  {subscription.plan.name === "Free" ? "Upgrade Plan" : "Manage Billing"}
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>
              {subscription.plan.name === "Free"
                ? "Upgrade to unlock more features and higher limits"
                : `Your subscription renews in ${usage.daysUntilReset} days`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Agents Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI Agents</span>
                  <span className="font-medium">
                    {usage.agentsUsed} / {subscription.plan.maxAgents === -1 ? "∞" : subscription.plan.maxAgents}
                  </span>
                </div>
                <Progress
                  value={subscription.plan.maxAgents === -1 ? 0 : (usage.agentsUsed / subscription.plan.maxAgents) * 100}
                  className="h-2"
                />
              </div>

              {/* Conversations Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Conversations</span>
                  <span className="font-medium">
                    {usage.conversationsUsed.toLocaleString()} / {subscription.plan.maxConversations === -1 ? "∞" : subscription.plan.maxConversations.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={subscription.plan.maxConversations === -1 ? 0 : (usage.conversationsUsed / subscription.plan.maxConversations) * 100}
                  className="h-2"
                />
              </div>
            </div>

            {/* Upgrade prompts and warnings */}
            {subscription.plan.name === "Free" && usage.agentsUsed >= subscription.plan.maxAgents && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ You&apos;ve reached your agent limit. <Link href="/dashboard/billing" className="underline font-medium">Upgrade to Pro</Link> to create up to 30 agents!
                </p>
              </div>
            )}

            {/* Conversation limit warning */}
            {subscription.plan.maxConversations !== -1 && usage.conversationsUsed >= subscription.plan.maxConversations * 0.8 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  ⚡ You&apos;ve used {Math.round((usage.conversationsUsed / subscription.plan.maxConversations) * 100)}% of your conversation limit this month.
                  {subscription.plan.name === "Free" && (
                    <> <Link href="/dashboard/billing" className="underline font-medium">Upgrade now</Link> for more conversations!</>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Welcome banner for new users */}
      {subscription && subscription.plan.name === "Free" && agents.length === 0 && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle>Welcome to Chatter AI! 🎉</CardTitle>
            <CardDescription>
              You&apos;re on the Free plan with 5 agents and 250 conversations per month. Create your first AI agent to get started!
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">
              {agents.length === 0
                ? "Create your first agent to get started"
                : `${agents.filter((a) => a.isActive).length} active agents`}
            </p>
          </CardContent>
        </Card>
        {/* <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Track your agent conversations</p>
          </CardContent>
        </Card> */}
        {/* <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Monitor user engagement</p>
          </CardContent>
        </Card> */}
      </div>

      {/* My Agents Section */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">My Agents</h2>
          <p className="text-sm text-muted-foreground">
            {agents.length === 0
              ? "No agents created yet"
              : `Showing ${agents.length} agent${agents.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {agents.length === 0 ? (
          <Card className="border-dashed text-center p-10">
            <CardContent className="flex flex-col items-center justify-center pt-6">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No agents created yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first AI agent to embed on your website or share with others.
              </p>
              <AgentPopUp />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className={`overflow-hidden hover:shadow-md transition-shadow ${subscription?.plan.name !== "Free" ? "border-primary/30" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 flex-wrap">
                        {agent.name}
                        {agent.isActive ? (
                          <Badge variant="default" className="text-xs bg-[green] hover:bg-[green]">Active</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Inactive</Badge>
                        )}
                        {subscription?.plan.name === "Pro" && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            Pro
                          </Badge>
                        )}
                        {subscription?.plan.name === "Enterprise" && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            Enterprise
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                    <Bot className={`h-5 w-5 ${subscription?.plan.name !== "Free" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                </CardHeader>
                <CardContent className="text-sm pb-2">
                  <div className="text-xs text-muted-foreground mb-2 flex items-center">
                    <LinkIcon className="h-3 w-3 mr-1" />
                    <span className="truncate">{process.env.NEXT_PUBLIC_BASE_URL + "/chat/" + agent.slug}</span>
                  </div>
                  <p className="line-clamp-2 text-sm h-10">
                    {agent.systemPrompt}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2 pt-0">
                  <Link href={`/dashboard/agents/${agent.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/chat/${agent.slug}`} target="_blank" className="w-full">
                    <Button variant="default" size="sm" className="w-full">
                      Test <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}