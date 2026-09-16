"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  LogOut,
  Users,
  Store,
  Box,
  ChevronDown,
  Bell,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isAdmin = user?.role === "ADMIN";
  const isBranchManager = user?.role === "BRANCH_MANAGER";
  
  const getDashboardLink = () => {
    if (isAdmin) return "/admin";
    if (isBranchManager) return "/branch-dashboard";
    return "/dashboard";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-[#0a0d1a]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={getDashboardLink()} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-wide">
            Order<span className="text-indigo-400">Alloc</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {isAdmin ? (
            <>
              <NavLink href="/admin" icon={<LayoutDashboard className="w-4 h-4" />} label="Admin Dashboard" />
              <NavLink href="/admin/orders" icon={<ShoppingCart className="w-4 h-4" />} label="Orders" />
              <NavLink href="/admin/branches" icon={<Store className="w-4 h-4" />} label="Branches" />
              <NavLink href="/admin/products" icon={<Box className="w-4 h-4" />} label="Products" />
            </>
          ) : isBranchManager ? (
            <>
              <NavLink href="/branch-dashboard" icon={<Store className="w-4 h-4" />} label="Branch Operations" />
            </>
          ) : (
            <>
              <NavLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
              <NavLink href="/orders" icon={<ShoppingCart className="w-4 h-4" />} label="My Orders" />
              <NavLink href="/orders/new" icon={<Package className="w-4 h-4" />} label="Place Order" />
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-xs font-medium leading-tight">{user?.full_name}</p>
              <p className="text-slate-400 text-[10px] leading-tight capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all text-sm font-medium"
    >
      {icon}
      {label}
    </Link>
  );
}
