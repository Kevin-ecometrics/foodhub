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

export interface RestaurantTable {
  id: number;
  number: number;
  status: string;
  capacity: number;
  location: string;
  branch: string;
  created_at: string;
  updated_at: string;
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
  branch: string;
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

// Lista de sucursales
export const BRANCHES = [
  "Hermosillo - Plaza Dila",
  "Hermosillo - Plaza Valles",
  "Hermosillo – Gallerías Mall",
  "Hermosillo – Plaza Patio",
  "Hermosillo - Plaza Progreso",
  "Ciudad Obregón - Miguel Alemán",
  "Ciudad Obregón - Plaza Bellavista",
  "San Luis Río Colorado",
  "Guaymas",
  "Guasave",
  "Los Mochis",
  "Mexicali - Plaza San Pedro",
  "Mexicali - Plaza Nuevo Mexicali",
  "Tijuana - Plaza Paseo 2000",
  "Tijuana - Plaza Río",
  "Cabo San Lucas",
  "La Paz",
];