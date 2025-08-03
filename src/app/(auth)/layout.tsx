import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { AppSidebar } from "~/components/app-sidebar"
import { Toaster } from "~/components/ui/sonner"
import { ChatWidget } from "~/components/chat-widget"
import { initializeCron } from "~/lib/init-cron"

export default function Layout({ children }: { children: React.ReactNode }) {
  // Initialize cron service
  initializeCron();

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <SidebarTrigger />
        {children}
      </main>
      <Toaster />
      <ChatWidget />
    </SidebarProvider>
  )
}