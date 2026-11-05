import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SidebarInset, SidebarProvider } from "@artek/ui/components/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { loadActor, NotSignedIn } from "@/lib/guard";
import { can } from "@/lib/permissions";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const actor = await loadActor(await headers()).catch((error) => {
    if (error instanceof NotSignedIn) redirect("/giris");
    throw error;
  });
  const defaultOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        className="print:hidden"
        user={{ name: actor.name, email: actor.email }}
        allowed={{ notifications: can(actor, "notifications.manage"), users: can(actor, "users.manage"), finance: can(actor, "finance.view"), crm: can(actor, "crm.view"), activity: can(actor, "activity.view") }}
      />
      {/* Only the content area scrolls, never the whole screen. */}
      <SidebarInset className="h-svh min-w-0 overflow-hidden print:h-auto print:overflow-visible">
        <AppHeader />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 print:overflow-visible">
          <NuqsAdapter>{children}</NuqsAdapter>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
