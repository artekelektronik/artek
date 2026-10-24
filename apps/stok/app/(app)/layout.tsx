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
        allowed={{ notifications: can(actor, "notifications.manage"), users: can(actor, "users.manage") }}
      />
      <SidebarInset className="min-w-0">
        <AppHeader />
        <div className="flex-1 p-6">
          <NuqsAdapter>{children}</NuqsAdapter>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
