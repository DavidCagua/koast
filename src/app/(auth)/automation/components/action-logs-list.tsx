"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { api } from "~/trpc/react"

export function ActionLogsList() {
  // Fetch action logs
  const { data: logs } = api.automation.getActionLogs.useQuery({ limit: 10 })

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

  // Format status for display
  const formatStatus = (status: string) => {
    const statusMap = {
      pending: { label: "Pending", variant: "secondary" as const },
      success: { label: "Success", variant: "default" as const },
      failed: { label: "Failed", variant: "destructive" as const },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const }
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Actions</CardTitle>
        <CardDescription>
          Latest automation actions triggered by your rules
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs && logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{formatAction(log.action)}</p>
                    <p className="text-sm text-muted-foreground">
                      Rule: {log.rule.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.triggeredAt)}
                    </p>
                  </div>
                </div>
                <Badge variant={formatStatus(log.status).variant}>
                  {formatStatus(log.status).label}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No action logs yet</p>
            <p className="text-sm text-muted-foreground">
              Actions will appear here when your automation rules are triggered
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}