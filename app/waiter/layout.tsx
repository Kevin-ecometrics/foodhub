// app/waiter/layout.tsx
import { generateRestaurantMetadata } from "@/app/lib/restaurantLogo";

export const generateMetadata = generateRestaurantMetadata;

export default function WaiterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
