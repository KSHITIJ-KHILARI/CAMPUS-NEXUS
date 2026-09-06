import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/server-auth";
import { Footer } from "@/components/ui/footer";

export default async function HomePage() {
  const user = await getServerUser();
  if (user) {
    if (user.role === "admin" || user.role === "super_admin") redirect("/admin/dashboard");
    if (user.role === "faculty") redirect("/faculty/dashboard");
    redirect("/student/dashboard");
  }

  return (
    <div className="min-h-screen bg-campus-darker flex flex-col items-center justify-between">
      <div className="flex-1 flex items-center justify-center max-w-md w-full p-6">
        <div className="w-full space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Campus <span className="text-campus-primary">NEXUS</span>
            </h1>
            <p className="text-gray-400">
              The Intelligence Layer for a Living Campus
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Somaiya Vidyavihar University
            </p>
          </div>

          <div className="glass p-8 space-y-6">
            <h2 className="text-xl font-semibold text-center text-white">
              Welcome to Campus NEXUS
            </h2>
            <p className="text-gray-400 text-center text-sm">
              Your AI-powered campus companion. Navigate, schedule, and stay informed.
            </p>

            <div className="space-y-3">
              <a
                href="/auth/login"
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-campus-primary hover:bg-campus-primary-dark transition-colors shadow-lg"
              >
                Sign In
              </a>
              <div className="text-center text-xs text-gray-500">
                Demo accounts: student@somaiya.edu / faculty@somaiya.edu / admin@somaiya.edu (password: demo123)
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-xs font-medium text-gray-300 mb-3 text-center">Quick Demo Access</h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <a href="/auth/login?role=student" className="p-2 glass-dark rounded-lg text-center hover:bg-white/10 transition-colors">
                  <div className="text-campus-green font-semibold">Student</div>
                </a>
                <a href="/auth/login?role=faculty" className="p-2 glass-dark rounded-lg text-center hover:bg-white/10 transition-colors">
                  <div className="text-campus-blue font-semibold">Faculty</div>
                </a>
                <a href="/auth/login?role=admin" className="p-2 glass-dark rounded-lg text-center hover:bg-white/10 transition-colors">
                  <div className="text-campus-purple font-semibold">Admin</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}