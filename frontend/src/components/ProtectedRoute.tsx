"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false, requireStaff = false }: Props) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (requireAdmin && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
    if (requireStaff && user.role !== "ADMIN" && user.role !== "BRANCH_MANAGER") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, user, requireAdmin, requireStaff, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (requireAdmin && user.role !== "ADMIN") {
    return null;
  }

  if (requireStaff && user.role !== "ADMIN" && user.role !== "BRANCH_MANAGER") {
    return null;
  }

  return <>{children}</>;
}
