"use client";

import { useState } from "react";
import {
  User,
  CreditCard,
  Key,
  Bell,
  Shield,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { STRIPE_PLANS } from "@/lib/stripe";

const apiKeys = [
  { id: "1", name: "Production Key", key: "gs_prod_****************************a3f7", created: "Feb 12, 2026", lastUsed: "2 hours ago" },
  { id: "2", name: "Development Key", key: "gs_dev_****************************b8c2", created: "Jan 28, 2026", lastUsed: "Never" },
];

const notificationSettings = [
  { id: "render_complete", label: "Render Complete", description: "Get notified when a video finishes rendering", enabled: true },
  { id: "weekly_report", label: "Weekly Report", description: "Receive weekly analytics summary", enabled: true },
  { id: "new_features", label: "New Features", description: "Be the first to know about new features", enabled: false },
  { id: "billing", label: "Billing Alerts", description: "Get notified about billing changes", enabled: true },
];

export default function SettingsPage() {
  const [showKey, setShowKey] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(notificationSettings);

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-border/30 bg-card/30">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full gradient-cyber flex items-center justify-center text-xl font-bold text-primary-foreground">
                    GS
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      defaultValue="Ghost Creator"
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      defaultValue="creator@ghoststudio.ai"
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                </div>
                <Button className="gradient-cyber text-primary-foreground glow-cyber-sm">
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                </div>
                <Button variant="outline">Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription */}
          <TabsContent value="subscription" className="space-y-6">
            <Card className="border-primary/30 bg-card/30 glow-cyber-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Your active subscription</CardDescription>
                  </div>
                  <Badge className="gradient-cyber text-primary-foreground">
                    Creator
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">Creator - $29/mo</span>
                  </div>
                  <Separator className="bg-border/30" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Cycle</span>
                    <span>Monthly</span>
                  </div>
                  <Separator className="bg-border/30" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Billing</span>
                    <span>Apr 4, 2026</span>
                  </div>
                  <Separator className="bg-border/30" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Videos This Month</span>
                    <span>18 / 30</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button className="gradient-cyber text-primary-foreground">
                    Upgrade to Pro
                  </Button>
                  <Button variant="outline">Cancel Subscription</Button>
                </div>
              </CardContent>
            </Card>

            {/* Plan comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(["free", "creator", "pro", "agency"] as const).map((planId) => {
                const plan = STRIPE_PLANS[planId];
                const isCurrentPlan = planId === "creator";
                return (
                  <Card
                    key={planId}
                    className={`border-border/30 bg-card/30 ${
                      isCurrentPlan ? "ring-1 ring-primary" : ""
                    }`}
                  >
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold mb-1">{plan.name}</h3>
                      <div className="text-2xl font-bold mb-2">
                        ${plan.price}
                        {plan.price > 0 && (
                          <span className="text-xs text-muted-foreground">
                            /mo
                          </span>
                        )}
                      </div>
                      {isCurrentPlan && (
                        <Badge className="gradient-cyber text-primary-foreground text-xs">
                          Current
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api" className="space-y-6">
            <Card className="border-border/30 bg-card/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                      Manage your API keys for programmatic access
                    </CardDescription>
                  </div>
                  <Button size="sm" className="gradient-cyber text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    New Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg border border-border/30 bg-background/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {apiKey.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs border-border/30"
                        >
                          {apiKey.key.startsWith("gs_prod")
                            ? "Production"
                            : "Development"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-muted-foreground font-mono">
                          {showKey === apiKey.id
                            ? apiKey.key.replace(/\*/g, "x")
                            : apiKey.key}
                        </code>
                        <button
                          onClick={() =>
                            setShowKey(
                              showKey === apiKey.id ? null : apiKey.id
                            )
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {showKey === apiKey.id ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                        <button className="text-muted-foreground hover:text-primary">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Created {apiKey.created} · Last used{" "}
                        {apiKey.lastUsed}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border/30 bg-card/30">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/30 bg-background/30"
                  >
                    <div>
                      <div className="font-medium text-sm">{notif.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {notif.description}
                      </div>
                    </div>
                    <Switch
                      checked={notif.enabled}
                      onCheckedChange={() => toggleNotification(notif.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
