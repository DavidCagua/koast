import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc"
import { db } from "~/server/db"
import { checkAndExecuteRules } from "~/lib/rule-evaluator"

// Validation schemas for new AND/OR logic
const conditionSchema = z.object({
  metric: z.enum(["spend", "clicks", "reach", "impressions", "inlineLinkClicks", "costPerInlineLinkClick", "frequency", "cpc", "ctr"]),
  operator: z.enum(["gt", "lt", "eq", "gte", "lte"]),
  threshold: z.number().positive("Threshold must be positive"),
  order: z.number().int().min(0),
})

const conditionGroupSchema = z.object({
  operator: z.enum(["AND", "OR"]),
  order: z.number().int().min(0),
  conditions: z.array(conditionSchema),
})

const createRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  description: z.string().optional(),
  action: z.enum(["pause_campaign", "increase_budget", "decrease_budget", "send_notification"]),
  actionValue: z.string().optional(),
  conditionGroups: z.array(conditionGroupSchema).min(1, "At least one condition group is required"),
})

const updateRuleSchema = createRuleSchema.partial().extend({
  id: z.string(),
  isActive: z.boolean().optional(),
})

export const automationRouter = createTRPCRouter({
  // Get all automation rules with condition groups
  getRules: publicProcedure.query(async () => {
    const rules = await db.automationRule.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        conditionGroups: {
          orderBy: { order: "asc" },
          include: {
            conditions: {
              orderBy: { order: "asc" },
            },
          },
        },
        _count: {
          select: {
            actionLogs: true,
          },
        },
      },
    })
    return rules
  }),

  // Get a single rule with full details
  getRule: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const rule = await db.automationRule.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          conditionGroups: {
            orderBy: { order: "asc" },
            include: {
              conditions: {
                orderBy: { order: "asc" },
              },
            },
          },
          actionLogs: {
            orderBy: { triggeredAt: "desc" },
            take: 10,
          },
        },
      })
      return rule
    }),

  // Create a new rule with condition groups
  createRule: publicProcedure
    .input(createRuleSchema)
    .mutation(async ({ input }) => {
      // Create or find a mock user for now
      let mockUser = await db.user.findUnique({
        where: { id: "mock-user-id" },
      })

      if (!mockUser) {
        mockUser = await db.user.create({
          data: {
            id: "mock-user-id",
            name: "Demo User",
            email: "demo@koast.ai",
          },
        })
      }

      // Create rule with condition groups and conditions
      const rule = await db.automationRule.create({
        data: {
          name: input.name,
          description: input.description,
          action: input.action,
          actionValue: input.actionValue,
          createdById: mockUser.id,
          conditionGroups: {
            create: input.conditionGroups.map((group) => ({
              operator: group.operator,
              order: group.order,
              conditions: {
                create: group.conditions.map((condition) => ({
                  metric: condition.metric,
                  operator: condition.operator,
                  threshold: condition.threshold,
                  order: condition.order,
                })),
              },
            })),
          },
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          conditionGroups: {
            include: {
              conditions: true,
            },
          },
        },
      })
      return rule
    }),

  // Update a rule
  updateRule: publicProcedure
    .input(updateRuleSchema)
    .mutation(async ({ input }) => {
      const { id, conditionGroups, ...ruleData } = input

      // If condition groups are provided, replace all existing ones
      if (conditionGroups) {
        // Delete existing condition groups (cascades to conditions)
        await db.conditionGroup.deleteMany({
          where: { ruleId: id },
        })

        // Create new condition groups
        await db.automationRule.update({
          where: { id },
          data: {
            ...ruleData,
            conditionGroups: {
              create: conditionGroups.map((group) => ({
                operator: group.operator,
                order: group.order,
                conditions: {
                  create: group.conditions.map((condition) => ({
                    metric: condition.metric,
                    operator: condition.operator,
                    threshold: condition.threshold,
                    order: condition.order,
                  })),
                },
              })),
            },
          },
        })
      } else {
        // Update only rule data
        await db.automationRule.update({
          where: { id },
          data: ruleData,
        })
      }

      return await db.automationRule.findUnique({
        where: { id },
        include: {
          conditionGroups: {
            include: {
              conditions: true,
            },
          },
        },
      })
    }),

  // Delete a rule
  deleteRule: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.automationRule.delete({
        where: { id: input.id },
      })
      return { success: true }
    }),

  // Toggle rule active status
  toggleRule: publicProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const rule = await db.automationRule.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      })
      return rule
    }),

  // Manual rule execution for testing
  executeRules: publicProcedure
    .input(z.object({
      campaignData: z.object({
        spend: z.number(),
        clicks: z.number(),
        reach: z.number(),
        impressions: z.number(),
        inlineLinkClicks: z.number(),
        costPerInlineLinkClick: z.number(),
        frequency: z.number(),
        cpc: z.number(),
        ctr: z.number(),
      }),
    }))
    .mutation(async ({ input }) => {
      // Get the latest campaign for the campaignId
      const campaign = await db.campaign.findFirst({
        orderBy: { syncedAt: "desc" },
      })

      if (!campaign) {
        throw new Error("No campaign found")
      }

      const executedActions = await checkAndExecuteRules(input.campaignData, campaign.id)

      return {
        success: true,
        executedActions: executedActions.length,
        actions: executedActions,
      }
    }),

  // Get action logs
  getActionLogs: publicProcedure
    .input(z.object({
      ruleId: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const logs = await db.actionLog.findMany({
        where: input.ruleId ? { ruleId: input.ruleId } : undefined,
        orderBy: { triggeredAt: "desc" },
        take: input.limit,
        include: {
          rule: {
            select: {
              name: true,
              action: true,
            },
          },
          campaign: {
            select: {
              name: true,
              campaignId: true,
            },
          },
        },
      })
      return logs
    }),

  // Get available metrics for conditions
  getAvailableMetrics: publicProcedure.query(() => {
    return [
      { value: "spend", label: "Spend" },
      { value: "clicks", label: "Clicks" },
      { value: "reach", label: "Reach" },
      { value: "impressions", label: "Impressions" },
      { value: "inlineLinkClicks", label: "Link Clicks" },
      { value: "costPerInlineLinkClick", label: "Cost per Link Click" },
      { value: "frequency", label: "Frequency" },
      { value: "cpc", label: "Cost per Click" },
      { value: "ctr", label: "CTR" },
    ]
  }),

  // Get available actions
  getAvailableActions: publicProcedure.query(() => {
    return [
      { value: "pause_campaign", label: "Pause Campaign" },
      { value: "increase_budget", label: "Increase Budget" },
      { value: "decrease_budget", label: "Decrease Budget" },
      { value: "send_notification", label: "Send Notification" },
    ]
  }),

  // Get available operators
  getAvailableOperators: publicProcedure.query(() => {
    return [
      { value: "gt", label: "Greater than (>)" },
      { value: "lt", label: "Less than (<)" },
      { value: "eq", label: "Equal to (=)" },
      { value: "gte", label: "Greater than or equal (≥)" },
      { value: "lte", label: "Less than or equal (≤)" },
    ]
  }),

  // Get available group operators
  getAvailableGroupOperators: publicProcedure.query(() => {
    return [
      { value: "AND", label: "AND (All conditions must be true)" },
      { value: "OR", label: "OR (Any condition can be true)" },
    ]
  }),
})