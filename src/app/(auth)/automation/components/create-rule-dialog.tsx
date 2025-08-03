"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { api } from "~/trpc/react"
import { toast } from "sonner"

interface CreateRuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateRuleDialog({ open, onOpenChange, onSuccess }: CreateRuleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    metric: "",
    operator: "",
    threshold: "",
    action: "",
    actionValue: "",
  })

  // Fetch available options
  const { data: metrics } = api.automation.getAvailableMetrics.useQuery()
  const { data: actions } = api.automation.getAvailableActions.useQuery()

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils()

  // Create rule mutation
  const createRuleMutation = api.automation.createRule.useMutation({
    onSuccess: () => {
      toast.success("Rule created successfully!")
      // Invalidate the rules query to refresh the list
      utils.automation.getRules.invalidate()
      onSuccess()
      // Reset form
      setFormData({
        name: "",
        description: "",
        metric: "",
        operator: "",
        threshold: "",
        action: "",
        actionValue: "",
      })
    },
    onError: (error) => {
      toast.error(`Failed to create rule: ${error.message}`)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.metric || !formData.operator || !formData.threshold || !formData.action) {
      toast.error("Please fill in all required fields")
      return
    }

    await createRuleMutation.mutateAsync({
      name: formData.name,
      description: formData.description || undefined,
      metric: formData.metric as any,
      operator: formData.operator as any,
      threshold: parseFloat(formData.threshold),
      action: formData.action as any,
      actionValue: formData.actionValue || undefined,
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Automation Rule</DialogTitle>
          <DialogDescription>
            Set up a rule to automatically manage your campaign based on performance metrics.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Pause campaign when CTR drops"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Optional description of what this rule does"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="metric">Metric *</Label>
                <Select value={formData.metric} onValueChange={(value) => handleInputChange("metric", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {metrics?.map((metric) => (
                      <SelectItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="operator">Operator *</Label>
                <Select value={formData.operator} onValueChange={(value) => handleInputChange("operator", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gt">Greater than (&gt;)</SelectItem>
                    <SelectItem value="lt">Less than (&lt;)</SelectItem>
                    <SelectItem value="eq">Equal to (=)</SelectItem>
                    <SelectItem value="gte">Greater than or equal (≥)</SelectItem>
                    <SelectItem value="lte">Less than or equal (≤)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="threshold">Threshold *</Label>
                <Input
                  id="threshold"
                  type="number"
                  step="0.01"
                  value={formData.threshold}
                  onChange={(e) => handleInputChange("threshold", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="action">Action *</Label>
              <Select value={formData.action} onValueChange={(value) => handleInputChange("action", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {actions?.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="actionValue">Action Value</Label>
              <Input
                id="actionValue"
                value={formData.actionValue}
                onChange={(e) => handleInputChange("actionValue", e.target.value)}
                placeholder="e.g., 50 for budget increase amount"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRuleMutation.isLoading}>
              {createRuleMutation.isLoading ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}