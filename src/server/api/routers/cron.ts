import { createTRPCRouter, publicProcedure } from "../trpc"
import { cronService } from "~/lib/cron-service"

export const cronRouter = createTRPCRouter({
  // Get cron service status
  getStatus: publicProcedure.query(() => {
    return cronService.getStatus()
  }),

  // Start cron service
  start: publicProcedure.mutation(() => {
    cronService.start()
    return { success: true, message: "Cron service started" }
  }),

  // Stop cron service
  stop: publicProcedure.mutation(() => {
    cronService.stop()
    return { success: true, message: "Cron service stopped" }
  }),

    // Trigger manual sync
  triggerSync: publicProcedure.mutation(async () => {
    try {
      const { syncCampaignData } = await import("~/lib/sync-service")
      const result = await syncCampaignData()

      return {
        success: result.success,
        message: "Manual sync completed",
        executedActions: result.executedActions,
      }
    } catch (error) {
      return {
        success: false,
        message: "Manual sync failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }),
})