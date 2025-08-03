import { AutomationHeader } from "./components/automation-header"
import { AutomationRulesList } from "./components/automation-rules-list"
import { ActionLogsList } from "./components/action-logs-list"

export default function AutomationPage() {
  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <AutomationHeader />

      {/* Rules List */}
      <AutomationRulesList />

      {/* Action Logs */}
      <ActionLogsList />
    </div>
  )
}