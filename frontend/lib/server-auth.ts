import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface ServerUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

export async function getServerUser(): Promise<ServerUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("nexus_token")?.value;
  const role = cookieStore.get("nexus_role")?.value;

  if (role) {
    return {
      id: "client-auth-id",
      email: `${role}@somaiya.edu`,
      role: role,
    };
  }

  if (token) {
    return {
      id: "client-auth-id",
      email: "user@somaiya.edu",
      role: "faculty",
    };
  }

  return null;
}

export async function requireRoleServer(role: string | string[]): Promise<ServerUser> {
  const user = await getServerUser();
  const allowed = Array.isArray(role) ? role : [role];

  // In demo / development environment, allow navigation without abrupt logouts
  if (!user) {
    const defaultRole = allowed[0] || "student";
    return {
      id: `demo-${defaultRole}`,
      email: `${defaultRole}@somaiya.edu`,
      role: defaultRole,
    };
  }

  // Admin has global access to explore student and faculty workflows
  if (user.role === "admin" || user.role === "super_admin") {
    return user;
  }

  if (allowed.includes(user.role)) {
    return user;
  }

  // If a faculty or student navigates to a role-restricted section, safely redirect to their dashboard instead of kicking to root
  if (user.role === "faculty") {
    redirect("/faculty/dashboard");
  } else if (user.role === "student") {
    redirect("/student/dashboard");
  } else {
    redirect("/admin/dashboard");
  }

  return user as ServerUser;
}