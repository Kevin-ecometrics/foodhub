// app/admin/layout.tsx
import { generateRestaurantMetadata } from "@/app/lib/restaurantLogo";

export const generateMetadata = generateRestaurantMetadata;

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
