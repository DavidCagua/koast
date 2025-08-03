import { createTRPCRouter, publicProcedure } from "~/server/api/trpc"
import { db } from "~/server/db"
import { syncCampaignData } from "~/lib/sync-service"

export const campaignRouter = createTRPCRouter({
  // Get latest campaign data from database
  getLatest: publicProcedure.query(async () => {
    const campaign = await db.campaign.findFirst({
      orderBy: { syncedAt: "desc" },
    })
    return campaign
  }),

  // Sync campaign data from Meta Ads API proxy
  sync: publicProcedure.mutation(async () => {
    try {
      const result = await syncCampaignData()
      return result.campaign
    } catch (error) {
      console.error("Error syncing campaign data:", error)
      throw new Error(`Failed to sync campaign data: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }),

  // Get campaign with action logs
  getWithActions: publicProcedure.query(async () => {
    const campaign = await db.campaign.findFirst({
      orderBy: { syncedAt: "desc" },
      include: {
        actionLogs: {
          orderBy: { triggeredAt: "desc" },
          take: 5,
          include: {
            rule: {
              select: {
                name: true,
                action: true,
              },
            },
          },
        },
      },
    })
    return campaign
  }),
})