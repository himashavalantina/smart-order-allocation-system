"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";
import { Order, PaginatedOrders, Branch } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import AddProductModal from "@/components/AddProductModal";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Activity,
  RefreshCw,
  Box,
  Plus,
  Edit2,
  Trash2,
  Save,
  X
} from "lucide-react";

// Statuses the admin can transition an order to via the PATCH endpoint
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ALLOCATED", "CANCELLED"],
  ALLOCATED: ["PROCESSING", "DELIVERED", "CANCELLED"],
  PROCESSING: ["DELIVERED", "CANCELLED"],
  UNALLOCATED: ["CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function BranchDashboardPage() {
  const { user } = useAuthStore();
  const branchId = user?.branch_id;

  const [orders, setOrders] = useState<Order[]>([]);
  const [branchData, setBranchData] = useState<Branch | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Inventory UI state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInvId, setEditingInvId] = useState<number | null>(null);
  const [editStockValue, setEditStockValue] = useState("");
  const [invLoadingId, setInvLoadingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    try {
      const [ordersRes, branchRes, invRes] = await Promise.all([
        api.get<PaginatedOrders>(`/admin/orders?page_size=100`),
        api.get<Branch>(`/branches/${branchId}`),
        api.get(`/branch/inventory`),
      ]);
      setOrders(ordersRes.data.orders);
      setBranchData(branchRes.data);
      setInventory(invRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStock = async (productId: number) => {
    if (!editStockValue) return;
    setInvLoadingId(productId);
    try {
      await api.patch(`/branch/inventory/${productId}`, {
        stock: parseInt(editStockValue, 10)
      });
      setEditingInvId(null);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setInvLoadingId(null);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to remove this product? It will set stock to 0.")) return;
    setInvLoadingId(productId);
    try {
      await api.delete(`/branch/inventory/${productId}`);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setInvLoadingId(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireStaff>
        <Navbar />
        <div className="page-wrapper flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  // Calculate KPIs
  const activeWorkload = orders.filter(
    (o) => o.status === "ALLOCATED" || o.status === "PROCESSING"
  ).length;
  const completedOrders = orders.filter((o) => o.status === "DELIVERED").length;
  const lowStockItems = inventory.filter((i) => i.quantity === 0) || [];

  return (
    <ProtectedRoute requireStaff>
      <Navbar />
      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchData} 
      />
      <div className="page-wrapper">
        <div className="container-main">
          {/* Header */}
          <div className="mb-8 border-b border-white/10 pb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {branchData?.name || "Branch Dashboard"}
              </h1>
              <p className="text-slate-400 mt-2">Operational Command Center</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span className="text-indigo-100 font-medium text-sm">System Online</span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Active Workload */}
            <div className="glass-card p-6 border-l-4 border-l-orange-500 flex items-start gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Active Workload</p>
                <h3 className="text-3xl font-bold text-white mt-1">{activeWorkload}</h3>
                <p className="text-orange-400/80 text-xs mt-1">Orders in processing</p>
              </div>
            </div>

            {/* Completed Orders */}
            <div className="glass-card p-6 border-l-4 border-l-emerald-500 flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Completed Orders</p>
                <h3 className="text-3xl font-bold text-white mt-1">{completedOrders}</h3>
                <p className="text-emerald-400/80 text-xs mt-1">Successfully delivered</p>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="glass-card p-6 border-l-4 border-l-red-500 flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Out of Stock</p>
                <h3 className="text-3xl font-bold text-white mt-1">{lowStockItems.length}</h3>
                <p className="text-red-400/80 text-xs mt-1">Requires replenishment</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Orders Table */}
            <div className="xl:col-span-2">
              <div className="glass-card overflow-hidden h-full flex flex-col">
                <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-400" />
                    Actionable Orders Queue
                  </h2>
                </div>
                <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[600px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#161a29] z-10">
                      <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-5 py-4 font-medium">Order ID</th>
                        <th className="px-5 py-4 font-medium">Date</th>
                        <th className="px-5 py-4 font-medium">Customer</th>
                        <th className="px-5 py-4 font-medium">Items</th>
                        <th className="px-5 py-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map((order) => {
                        const transitions = VALID_TRANSITIONS[order.status] ?? [];
                        const isTerminal = transitions.length === 0;
                        const isUpdating = updatingId === order.id;

                        return (
                          <tr key={order.id} className="hover:bg-white/3 transition-colors">
                            <td className="px-5 py-4 align-top">
                              <span className="text-white font-medium">#{order.id}</span>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className="text-slate-300 text-sm">{formatDate(order.created_at)}</span>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className="text-slate-300 text-sm">{order.customer_name}</span>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex flex-col gap-1.5">
                                {order.items.map((item) => (
                                  <span key={item.id} className="text-xs text-slate-400">
                                    <span className="text-white font-medium">{item.quantity}x</span> {item.product_name}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right align-top">
                              <div className="flex flex-col items-end gap-2">
                                <StatusBadge status={order.status} size="sm" />
                                {isUpdating ? (
                                  <div className="flex items-center gap-1.5 text-indigo-400 text-xs py-1.5">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Updating...
                                  </div>
                                ) : !isTerminal ? (
                                  <select
                                    value=""
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                    className="bg-[#0f1424] border border-white/10 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all cursor-pointer"
                                  >
                                    <option value="" disabled>Change Status...</option>
                                    {transitions.map((t) => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-slate-600 text-[10px] uppercase tracking-wider py-1.5 block">
                                    Terminal State
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-16 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                              <Package className="w-8 h-8 opacity-50" />
                              <p>No orders in the queue.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Branch Inventory */}
            <div className="xl:col-span-1">
              <div className="glass-card overflow-hidden h-full flex flex-col">
                <div className="p-5 border-b border-white/5 shrink-0 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Box className="w-5 h-5 text-indigo-400" />
                    Current Inventory
                  </h2>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 max-h-[600px]">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[#161a29] z-10">
                      <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-5 py-4 font-medium">Product</th>
                        <th className="px-5 py-4 font-medium text-right">Stock</th>
                        <th className="px-5 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {inventory.map((item) => {
                        const isEditing = editingInvId === item.product_id;
                        const isProcessing = invLoadingId === item.product_id;

                        return (
                          <tr key={item.product_id} className="hover:bg-white/3 transition-colors">
                            <td className="px-5 py-3">
                              <span className="text-slate-300 text-sm block font-medium">
                                {item.product_name}
                              </span>
                              <span className="text-slate-500 text-[10px] font-mono mt-0.5 block">
                                ID: {item.product_id}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editStockValue}
                                  onChange={(e) => setEditStockValue(e.target.value)}
                                  className="w-16 bg-[#0f1424] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 text-right"
                                />
                              ) : (
                                <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                                  item.quantity === 0 
                                    ? "bg-red-500/10 text-red-400" 
                                    : item.quantity < 10 
                                      ? "bg-orange-500/10 text-orange-400" 
                                      : "text-emerald-400"
                                }`}>
                                  {item.quantity}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {isProcessing ? (
                                <div className="flex justify-end">
                                  <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                                </div>
                              ) : isEditing ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleUpdateStock(item.product_id)} className="text-emerald-400 hover:text-emerald-300">
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditingInvId(null)} className="text-slate-400 hover:text-white">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-3">
                                  <button 
                                    onClick={() => {
                                      setEditingInvId(item.product_id);
                                      setEditStockValue(item.quantity.toString());
                                    }} 
                                    className="text-indigo-400 hover:text-indigo-300"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProduct(item.product_id)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {!inventory.length && (
                        <tr>
                          <td colSpan={3} className="px-5 py-12 text-center text-slate-400">
                            No inventory records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
