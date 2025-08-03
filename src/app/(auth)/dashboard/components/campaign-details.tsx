"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { api } from "~/trpc/react"

export function CampaignDetails() {
  // Fetch campaign data
  const { data: campaign } = api.campaign.getLatest.useQuery()

  // Calculate time since last sync
  const getTimeSinceSync = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hours ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} days ago`
  }

  return (
    <>
      {/* Last Synced */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">
          {campaign?.syncedAt
            ? `Last synced: ${getTimeSinceSync(campaign.syncedAt)}`
            : "No data synced yet"
          }
        </Badge>
      </div>

      {/* Campaign Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>
              Key metrics and trends for your active campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Campaign ID</span>
              <Badge variant="outline">{campaign?.campaignId || "N/A"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge className="bg-green-100 text-green-800">
                {campaign ? "Active" : "No Data"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm">
                {campaign?.syncedAt
                  ? new Date(campaign.syncedAt).toLocaleString()
                  : "Never"
                }
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>
              Latest automation rule triggers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaign ? (
                <div className="text-sm text-muted-foreground">
                  No automation rules triggered yet. Create rules in the Automation section.
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No campaign data available. Sync data to see metrics.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}