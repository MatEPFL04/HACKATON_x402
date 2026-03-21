import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { createOrGetUser, createPhoto } from "../../../../lib/mockDb";

type BotWebhookPayload = {
  text?:string;
  /*
  image_name?: string;
  telegram_username?: string;
  attributs_image?: Record<string, unknown>;
  Image_data?: string;
  price?: number;
  wallet_address?: string;
  */
};

function saveBase64Image(base64Data: string, imageName: string): string {
  const cleanedBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(cleanedBase64, "base64");

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const safeImageName = imageName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(uploadDir, safeImageName);

  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${safeImageName}`;
}

function isValidTonAddress(address: string) {
  if (address.length < 40 || address.length > 60) return false;
  return /^[A-Za-z0-9_-]+$/.test(address);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BotWebhookPayload;
    const text = body.text?.trim();
    return NextResponse.json(
        { ok: true },
        { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
        { ok: true , error: "ERROR"},
        { status: 400 }
    )
  }
}
    /*
    const imageName = body.image_name?.trim();
    const telegramUsername = body.telegram_username?.trim();
    const imageAttributes = body.attributs_image ?? {};
    const imageDataBase64 = body.Image_data?.trim();
    const price = Number(body.price);
    const walletAddress = body.wallet_address?.trim();
    */
    
    /*
    // ✅ validations
    if (!imageName) {
      return NextResponse.json(
        { ok: false, error: "Missing image_name" },
        { status: 400 }
      );
    }

    if (!telegramUsername) {
      return NextResponse.json(
        { ok: false, error: "Missing telegram_username" },
        { status: 400 }
      );
    }

    if (!imageDataBase64) {
      return NextResponse.json(
        { ok: false, error: "Missing Image_data" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid price" },
        { status: 400 }
      );
    }

    if (walletAddress && !isValidTonAddress(walletAddress)) {
      return NextResponse.json(
        { ok: false, error: "Invalid wallet address" },
        { status: 400 }
      );
    }
      

    // 🔑 user basé uniquement sur username
    const user = createOrGetUser(telegramUsername, walletAddress ?? "");

    const imageUrl = saveBase64Image(imageDataBase64, imageName);

    const photo = createPhoto({
      ownerUserId: user.id,
      imageName,
      description:
        typeof imageAttributes.description === "string"
          ? imageAttributes.description
          : imageName,
      imageUrl,
      creatorPriceUsd: price,
      imageAttributes,
    });

    return NextResponse.json({
      ok: true,
      user,
      photo,
    });
  } catch (error) {
    console.error("Webhook error:", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
    */
  