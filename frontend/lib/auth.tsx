"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import { ROUTES } from "@/lib/constants";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          localStorage.setItem("auth_token", idToken);
          document.cookie = `nexus_token=${idToken}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
          document.cookie = `nexus_uid=${firebaseUser.uid}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;

          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = userData.role || "student";
            document.cookie = `nexus_role=${role}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
            const finalUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || userData.email,
              name: userData.full_name || firebaseUser.email || "User",
              full_name: userData.full_name || "",
              role: userData.role || "student",
              status: "active",
              is_active: userData.is_active ?? true,
              createdAt: userData.created_at || new Date().toISOString(),
              updatedAt: userData.updated_at || new Date().toISOString(),
            };
            setUser(finalUser);
            localStorage.setItem("auth_user", JSON.stringify(finalUser));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        document.cookie = "nexus_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "nexus_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);
      localStorage.setItem("auth_token", idToken);
      document.cookie = `nexus_token=${idToken}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `nexus_uid=${firebaseUser.uid}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      let role = "student";
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        role = userData.role || "student";
        document.cookie = `nexus_role=${role}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
        const finalUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || userData.email,
          name: userData.full_name || firebaseUser.email || "User",
          full_name: userData.full_name || "",
          role: role as any,
          status: "active",
          is_active: userData.is_active ?? true,
          createdAt: userData.created_at || new Date().toISOString(),
          updatedAt: userData.updated_at || new Date().toISOString(),
        };
        setUser(finalUser);
        localStorage.setItem("auth_user", JSON.stringify(finalUser));
      }

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
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        document.cookie = "nexus_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "nexus_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "nexus_uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        window.dispatchEvent(new Event("auth:logout"));
      }
      setToken(null);
      setUser(null);
      router.push(ROUTES.AUTH.LOGIN);
    }
  };

  const refresh = async () => {
    if (auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken(true); // force refresh
        setToken(idToken);
        localStorage.setItem("auth_token", idToken);
        document.cookie = `nexus_token=${idToken}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:token-refreshed"));
        }
      } catch {
        await logout();
      }
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
