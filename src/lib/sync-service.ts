import { db } from "~/server/db"
import { env } from "~/env"
import { checkAndExecuteRules } from "~/lib/rule-evaluator"

interface MetaAdsResponse {
  data: Array<{
    spend?: string
    clicks?: string
    reach?: string
    impressions?: string
    inline_link_clicks?: string
    cost_per_inline_link_click?: string
    frequency?: string
    cpc?: string
    ctr?: string
  }>
}

export async function syncCampaignData() {
  try {
    // Check if API token is available
    if (!env.META_API_TOKEN) {
      throw new Error("Meta API token not configured. Please add META_API_TOKEN to your .env file.")
    }

    // Fetch data from Meta Ads API proxy with all available fields
    const response = await fetch(
      "https://dev-api.adcopy.ai/challenge-proxy/meta/120231398059670228/insights?fields=inline_link_clicks,cost_per_inline_link_click,reach,frequency,cpc,spend,clicks,impressions,ctr",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.META_API_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch campaign data: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json() as MetaAdsResponse
    console.log("API Response:", data)

    // Extract the first data point (assuming it's an array)
    const insights = Array.isArray(data.data) ? data.data[0] : data.data

    if (!insights) {
      throw new Error("No campaign data found in response")
    }

    // Parse the metrics - use all available fields
    const campaignData = {
      campaignId: "120231398059670228",
      name: "Meta Ads Campaign",
      spend: parseFloat(insights.spend ?? "0"),
      clicks: parseInt(insights.clicks ?? "0"),
      reach: parseInt(insights.reach ?? "0"),
      impressions: parseInt(insights.impressions ?? "0"),
      inlineLinkClicks: parseInt(insights.inline_link_clicks ?? "0"),
      costPerInlineLinkClick: parseFloat(insights.cost_per_inline_link_click ?? "0"),
      frequency: parseFloat(insights.frequency ?? "0"),
      cpc: parseFloat(insights.cpc ?? "0"),
      ctr: parseFloat(insights.ctr ?? "0"),
      syncedAt: new Date(),
    }

    // Upsert campaign data (create or update)
    const campaign = await db.campaign.upsert({
      where: { campaignId: campaignData.campaignId },
      update: {
        ...campaignData,
        updatedAt: new Date(),
      },
      create: campaignData,
    })

    console.log("✅ Campaign data synced successfully")

    // Check and execute automation rules
    console.log("🤖 Checking automation rules...")
    const executedActions = await checkAndExecuteRules(campaignData, campaign.id)

    if (executedActions.length > 0) {
      console.log(`🎯 Executed ${executedActions.length} automation actions`)
    } else {
      console.log("📋 No automation rules triggered")
    }

    return {
      success: true,
      campaign,
      executedActions: executedActions.length,
    }

  } catch (error) {
    console.error("Error syncing campaign data:", error)
    throw error
  }
}