"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Plus, Settings, Trash2, Edit, Play, Pause } from "lucide-react"
import { api } from "~/trpc/react"
import { toast } from "sonner"
import { useState } from "react"
import { CreateRuleDialog } from "~/app/(auth)/automation/components/create-rule-dialog"

export function AutomationRulesList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Fetch automation data
  const { data: rules, refetch: refetchRules } = api.automation.getRules.useQuery()

  // Get the tRPC utils for cache invalidation
  const utils = api.useUtils()

  // Mutations
  const toggleRuleMutation = api.automation.toggleRule.useMutation({
    onSuccess: () => {
      toast.success("Rule status updated!")
      utils.automation.getRules.invalidate()
    },
    onError: (error) => {
      toast.error(`Failed to update rule: ${error.message}`)
    },
  })

  const deleteRuleMutation = api.automation.deleteRule.useMutation({
    onSuccess: () => {
      toast.success("Rule deleted!")
      utils.automation.getRules.invalidate()
    },
    onError: (error) => {
      toast.error(`Failed to delete rule: ${error.message}`)
    },
  })

  const handleToggleRule = async (id: string, isActive: boolean) => {
    await toggleRuleMutation.mutateAsync({ id, isActive })
  }

  const handleDeleteRule = async (id: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      await deleteRuleMutation.mutateAsync({ id })
    }
  }

  // Format operator for display
  const formatOperator = (operator: string) => {
    const operators = {
      gt: ">",
      lt: "<",
      eq: "=",
      gte: "≥",
      lte: "≤",
    }
    return operators[operator as keyof typeof operators] || operator
  }

  // Format metric for display
  const formatMetric = (metric: string) => {
    const metrics = {
      spend: "Spend",
      clicks: "Clicks",
      reach: "Reach",
      impressions: "Impressions",
      inlineLinkClicks: "Link Clicks",
      costPerInlineLinkClick: "Cost per Link Click",
      frequency: "Frequency",
      cpc: "Cost per Click",
      ctr: "CTR",
    }
    return metrics[metric as keyof typeof metrics] || metric
  }

  // Format action for display
  const formatAction = (action: string) => {
    const actions = {
      pause_campaign: "Pause Campaign",
      increase_budget: "Increase Budget",
      decrease_budget: "Decrease Budget",
      send_notification: "Send Notification",
    }
    return actions[action as keyof typeof actions] || action
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <>
      <div className="grid gap-6">
        {rules?.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleRule(rule.id, !rule.isActive)}
                    disabled={toggleRuleMutation.isLoading}
                  >
                    {rule.isActive ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={deleteRuleMutation.isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {rule.description && (
                <CardDescription>{rule.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Condition</p>
                  <p className="text-sm">
                    {formatMetric(rule.metric)} {formatOperator(rule.operator)} {rule.threshold}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <p className="text-sm">{formatAction(rule.action)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Triggers</p>
                  <p className="text-sm">{rule.triggerCount} times</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Triggered</p>
                  <p className="text-sm">
                    {rule.lastTriggered ? formatDate(rule.lastTriggered) : "Never"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No automation rules</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first automation rule to automatically manage your campaigns based on performance metrics.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Rule
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Rule Dialog */}
      <CreateRuleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          utils.automation.getRules.invalidate()
        }}
      />
    </>
  )
}