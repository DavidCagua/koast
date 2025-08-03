import { cronService } from "./cron-service"

// Initialize cron service
export function initializeCron() {
  // Only start in production or when explicitly enabled
  const shouldStartCron = process.env.NODE_ENV === "production" || process.env.ENABLE_CRON === "true"

  if (shouldStartCron) {
    console.log("🚀 Initializing cron service...")
    cronService.start()
  } else {
    console.log("⏭️ Cron service disabled (set ENABLE_CRON=true to enable in development)")
  }
}

// Export for manual control
export { cronService }