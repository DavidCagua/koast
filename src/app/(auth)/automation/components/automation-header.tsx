"use client"

import { Button } from "~/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { CreateRuleDialog } from "~/app/(auth)/automation/components/create-rule-dialog"

export function AutomationHeader() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Rules</h1>
          <p className="text-muted-foreground">
            Create and manage automation rules for your campaigns
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <CreateRuleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          // The rules list will automatically refetch due to tRPC cache invalidation
        }}
      />
    </>
  )
}