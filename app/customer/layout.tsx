// app/customer/layout.tsx
import { generateRestaurantMetadata } from "@/app/lib/restaurantLogo";

export const generateMetadata = generateRestaurantMetadata;

export default function CustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
