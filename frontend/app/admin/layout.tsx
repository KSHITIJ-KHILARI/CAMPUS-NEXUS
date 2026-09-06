import { requireRoleServer } from "@/lib/server-auth";
import AdminNav from "@/components/layout/admin-nav";
import { NotificationProvider } from "@/components/ui/notification-center";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRoleServer(["admin", "super_admin"]);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-campus-darker flex flex-col md:flex-row">
        <AdminNav />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-screen">
          {children}
        </main>
      </div>
    </NotificationProvider>
  );
}