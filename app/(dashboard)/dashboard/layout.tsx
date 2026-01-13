import type React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import Link from "next/link";
import { Bot, LayoutDashboard, CreditCard, LogOut, Crown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/actions/auth-actions";
import { getUserSubscription } from "@/lib/actions/subscription-actions";
import { NavbarLogo } from "@/components/ui/resizable-navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const subscription = await getUserSubscription();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col w-full">
        <header className="top-0 border-b bg-background">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
            </div>
            <div className="flex items-center gap-4">
              {subscription && subscription.plan.name !== "Free" && (
                <Badge variant="secondary" className={`${subscription.plan.name === "Pro"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}>
                  <Crown className="h-3 w-3 mr-1" />
                  {subscription.plan.name}
                </Badge>
              )}
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image || undefined} alt={user.name || ""} />
                <AvatarFallback>
                  {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          <Sidebar>
            <SidebarHeader>
              <NavbarLogo location={"/dashboard"} />
            </SidebarHeader>

            <SidebarContent>
              <SidebarMenu className="gap-2 px-4">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Dashboard">
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Agents">
                    <Link href="/dashboard/agents">
                      <Bot className="h-4 w-4" />
                      <span>Agents</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Billing">
                    <Link href="/dashboard/billing">
                      <CreditCard className="h-4 w-4" />
                      <span>Billing</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>

            <SidebarFooter>
              <SidebarSeparator />
              <div className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <ModeToggle />
                    <p className="text-sm text-muted-foreground">Theme</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                        <AvatarFallback>
                          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="group-data-[collapsible=icon]:hidden">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <form action={signOut}>
                      <Button variant="ghost" size="icon" type="submit" title="Sign out">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="p-3 sm:p-6 w-full">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}