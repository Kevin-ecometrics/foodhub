// app/api/revalidate-logo/route.ts
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { RESTAURANT_LOGO_TAG } from "@/app/lib/restaurantLogo";

export async function POST() {
  revalidateTag(RESTAURANT_LOGO_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
