"use client"

import { Button } from "~/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { api } from "~/trpc/react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export function DashboardHeader() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [hasAutoSynced, setHasAutoSynced] = useState(false)
  const utils = api.useUtils()

  // Sync mutation
  const syncMutation = api.campaign.sync.useMutation({
    onSuccess: () => {
      toast.success("Campaign data synced successfully!")
      // Invalidate and refetch campaign data
      utils.campaign.getLatest.invalidate()
    },
    onError: (error) => {
      toast.error(`Failed to sync: ${error.message}`)
    },
  })

  // Auto-sync when component mounts (only once per session)
  useEffect(() => {
    if (!hasAutoSynced) {
      setHasAutoSynced(true)
      handleSync()
    }
  }, [hasAutoSynced])

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
          {isSyncing && !hasAutoSynced && (
            <span className="ml-2 text-sm text-blue-600">
              (Auto-syncing...)
            </span>
          )}
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