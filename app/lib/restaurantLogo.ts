// app/lib/restaurantLogo.ts
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { supabase } from "@/app/lib/supabase/client";

export const RESTAURANT_LOGO_TAG = "restaurant-logo";

export const getRestaurantLogoUrl = unstable_cache(
  async (): Promise<string | null> => {
    const { data: files, error } = await supabase.storage
      .from("logo")
      .list("", {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error || !files || files.length === 0) return null;

    const latestLogo = files.find((file) => file.name.startsWith("logo_"));
    if (!latestLogo) return null;

    const { data: urlData } = supabase.storage
      .from("logo")
      .getPublicUrl(latestLogo.name);

    return urlData?.publicUrl ?? null;
  },
  ["restaurant-logo-url"],
  { tags: [RESTAURANT_LOGO_TAG], revalidate: 3600 },
);

// Favicon del restaurante; si no hay logo, queda el de ScanEat del layout raíz
export async function generateRestaurantMetadata(): Promise<Metadata> {
  const logoUrl = await getRestaurantLogoUrl();
  return logoUrl ? { icons: { icon: logoUrl, apple: logoUrl } } : {};
}
