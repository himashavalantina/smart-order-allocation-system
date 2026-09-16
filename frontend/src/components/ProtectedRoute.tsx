"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: Props) {
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
  }, [isAuthenticated, user, requireAdmin, router]);

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

  return <>{children}</>;
}
