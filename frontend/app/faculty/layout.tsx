import { requireRoleServer } from "@/lib/server-auth";
import FacultyNav from "@/components/layout/faculty-nav";
import { NotificationProvider } from "@/components/ui/notification-center";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRoleServer("faculty");

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-campus-darker flex flex-col md:flex-row">
        <FacultyNav />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 min-h-screen min-w-0">
          {children}
        </main>
      </div>
    </NotificationProvider>
  );
}