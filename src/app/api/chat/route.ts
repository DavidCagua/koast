import { openai } from '@ai-sdk/openai';
import {
  streamText,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
import type { UIMessage } from 'ai';
import { z } from 'zod';
import { db } from "~/server/db"
import { env } from "~/env"

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json() as { messages: UIMessage[] };
  const { messages } = body;

  // Check if OpenAI API key is configured
  if (!env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OpenAI API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let syncTriggered = false;

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: [
      {
        role: 'system',
        content: `You are Koast AI Assistant, a helpful AI assistant for the Koast automation platform. You help users with:

1. Campaign Performance Analysis - You can access real campaign data including spend, clicks, reach, impressions, CTR, CPC, and other metrics
2. Automation Rules Management - You can view automation rules, their conditions, and recent actions
3. Action Logs - You can show recent automation actions that were triggered
4. Data Sync - You can manually trigger campaign data sync from Meta Ads API

When users ask about campaign performance, automation rules, or recent actions, use the appropriate tools to provide accurate, real-time information. Be helpful, concise, and provide actionable insights when possible.

Always format numbers nicely (e.g., $1,234.56 for spend, 1.23% for CTR) and provide context about what the metrics mean.`
      },
      ...convertToModelMessages(messages)
    ],
    stopWhen: stepCountIs(5),
    tools: {
      getCampaignData: tool({
        description: 'Get the latest campaign performance data including spend, clicks, reach, impressions, and other metrics',
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const campaign = await db.campaign.findFirst({
              orderBy: { syncedAt: "desc" },
            });

            if (!campaign) {
              return {
                error: "No campaign data found. Please sync campaign data first.",
                lastSynced: null,
              };
            }

            return {
              campaignId: campaign.campaignId,
              name: campaign.name,
              spend: campaign.spend,
              clicks: campaign.clicks,
              reach: campaign.reach,
              impressions: campaign.impressions,
              inlineLinkClicks: campaign.inlineLinkClicks,
              costPerInlineLinkClick: campaign.costPerInlineLinkClick,
              frequency: campaign.frequency,
              cpc: campaign.cpc,
              ctr: campaign.ctr,
              lastSynced: campaign.syncedAt,
            };
          } catch (error) {
            return {
              error: "Failed to fetch campaign data",
              details: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),

      getAutomationRules: tool({
        description: 'Get all automation rules with their conditions and actions',
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const rules = await db.automationRule.findMany({
              include: {
                conditionGroups: {
                  include: {
                    conditions: true,
                  },
                },
                actionLogs: {
                  take: 5,
                  orderBy: { triggeredAt: "desc" },
                },
              },
              orderBy: { createdAt: "desc" },
            });

            return {
              rules: rules.map(rule => ({
                id: rule.id,
                name: rule.name,
                description: rule.description,
                isActive: rule.isActive,
                action: rule.action,
                actionValue: rule.actionValue,
                triggerCount: rule.triggerCount,
                lastTriggered: rule.lastTriggered,
                conditionGroups: rule.conditionGroups.map(group => ({
                  operator: group.operator,
                  conditions: group.conditions.map(condition => ({
                    metric: condition.metric,
                    operator: condition.operator,
                    threshold: condition.threshold,
                  })),
                })),
                recentActions: rule.actionLogs.map(log => ({
                  action: log.action,
                  status: log.status,
                  triggeredAt: log.triggeredAt,
                })),
              })),
            };
          } catch (error) {
            return {
              error: "Failed to fetch automation rules",
              details: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),

      getActionLogs: tool({
        description: 'Get recent action logs showing when automation rules were triggered',
        inputSchema: z.object({
          limit: z.number().optional().describe('Number of recent logs to fetch (default: 10)'),
        }),
        execute: async ({ limit = 10 }) => {
          try {
            const logs = await db.actionLog.findMany({
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
                  },
                },
              },
              orderBy: { triggeredAt: "desc" },
              take: limit,
            });

            return {
              logs: logs.map(log => ({
                id: log.id,
                ruleName: log.rule.name,
                action: log.action,
                actionValue: log.actionValue,
                status: log.status,
                campaignName: log.campaign.name,
                triggeredAt: log.triggeredAt,
                completedAt: log.completedAt,
                metrics: {
                  spend: log.spend,
                  clicks: log.clicks,
                  reach: log.reach,
                  impressions: log.impressions,
                  ctr: log.ctr,
                  cpc: log.cpc,
                },
              })),
            };
          } catch (error) {
            return {
              error: "Failed to fetch action logs",
              details: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),

      syncCampaignData: tool({
        description: 'Manually trigger a campaign data sync from the Meta Ads API',
        inputSchema: z.object({}),
        execute: async () => {
          try {
            // Import the sync service
            const { syncCampaignData } = await import("~/lib/sync-service");

            const result = await syncCampaignData();
            syncTriggered = true;

            return {
              success: result.success,
              message: "Campaign data synced successfully",
              executedActions: result.executedActions,
            };
          } catch (error) {
            return {
              success: false,
              error: "Failed to sync campaign data",
              details: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),
    },
  });

  const response = result.toUIMessageStreamResponse();

  // Add custom header if sync was triggered
  if (syncTriggered) {
    const headers = new Headers(response.headers);
    headers.set('X-Sync-Triggered', 'true');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}