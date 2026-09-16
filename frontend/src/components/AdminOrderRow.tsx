"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import AICategoryBadge from "@/components/AICategoryBadge";
import { Order, OrderStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Package,
  MapPin,
  Brain,
  ChevronDown,
  ChevronUp,
  RefreshCw,
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

interface OrderRowProps {
  order: Order;
  onStatusChange: (orderId: number, newStatus: string) => Promise<void>;
}

export default function AdminOrderRow({ order, onStatusChange }: OrderRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string>(order.status);

  const transitions = VALID_TRANSITIONS[optimisticStatus] ?? [];
  const isTerminal = transitions.length === 0;

  const handleStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!newStatus || newStatus === optimisticStatus) return;
    setUpdating(true);
    setOptimisticStatus(newStatus); // optimistic update
    try {
      await onStatusChange(order.id, newStatus);
    } catch {
      setOptimisticStatus(order.status); // revert on error
    } finally {
      setUpdating(false);
    }
  };

  const displayCategory = order.ai_category ?? order.note_category;
  const displayConfidence = order.ai_confidence ?? order.note_confidence;

  return (
    <div className="glass-card overflow-hidden hover:border-emerald-500/20 transition-all duration-200">
      {/* ── Row Header ─────────────────────────────────────────────────── */}
      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Package className="w-4 h-4 text-emerald-400" />
        </div>

        {/* Info block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">Order #{order.id}</span>
            <StatusBadge status={optimisticStatus as OrderStatus} size="sm" />
            {displayCategory && (
              <AICategoryBadge
                category={displayCategory}
                confidence={displayConfidence}
                size="sm"
              />
            )}
          </div>

          {order.customer_name && (
            <p className="text-slate-400 text-xs mt-0.5">{order.customer_name}</p>
          )}

          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <p className="text-slate-500 text-xs">{formatDate(order.created_at)}</p>
            {order.allocated_branch_name && (
              <p className="text-emerald-400 text-xs flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {order.allocated_branch_name}
              </p>
            )}
            {order.delivery_city && (
              <p className="text-emerald-300 text-xs">{order.delivery_city}</p>
            )}
          </div>
        </div>

        {/* Right-side controls */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className="text-white font-bold text-sm">
            {formatCurrency(order.total_amount)}
          </span>

          {/* Expand/Collapse */}
          <div className="flex items-center gap-1.5">
            {updating && <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />}

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded Details ───────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-white/5 px-4 py-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Order Items */}
          <div className="space-y-1.5">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              Items
            </p>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{item.product_name}</span>
                <span className="text-slate-400">
                  {item.quantity} × {formatCurrency(item.unit_price)}
                  <span className="text-white ml-2 font-medium">
                    {formatCurrency(item.subtotal)}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* AI-classified customer note */}
          {order.customer_note && (
            <div className="space-y-2">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Customer Note · AI Classification
              </p>
              <p className="text-slate-300 text-xs bg-white/3 rounded-lg px-3 py-2 border border-white/5 leading-relaxed">
                {order.customer_note}
              </p>
              {displayCategory && (
                <div className="flex items-center gap-2 flex-wrap">
                  <AICategoryBadge
                    category={displayCategory}
                    confidence={displayConfidence}
                    size="md"
                  />
                  {order.note_needs_review && (
                    <span className="text-yellow-400 text-[10px] border border-yellow-400/30 bg-yellow-400/10 rounded-full px-2 py-0.5">
                      ⚠ Needs Review
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Delivery address */}
          {(order.delivery_address_line_1 || order.delivery_postal_code) && (
            <div className="space-y-1">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Delivery Address
              </p>
              <p className="text-slate-300 text-xs">
                {[
                  order.delivery_address_line_1,
                  order.delivery_address_line_2,
                  order.delivery_city,
                  order.delivery_district,
                  order.delivery_postal_code,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
