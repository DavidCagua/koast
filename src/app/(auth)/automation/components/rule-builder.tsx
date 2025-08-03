"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Plus, GripVertical, X, Bell } from "lucide-react"
import { api } from "~/trpc/react"
import { toast } from "sonner"

interface Condition {
  id: string
  metric: string
  operator: string
  threshold: number
  order: number
}

interface ConditionGroup {
  id: string
  operator: "AND" | "OR"
  order: number
  conditions: Condition[]
}

interface EditingRule {
  id: string
  name: string
  description?: string
  action: string
  actionValue?: string
  conditionGroups?: Array<{
    id: string
    operator: string
    order: number
    conditions: Array<{
      id: string
      metric: string
      operator: string
      threshold: number
      order: number
    }>
  }>
}

interface RuleBuilderProps {
  onSave: (rule: {
    name: string
    description?: string
    action: string
    actionValue?: string
    conditionGroups: ConditionGroup[]
  }) => void
  onCancel: () => void
  editingRule?: EditingRule
}

export function RuleBuilder({ onSave, onCancel, editingRule }: RuleBuilderProps) {
  const [ruleName, setRuleName] = useState(editingRule?.name ?? "")
  const [ruleDescription, setRuleDescription] = useState(editingRule?.description ?? "")
  const [selectedAction, setSelectedAction] = useState(editingRule?.action ?? "")
  const [actionValue, setActionValue] = useState(editingRule?.actionValue ?? "")
  const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>(() => {
    if (editingRule?.conditionGroups && editingRule.conditionGroups.length > 0) {
      return editingRule.conditionGroups.map((group, groupIndex) => ({
        id: group.id ?? `group-${groupIndex}`,
        operator: (group.operator as "AND" | "OR") ?? "AND",
        order: group.order ?? groupIndex,
        conditions: group.conditions?.map((condition, conditionIndex) => ({
          id: condition.id ?? `condition-${conditionIndex}`,
          metric: condition.metric ?? "spend",
          operator: condition.operator ?? "gt",
          threshold: condition.threshold ?? 1000,
          order: condition.order ?? conditionIndex,
        })) ?? [{
          id: "condition-1",
          metric: "spend",
          operator: "gt",
          threshold: 1000,
          order: 0,
        }],
      }))
    }
    return [{
      id: "group-1",
      operator: "AND",
      order: 0,
      conditions: [
        {
          id: "condition-1",
          metric: "spend",
          operator: "gt",
          threshold: 1000,
          order: 0,
        },
      ],
    }]
  })

  // Fetch available options
  const { data: metrics } = api.automation.getAvailableMetrics.useQuery()
  const { data: actions } = api.automation.getAvailableActions.useQuery()

  const addConditionGroup = () => {
    const newGroup: ConditionGroup = {
      id: `group-${Date.now()}`,
      operator: "AND",
      order: conditionGroups.length,
      conditions: [
        {
          id: `condition-${Date.now()}`,
          metric: "spend",
          operator: "gt",
          threshold: 1000,
          order: 0,
        },
      ],
    }
    setConditionGroups([...conditionGroups, newGroup])
  }

  const addCondition = (groupId: string) => {
    setConditionGroups(
      conditionGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            conditions: [
              ...group.conditions,
              {
                id: `condition-${Date.now()}`,
                metric: "spend",
                operator: "gt",
                threshold: 1000,
                order: group.conditions.length,
              },
            ],
          }
        }
        return group
      })
    )
  }

  const removeCondition = (groupId: string, conditionId: string) => {
    setConditionGroups(
      conditionGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            conditions: group.conditions.filter((c) => c.id !== conditionId),
          }
        }
        return group
      })
    )
  }

  const updateCondition = (groupId: string, conditionId: string, field: keyof Condition, value: string | number) => {
    setConditionGroups(
      conditionGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            conditions: group.conditions.map((condition) => {
              if (condition.id === conditionId) {
                return { ...condition, [field]: value }
              }
              return condition
            }),
          }
        }
        return group
      })
    )
  }

  const updateGroupOperator = (groupId: string, operator: "AND" | "OR") => {
    setConditionGroups(
      conditionGroups.map((group) => {
        if (group.id === groupId) {
          return { ...group, operator }
        }
        return group
      })
    )
  }

  const removeGroup = (groupId: string) => {
    if (conditionGroups.length > 1) {
      setConditionGroups(conditionGroups.filter((group) => group.id !== groupId))
    }
  }

  const handleSave = () => {
    if (!ruleName.trim()) {
      toast.error("Rule name is required")
      return
    }

    if (!selectedAction) {
      toast.error("Please select an action")
      return
    }

    // Validate that each group has at least one condition
    const hasValidGroups = conditionGroups.every((group) => group.conditions.length > 0)
    if (!hasValidGroups) {
      toast.error("Each condition group must have at least one condition")
      return
    }

    onSave({
      name: ruleName,
      description: ruleDescription ?? undefined,
      action: selectedAction,
      actionValue: actionValue ?? undefined,
      conditionGroups,
    })
  }


  return (
    <div className="space-y-6">
      {/* Rule Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Create Automation Rule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium">Rule Name</label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g., Pause campaign when CTR drops"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <textarea
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                placeholder="Describe what this rule does..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">When conditions are met:</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Select an action</option>
                {actions?.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
            {selectedAction && (
              <div>
                <label className="text-sm font-medium">Action Value (Optional)</label>
                <input
                  type="text"
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  placeholder="e.g., 50 for budget increase amount"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conditionGroups.map((group, groupIndex) => (
              <div key={group.id} className="relative">
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{group.operator}</Badge>
                    <span className="text-sm text-gray-600">Group {groupIndex + 1}</span>
                  </div>
                  {conditionGroups.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGroup(group.id)}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Group Operator Toggle */}
                <div className="mb-3">
                  <div className="flex gap-2">
                    <Button
                      variant={group.operator === "AND" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateGroupOperator(group.id, "AND")}
                    >
                      AND
                    </Button>
                    <Button
                      variant={group.operator === "OR" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateGroupOperator(group.id, "OR")}
                    >
                      OR
                    </Button>
                  </div>
                </div>

                {/* Conditions */}
                <div className="space-y-3">
                  {group.conditions.map((condition) => (
                    <div key={condition.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <GripVertical className="h-4 w-4 text-gray-400" />

                      <select
                        value={condition.metric}
                        onChange={(e) => updateCondition(group.id, condition.id, "metric", e.target.value)}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                      >
                        {metrics?.map((metric) => (
                          <option key={metric.value} value={metric.value}>
                            {metric.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(group.id, condition.id, "operator", e.target.value)}
                        className="w-24 rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="gt">&gt;</option>
                        <option value="lt">&lt;</option>
                        <option value="eq">=</option>
                        <option value="gte">≥</option>
                        <option value="lte">≤</option>
                      </select>

                      <input
                        type="number"
                        value={condition.threshold}
                        onChange={(e) => updateCondition(group.id, condition.id, "threshold", parseFloat(e.target.value))}
                        className="w-32 rounded-md border border-gray-300 px-3 py-2"
                        step="0.01"
                      />

                      {group.conditions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(group.id, condition.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCondition(group.id)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addConditionGroup}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Condition Group
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1">
          Create Rule
        </Button>
      </div>
    </div>
  )
}