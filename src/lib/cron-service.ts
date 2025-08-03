import * as cron from "node-cron"
import { syncCampaignData } from "./sync-service"

class CronService {
  private syncJob: cron.ScheduledTask | null = null
  private isRunning = false

  // Start the cron service
  start() {
    if (this.isRunning) {
      console.log("🔄 Cron service already running")
      return
    }

    console.log("🚀 Starting cron service...")

    // Schedule campaign sync every 5 minutes
    this.syncJob = cron.schedule("*/1 * * * *", () => {
      void this.performScheduledSync()
    }, {
      timezone: "UTC"
    })

    this.isRunning = true
    console.log("✅ Cron service started - Campaign sync scheduled every 1 minute")
  }

  // Stop the cron service
  stop() {
    if (this.syncJob) {
      void this.syncJob.stop()
      this.syncJob = null
    }
    this.isRunning = false
    console.log("⏹️ Cron service stopped")
  }

  // Perform the scheduled sync
  private async performScheduledSync() {
    console.log("🔄 Scheduled campaign sync starting...")

    try {

      // Use the shared sync service
      const result = await syncCampaignData()

      if (result.success) {
        console.log("✅ Scheduled sync completed successfully")
      } else {
        console.error("❌ Scheduled sync failed")
      }

    } catch (error) {
      console.error("💥 Scheduled sync error:", error)
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.syncJob ? new Date(Date.now() + 15 * 60 * 1000) : null,
    }
  }
}

// Create singleton instance
const cronService = new CronService()

export { cronService }