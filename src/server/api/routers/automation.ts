import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc"
import { db } from "~/server/db"

// Validation schemas
const createRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  description: z.string().optional(),
  metric: z.enum(["spend", "clicks", "reach", "impressions", "inlineLinkClicks", "costPerInlineLinkClick", "frequency", "cpc", "ctr"]),
  operator: z.enum(["gt", "lt", "eq", "gte", "lte"]),
  threshold: z.number().positive("Threshold must be positive"),
  action: z.enum(["pause_campaign", "increase_budget", "decrease_budget", "send_notification"]),
  actionValue: z.string().optional(),
})

const updateRuleSchema = createRuleSchema.partial().extend({
  id: z.string(),
  isActive: z.boolean().optional(),
})

export const automationRouter = createTRPCRouter({
  // Get all automation rules
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
        _count: {
          select: {
            actionLogs: true,
          },
        },
      },
    })
    return rules
  }),

  // Get a single rule
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
          actionLogs: {
            orderBy: { triggeredAt: "desc" },
            take: 10,
          },
        },
      })
      return rule
    }),

  // Create a new rule
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

      const rule = await db.automationRule.create({
        data: {
          ...input,
          createdById: mockUser.id,
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
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
      const { id, ...data } = input
      const rule = await db.automationRule.update({
        where: { id },
        data,
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })
      return rule
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

  // Get available metrics for rules
  getAvailableMetrics: publicProcedure.query(() => {
    return [
      { value: "spend", label: "Spend", unit: "USD" },
      { value: "clicks", label: "Clicks", unit: "count" },
      { value: "reach", label: "Reach", unit: "count" },
      { value: "impressions", label: "Impressions", unit: "count" },
      { value: "inlineLinkClicks", label: "Link Clicks", unit: "count" },
      { value: "costPerInlineLinkClick", label: "Cost per Link Click", unit: "USD" },
      { value: "frequency", label: "Frequency", unit: "count" },
      { value: "cpc", label: "Cost per Click", unit: "USD" },
      { value: "ctr", label: "Click-through Rate", unit: "%" },
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
})