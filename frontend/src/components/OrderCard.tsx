"use client";

import { Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "./StatusBadge";
import { MapPin, Package, X, ChevronDown, ChevronUp, Brain } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS, formatConfidence } from "@/lib/utils";

interface Props {
  order: Order;
  onCancel?: (orderId: number) => void;
  showCustomer?: boolean;
}

export default function OrderCard({ order, onCancel, showCustomer }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const canCancel = !["CANCELLED", "DELIVERED"].includes(order.status);
  const noteCategoryColor = order.note_category
    ? CATEGORY_COLORS[order.note_category] || "text-slate-400 bg-slate-400/10 border-slate-400/30"
    : "";

  return (
    <div className="glass-card overflow-hidden hover:border-indigo-500/20 transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm">Order #{order.id}</span>
              <StatusBadge status={order.status as any} size="sm" />
            </div>
            {showCustomer && order.customer_name && (
              <p className="text-slate-400 text-xs mt-0.5">{order.customer_name}</p>
            )}
            <p className="text-slate-500 text-xs mt-0.5">{formatDate(order.created_at)}</p>
            {order.allocated_branch_name && (
              <p className="text-emerald-400 text-xs mt-0.5 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {order.allocated_branch_name}
              </p>
            )}
            {order.status === "UNALLOCATED" && (
              <p className="text-red-400 text-xs mt-0.5">No branch could fulfil this order</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white font-bold text-sm">{formatCurrency(order.total_amount)}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-white/5 px-4 py-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Items */}
          <div className="space-y-1.5">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Items</p>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{item.product_name}</span>
                <span className="text-slate-400">
                  {item.quantity} × {formatCurrency(item.unit_price)}
                  <span className="text-white ml-2 font-medium">{formatCurrency(item.subtotal)}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Customer Note + Classification */}
          {order.customer_note && (
            <div className="space-y-1.5">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Customer Note
              </p>
              <p className="text-slate-300 text-xs bg-white/3 rounded-lg px-3 py-2 border border-white/5">
                {order.customer_note}
              </p>
              {order.note_category && (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full border font-medium",
                      noteCategoryColor
                    )}
                  >
                    {order.note_category}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {order.note_confidence ? formatConfidence(order.note_confidence) : ""}
                    {order.note_needs_review && " · Needs Review"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cancel Button */}
          {canCancel && onCancel && (
            <div className="pt-1">
              <button
                onClick={async () => {
                  setCancelling(true);
                  await onCancel(order.id);
                  setCancelling(false);
                }}
                disabled={cancelling}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-400/20 hover:bg-red-400/10 transition-all disabled:opacity-50"
              >
                <X className="w-3 h-3" />
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
