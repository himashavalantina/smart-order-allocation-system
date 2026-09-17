export interface User {
  user_id: number;
  email: string;
  full_name: string;
  role: "CUSTOMER" | "ADMIN" | "BRANCH_MANAGER";
  branch_id?: number;
  access_token: string;
  mobile_number?: string;
  address_line_1?: string;
  address_line_2?: string;
  postal_code?: string;
  location_city?: string;
  location_district?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InventoryItem {
  product_id: number;
  product_name: string;
  quantity: number;
}

export interface Branch {
  id: number;
  name: string;
  address: string | null;
  location_lat: number;
  location_lng: number;
  city: string | null;
  is_active: boolean;
  created_at: string;
  inventory: InventoryItem[];
  active_orders_count: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type OrderStatus =
  | "PENDING"
  | "ALLOCATED"
  | "PROCESSING"
  | "UNALLOCATED"
  | "CANCELLED"
  | "DELIVERED";

export interface Order {
  id: number;
  customer_id: number;
  customer_order_number?: number;
  customer_name: string | null;
  status: OrderStatus;
  allocated_branch_id: number | null;
  allocated_branch_name: string | null;
  customer_note: string | null;
  // Canonical AI classification fields (populated on every classified note)
  ai_category: string | null;
  ai_confidence: number | null;
  // Legacy fields
  note_category: string | null;
  note_confidence: number | null;
  note_needs_review: boolean | null;
  total_amount: number;
  delivery_mobile?: string | null;
  delivery_address_line_1?: string | null;
  delivery_address_line_2?: string | null;
  delivery_postal_code?: string | null;
  delivery_city?: string | null;
  delivery_district?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ClassifyResult {
  category: string;
  confidence: number;
  needs_review: boolean;
  all_probabilities: Record<string, number> | null;
}

export interface DashboardSummary {
  total_orders: number;
  allocated_orders: number;
  delivered_orders: number;
  unallocated_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  total_revenue: number;
  total_customers: number;
  total_branches: number;
  total_products: number;
}

export interface BranchWorkload {
  id: number;
  name: string;
  city: string | null;
  active_orders: number;
  total_orders: number;
}

export interface AdminDashboard {
  summary: DashboardSummary;
  status_distribution: { status: string; count: number }[];
  branch_workload: BranchWorkload[];
  recent_orders: Order[];
}

export const CITIES: Record<string, { lat: number; lng: number }> = {
  Colombo: { lat: 6.9271, lng: 79.8612 },
  Kandy: { lat: 7.2906, lng: 80.6337 },
  Galle: { lat: 6.0535, lng: 80.221 },
  Negombo: { lat: 7.209, lng: 79.838 },
  Jaffna: { lat: 9.6615, lng: 80.0255 },
  Kurunegala: { lat: 7.4863, lng: 80.3647 },
  Ratnapura: { lat: 6.6829, lng: 80.3992 },
  Matara: { lat: 5.9549, lng: 80.555 },
  Anuradhapura: { lat: 8.3114, lng: 80.4037 },
  Trincomalee: { lat: 8.5874, lng: 81.2152 },
};
