"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { User } from "@/lib/types";
import { ROUTES } from "@/lib/constants";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const syncToken = () => {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser) as User);
        } catch {
          setUser(null);
        }
      }
    };

    syncToken();
    window.addEventListener("auth:token-refreshed", syncToken);
    return () => {
      window.removeEventListener("auth:token-refreshed", syncToken);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("auth_token");
      if (storedToken) {
        try {
          setToken(storedToken);
          const userData = await api.auth.verify();
          setUser(userData as User);
        } catch {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response: any = await api.auth.login({ email, password });
      const authToken = response.access_token || response.token;
      const userData = response.user;

      if (!authToken) {
        throw new Error("No authentication token returned from server");
      }

      localStorage.setItem("auth_token", authToken);
      if (response.refresh_token) {
        localStorage.setItem("refresh_token", response.refresh_token);
      }
      localStorage.setItem("auth_user", JSON.stringify(userData));
      setToken(authToken);
      setUser(userData as User);

      document.cookie = `nexus_token=${authToken}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;

      const role = (userData as User).role;
      if (role === "student") {
        router.push(ROUTES.STUDENT.DASHBOARD);
      } else if (role === "faculty") {
        router.push(ROUTES.FACULTY.DASHBOARD);
      } else {
        router.push(ROUTES.ADMIN.DASHBOARD);
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      //
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("auth_user");
        document.cookie = "nexus_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        window.dispatchEvent(new Event("auth:logout"));
      }
      setToken(null);
      setUser(null);
      router.push(ROUTES.AUTH.LOGIN);
    }
  };

  const refresh = async () => {
    try {
      const refreshTokenVal = localStorage.getItem("refresh_token");
      if (!refreshTokenVal) throw new Error("No refresh token available");
      const response = await api.auth.refresh(refreshTokenVal);
      const newToken = response.access_token;
      localStorage.setItem("auth_token", newToken);
      if (response.refresh_token) {
        localStorage.setItem("refresh_token", response.refresh_token);
      }
      document.cookie = `nexus_token=${newToken}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:token-refreshed"));
      }
      setToken(newToken);
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("auth_user");
        document.cookie = "nexus_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        window.dispatchEvent(new Event("auth:logout"));
      }
      setToken(null);
      setUser(null);
      router.push(ROUTES.AUTH.LOGIN);
    }
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "super_admin") return true;
    return false;
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    refresh,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthGuard({
  children,
  requiredRole,
  fallback,
}: {
  children: ReactNode;
  requiredRole?: string | string[];
  fallback?: ReactNode;
}) {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(ROUTES.AUTH.LOGIN);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="border-brand-600 border-t-transparent h-12 w-12 animate-spin rounded-full border-4"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    if (fallback) return <>{fallback}</>;
    router.push(ROUTES.AUTH.LOGIN);
    return null;
  }

  return <>{children}</>;
}
