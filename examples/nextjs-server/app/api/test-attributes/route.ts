import { NextRequest, NextResponse } from "next/server";
import { extractAttributes } from "../../../lib/extract-attributes";

/**
 * GET /api/test-attributes?description=...
 * Quick test endpoint — remove before production.
 */
export async function GET(request: NextRequest) {
  const description = request.nextUrl.searchParams.get("description");
  if (!description) {
    return NextResponse.json({ error: "Missing ?description= param" }, { status: 400 });
  }

  const tags = await extractAttributes(description);
  return NextResponse.json({ description, tags });
}
