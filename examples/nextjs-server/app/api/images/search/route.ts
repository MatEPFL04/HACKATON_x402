import { NextRequest, NextResponse } from "next/server";
import { searchImages } from "../../../../lib/image-storage";
import type { SearchParams } from "../../../../lib/types";

/**
 * GET /api/images/search
 *
 * Free endpoint — search images by tags, price range, owner.
 *
 * Query params:
 *   tags       comma-separated (AND logic)
 *   min_price  atomic BSA USD
 *   max_price  atomic BSA USD
 *   owner_ID   Telegram user ID
 *   limit      default 20, max 100
 *   offset     default 0
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: SearchParams = {};

  const q = sp.get("q");
  if (q) params.q = q;

  const tagsRaw = sp.get("tags");
  if (tagsRaw) {
    params.tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
  }

  const minPrice = sp.get("min_price");
  if (minPrice) params.min_price = minPrice;

  const maxPrice = sp.get("max_price");
  if (maxPrice) params.max_price = maxPrice;

  const ownerID = sp.get("owner_ID");
  if (ownerID) params.owner_ID = ownerID;

  const limitRaw = sp.get("limit");
  params.limit = limitRaw ? Math.min(Math.max(parseInt(limitRaw, 10) || 20, 1), 100) : 20;

  const offsetRaw = sp.get("offset");
  params.offset = offsetRaw ? Math.max(parseInt(offsetRaw, 10) || 0, 0) : 0;

  const result = await searchImages(params);
  return NextResponse.json(result);
}