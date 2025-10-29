// app/admin/types.ts
export interface DailyStats {
  totalOrders: number;
  totalRevenue: number;
  totalItemsSold: number;
  activeTables: number;
  averageOrderValue: number;
}

export interface OrderSummary {
  id: string;
  table_id: number;
  total_amount: number;
  created_at: string;
  status: string;
  items_count: number;
}

export interface PopularProduct {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

// Interfaz para órdenes relacionadas
export interface RelatedOrder {
  id: string;
  status: string;
}

export interface RestaurantTable {
  id: number;
  number: number;
  status: string;
  capacity: number;
  location: string;
  created_at: string;
  updated_at: string;
  orders?: RelatedOrder[]; // Agregar esta línea
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  preparation_time: number;
  created_at: string;
  updated_at: string;
}

export type AdminSection = "dashboard" | "tables" | "products";

export interface TableFormData {
  number: string;
  capacity: string;
  location: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  preparation_time: string;
  is_available: boolean;
}

// Credenciales fijas del administrador
export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "restaurant2024",
};