import { NextResponse } from "next/server";
import { getAllTags } from "../../../lib/image-storage";

/**
 * GET /api/tags
 *
 * Free endpoint — all unique tags across the marketplace.
 * Useful for autocomplete / filtering UI.
 */
export async function GET() {
  const tags = getAllTags();
  return NextResponse.json({ tags });
}