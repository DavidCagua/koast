"use client"

import { Button } from "~/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { RuleBuilder } from "./rule-builder"
import { api } from "~/trpc/react"
import { toast } from "sonner"

export function AutomationHeader() {
  const [isRuleBuilderOpen, setIsRuleBuilderOpen] = useState(false)

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils()

  // Create rule mutation
  const createRuleMutation = api.automation.createRule.useMutation({
    onSuccess: () => {
      toast.success("Rule created successfully!")
      utils.automation.getRules.invalidate()
      setIsRuleBuilderOpen(false)
    },
    onError: (error) => {
      toast.error(`Failed to create rule: ${error.message}`)
    },
  })

  const handleSaveRule = async (ruleData: {
    name: string
    description?: string
    action: string
    actionValue?: string
    conditionGroups: any[]
  }) => {
    await createRuleMutation.mutateAsync(ruleData)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Rules</h1>
          <p className="text-muted-foreground">
            Create and manage automation rules for your campaigns
          </p>
        </div>
        <Button onClick={() => setIsRuleBuilderOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {isRuleBuilderOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <RuleBuilder
              onSave={handleSaveRule}
              onCancel={() => setIsRuleBuilderOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}