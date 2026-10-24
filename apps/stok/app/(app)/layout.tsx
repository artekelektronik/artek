import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SidebarInset, SidebarProvider } from "@artek/ui/components/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) redirect("/giris");
  const actor = await loadActor(requestHeaders);
  // The sidebar remembers whether it was collapsed.
  const defaultOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        className="print:hidden"
        user={{ name: session.user.name, email: session.user.email }}
        allowed={{ notifications: can(actor, "notifications.manage"), users: can(actor, "users.manage") }}
      />
      <SidebarInset className="min-w-0">
        <AppHeader />
        <main className="min-w-0 flex-1 p-6">
          {/* Data tables keep their filters, sorting and page in the URL. */}
          <NuqsAdapter>{children}</NuqsAdapter>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
