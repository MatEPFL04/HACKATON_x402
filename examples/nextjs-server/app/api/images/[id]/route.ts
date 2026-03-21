import { NextRequest, NextResponse } from "next/server";
import { getImageById, toPublicMeta } from "../../../../lib/image-storage";

/**
 * GET /api/images/:id
 *
 * Free endpoint — public metadata for a single image.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = getImageById(id);

  if (!record) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return NextResponse.json(toPublicMeta(record));
}