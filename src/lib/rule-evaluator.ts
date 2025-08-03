import { db } from "~/server/db"

interface CampaignData {
  spend: number
  clicks: number
  reach: number
  impressions: number
  inlineLinkClicks: number
  costPerInlineLinkClick: number
  frequency: number
  cpc: number
  ctr: number
}

interface Condition {
  metric: string
  operator: string
  threshold: number
}

interface ConditionGroup {
  operator: string
  conditions: Condition[]
}

interface AutomationRule {
  id: string
  name: string
  action: string
  actionValue: string | null
  conditionGroups: ConditionGroup[]
}

// Evaluate a single condition
function evaluateCondition(condition: Condition, campaignData: CampaignData): boolean {
  const value = campaignData[condition.metric as keyof CampaignData]

  switch (condition.operator) {
    case "gt":
      return value > condition.threshold
    case "lt":
      return value < condition.threshold
    case "eq":
      return value === condition.threshold
    case "gte":
      return value >= condition.threshold
    case "lte":
      return value <= condition.threshold
    default:
      return false
  }
}

// Evaluate a condition group
function evaluateConditionGroup(group: ConditionGroup, campaignData: CampaignData): boolean {
  const results = group.conditions.map(condition => evaluateCondition(condition, campaignData))

  if (group.operator === "AND") {
    return results.every(result => result)
  } else {
    return results.some(result => result)
  }
}

// Evaluate a complete rule
export function evaluateRule(rule: AutomationRule, campaignData: CampaignData): boolean {
  // If no condition groups, rule doesn't trigger
  if (!rule.conditionGroups || rule.conditionGroups.length === 0) {
    return false
  }

  // Evaluate each condition group
  const groupResults = rule.conditionGroups.map(group =>
    evaluateConditionGroup(group, campaignData)
  )

  // Rule triggers if ANY condition group is true (OR logic between groups)
  return groupResults.some(result => result)
}

// Execute a mock action
export async function executeMockAction(rule: AutomationRule, campaignData: CampaignData, campaignId: string) {
  console.log(`🎯 Executing mock action: ${rule.action} for rule: ${rule.name}`)

  // Check if this action was already applied to this campaign
  // Some actions can be repeated (like notifications), others cannot (like pause)
  const nonRepeatableActions = ["pause_campaign", "increase_budget", "decrease_budget"]
  const isNonRepeatable = nonRepeatableActions.includes(rule.action)

  if (isNonRepeatable) {
    const existingAction = await db.actionLog.findFirst({
      where: {
        ruleId: rule.id,
        campaignId: campaignId,
        action: rule.action,
        status: "success",
      },
      orderBy: {
        triggeredAt: "desc",
      },
    })

    if (existingAction) {
      console.log(`⏭️ Non-repeatable action "${rule.action}" already applied to campaign, skipping...`)
      return null
    }
  }

  // Simulate action execution
  const actionValue = rule.actionValue ?? "default"

  // Log the action
  const actionLog = await db.actionLog.create({
    data: {
      ruleId: rule.id,
      action: rule.action,
      actionValue: actionValue,
      status: "success", // Mock actions always succeed
      campaignId: campaignId,
      // Log current campaign metrics
      spend: campaignData.spend,
      clicks: campaignData.clicks,
      reach: campaignData.reach,
      impressions: campaignData.impressions,
      inlineLinkClicks: campaignData.inlineLinkClicks,
      costPerInlineLinkClick: campaignData.costPerInlineLinkClick,
      frequency: campaignData.frequency,
      cpc: campaignData.cpc,
      ctr: campaignData.ctr,
      triggeredAt: new Date(),
      completedAt: new Date(), // Mock actions complete immediately
    },
  })

  // Update rule trigger count and last triggered
  await db.automationRule.update({
    where: { id: rule.id },
    data: {
      triggerCount: { increment: 1 },
      lastTriggered: new Date(),
    },
  })

  console.log(`✅ Mock action logged: ${actionLog.id}`)
  return actionLog
}

// Check and execute all active rules
export async function checkAndExecuteRules(campaignData: CampaignData, campaignId: string) {
  console.log("🔍 Checking automation rules...")

  // Get all active rules with their condition groups
  const activeRules = await db.automationRule.findMany({
    where: { isActive: true },
    include: {
      conditionGroups: {
        include: {
          conditions: true,
        },
      },
    },
  })

  console.log(`📋 Found ${activeRules.length} active rules`)

  const executedActions = []

  for (const rule of activeRules) {
    try {
      const shouldTrigger = evaluateRule(rule, campaignData)

      if (shouldTrigger) {
        console.log(`🚨 Rule "${rule.name}" triggered!`)
        const actionLog = await executeMockAction(rule, campaignData, campaignId)
        if (actionLog) {
          executedActions.push(actionLog)
        }
      }
    } catch (error) {
      console.error(`❌ Error evaluating rule "${rule.name}":`, error)
    }
  }

  console.log(`✅ Executed ${executedActions.length} actions`)
  return executedActions
}