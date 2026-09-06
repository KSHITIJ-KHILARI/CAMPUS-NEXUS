import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { UserRole } from "@/lib/types";
import { ROUTES } from "@/lib/constants";

export function useRole() {
  const { user, isAuthenticated } = useAuth();
  return { user, isAuthenticated, role: user?.role };
}

export function useRequireAuth(requiredRole?: UserRole | UserRole[]) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push(ROUTES.AUTH.LOGIN);
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  useEffect(() => {
    if (auth.isAuthenticated && requiredRole) {
      const hasRole = Array.isArray(requiredRole)
        ? requiredRole.includes(auth.user?.role as UserRole)
        : auth.user?.role === requiredRole;

      if (!hasRole) {
        router.push(ROUTES.AUTH.LOGIN);
      }
    }
  }, [auth.isAuthenticated, auth.user?.role, requiredRole, router]);

  return auth;
}

export function useLogout() {
  const { logout } = useAuth();
  return { logout };
}

export function useProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const checkAccess = useCallback(() => {
    if (isLoading) return false;
    if (!isAuthenticated) {
      router.push(ROUTES.AUTH.LOGIN);
      return false;
    }
    return true;
  }, [isAuthenticated, isLoading, router]);

  return { user, isAuthenticated, isLoading, checkAccess };
}
