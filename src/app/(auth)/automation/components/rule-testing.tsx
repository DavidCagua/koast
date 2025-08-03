"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { api } from "~/trpc/react"
import { toast } from "sonner"
import { Play, Zap } from "lucide-react"

export function RuleTesting() {
  const [mockData, setMockData] = useState({
    spend: 1500,
    clicks: 100,
    reach: 5000,
    impressions: 10000,
    inlineLinkClicks: 50,
    costPerInlineLinkClick: 2.5,
    frequency: 2.0,
    cpc: 1.5,
    ctr: 0.01,
  })

  const utils = api.useUtils()

  const executeRulesMutation = api.automation.executeRules.useMutation({
    onSuccess: (data) => {
      toast.success(`Executed ${data.executedActions} automation actions!`)
      // Invalidate action logs to show new actions
      utils.automation.getActionLogs.invalidate()
    },
    onError: (error) => {
      toast.error(`Failed to execute rules: ${error.message}`)
    },
  })

  const handleExecuteRules = async () => {
    await executeRulesMutation.mutateAsync({ campaignData: mockData })
  }

  const handleInputChange = (field: string, value: string) => {
    setMockData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Test Rule Execution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Test your automation rules with mock campaign data. This will execute all active rules and log the actions.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="spend">Spend</Label>
              <Input
                id="spend"
                type="number"
                value={mockData.spend}
                onChange={(e) => handleInputChange("spend", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clicks">Clicks</Label>
              <Input
                id="clicks"
                type="number"
                value={mockData.clicks}
                onChange={(e) => handleInputChange("clicks", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reach">Reach</Label>
              <Input
                id="reach"
                type="number"
                value={mockData.reach}
                onChange={(e) => handleInputChange("reach", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ctr">CTR</Label>
              <Input
                id="ctr"
                type="number"
                step="0.001"
                value={mockData.ctr}
                onChange={(e) => handleInputChange("ctr", e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleExecuteRules}
            disabled={executeRulesMutation.isLoading}
            className="w-full"
          >
            {executeRulesMutation.isLoading ? (
              <>
                <Play className="h-4 w-4 mr-2 animate-spin" />
                Executing Rules...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Execute Rules with Mock Data
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground">
            <p>💡 Try these scenarios:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>High spend (&gt;1000) + Low CTR (&lt;0.02)</li>
              <li>High clicks (&gt;500) + High CPC (&gt;2.0)</li>
              <li>Low reach (&lt;1000) + High frequency (&gt;3.0)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}