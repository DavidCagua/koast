"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Clock, Activity } from "lucide-react"
import { api } from "~/trpc/react"

export function ActionLogsList() {
  const { data: actionLogs } = api.automation.getActionLogs.useQuery({ limit: 10 })

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Action Logs
        </CardTitle>
        <CardDescription>
          Latest automation rule triggers and their results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actionLogs?.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <p className="font-medium">{log.rule.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatAction(log.action)} - {log.campaign.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={log.status === "success" ? "default" : "destructive"}>
                  {log.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {formatDate(log.triggeredAt)}
                </div>
              </div>
            </div>
          ))}

          {actionLogs?.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No action logs yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}