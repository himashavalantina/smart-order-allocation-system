import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { OrderStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  ALLOCATED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  UNALLOCATED: "text-red-400 bg-red-400/10 border-red-400/30",
  CANCELLED: "text-slate-400 bg-slate-400/10 border-slate-400/30",
  DELIVERED: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ALLOCATED: "Allocated",
  UNALLOCATED: "Unallocated",
  CANCELLED: "Cancelled",
  DELIVERED: "Delivered",
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Payment Issue": "text-rose-400 bg-rose-400/10 border-rose-400/30",
  "Delivery Issue": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "Refund/Cancellation": "text-purple-400 bg-purple-400/10 border-purple-400/30",
  "Order Status Inquiry": "text-sky-400 bg-sky-400/10 border-sky-400/30",
  "Product/Stock Inquiry": "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  "Account/Login Issue": "text-orange-400 bg-orange-400/10 border-orange-400/30",
  "Promotion/Discount Inquiry": "text-lime-400 bg-lime-400/10 border-lime-400/30",
  "General Inquiry": "text-slate-400 bg-slate-400/10 border-slate-400/30",
  "Needs Manual Review": "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
};
