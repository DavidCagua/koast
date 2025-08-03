"use client"

import { Button } from "~/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { api } from "~/trpc/react"
import { useState } from "react"
import { toast } from "sonner"

export function DashboardHeader() {
  const [isSyncing, setIsSyncing] = useState(false)

  // Sync mutation
  const syncMutation = api.campaign.sync.useMutation({
    onSuccess: () => {
      toast.success("Campaign data synced successfully!")
    },
    onError: (error) => {
      toast.error(`Failed to sync: ${error.message}`)
    },
  })

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncMutation.mutateAsync()
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaign Highlights</h1>
        <p className="text-muted-foreground">
          Real-time metrics for your Meta Ads campaign
        </p>
      </div>
      <Button onClick={handleSync} disabled={isSyncing}>
        {isSyncing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {isSyncing ? "Syncing..." : "Sync Data"}
      </Button>
    </div>
  )
}