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
  if (!token) return null;

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXUS_API_BASE_URL ||
    "http://localhost:8000/api/v1";
  const baseUrl = apiBase.endsWith("/api/v1") ? apiBase : `${apiBase}/api/v1`;

  try {
    const res = await fetch(`${baseUrl}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const u = data?.user ?? data;
    if (!u?.id) return null;
    return {
      id: String(u.id),
      email: u.email,
      full_name: u.full_name,
      role: String(u.role),
    };
  } catch {
    return null;
  }
}

export async function requireRoleServer(role: string | string[]): Promise<ServerUser> {
  const user = await getServerUser();
  if (!user) redirect("/");
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) redirect("/");
  return user;
}