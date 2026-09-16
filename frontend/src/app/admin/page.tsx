"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatsCard from "@/components/StatsCard";
import OrderCard from "@/components/OrderCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AdminDashboard } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";
import {
  ShoppingCart,
  Store,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const STATUS_CHART_COLORS: Record<string, string> = {
  ALLOCATED: "#10b981",
  DELIVERED: "#6366f1",
  PENDING: "#f59e0b",
  UNALLOCATED: "#ef4444",
  CANCELLED: "#64748b",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AdminDashboard>("/admin/dashboard")
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <Navbar />
        <div className="page-wrapper flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!data) return null;

  const { summary, status_distribution, branch_workload, recent_orders } = data;
  const pieData = status_distribution.filter((d) => d.count > 0);

  return (
    <ProtectedRoute requireAdmin>
      <Navbar />
      <div className="page-wrapper">
        <div className="container-main">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">System overview and analytics</p>
          </div>

          {/* Primary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatsCard label="Total Orders" value={summary.total_orders} icon={ShoppingCart} iconColor="text-indigo-400" />
            <StatsCard label="Total Revenue" value={formatCurrency(summary.total_revenue)} icon={DollarSign} iconColor="text-emerald-400" />
            <StatsCard label="Total Customers" value={summary.total_customers} icon={Users} iconColor="text-cyan-400" />
            <StatsCard label="Active Branches" value={summary.total_branches} icon={Store} iconColor="text-violet-400" />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard label="Allocated" value={summary.allocated_orders} icon={CheckCircle} iconColor="text-emerald-400" />
            <StatsCard label="Delivered" value={summary.delivered_orders} icon={Package} iconColor="text-indigo-400" />
            <StatsCard label="Unallocated" value={summary.unallocated_orders} icon={XCircle} iconColor="text-red-400" description="Needs attention" />
            <StatsCard label="Pending" value={summary.pending_orders} icon={Clock} iconColor="text-yellow-400" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Status Distribution Pie */}
            <div className="glass-card p-5">
              <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Order Status Distribution
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_CHART_COLORS[entry.status] || "#64748b"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f1424", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", color: "#f1f5f9", fontSize: "12px" }}
                    formatter={(value, name) => [value, name]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ color: "#94a3b8", fontSize: "11px" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Branch Workload Bar */}
            <div className="glass-card p-5">
              <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-violet-400" />
                Branch Workload (Active Orders)
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={branch_workload} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis
                    dataKey="city"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0f1424", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", color: "#f1f5f9", fontSize: "12px" }}
                  />
                  <Bar dataKey="active_orders" fill="#6366f1" radius={[4, 4, 0, 0]} name="Active Orders" />
                  <Bar dataKey="total_orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Total Orders" opacity={0.4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              Recent Orders
            </h2>
            <div className="space-y-3">
              {recent_orders.map((order) => (
                <OrderCard key={order.id} order={order} showCustomer />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
