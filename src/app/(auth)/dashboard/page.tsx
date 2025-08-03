import { DashboardHeader } from "./components/dashboard-header"
import { CampaignMetrics } from "./components/campaign-metrics"
import { CampaignDetails } from "./components/campaign-details"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header with Sync Button */}
      <DashboardHeader />

      {/* Campaign Metrics */}
      <CampaignMetrics />

      {/* Campaign Details */}
      <CampaignDetails />
    </div>
  )
}