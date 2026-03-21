export type User = {
    id: string;
    telegramId: string;
    telegramUsername: string;
    payoutWalletAddress: string;
    internalBalanceUsd: number;
  };
  
  export type Photo = {
    id: string;
    ownerUserId: string;
    imageName: string;
    description: string;
    imageUrl: string;
    creatorPriceUsd: number;
    imageAttributes: Record<string, unknown>;
    createdAt: string;
  };
  
  export type PurchaseIntent = {
    id: string;
    photoId: string;
    sellerUserId: string;
    creatorAmountUsd: number;
    platformFeeUsd: number;
    totalAmountUsd: number;
    status: "pending_payment" | "paid" | "expired";
    paymentTxHash?: string;
    createdAt: string;
  };
  
  export type LedgerEntry = {
    id: string;
    userId: string;
    purchaseIntentId: string;
    type: "credit" | "payout";
    amountUsd: number;
    createdAt: string;
  };
  
  export const users: User[] = [
    {
      id: "u1",
      telegramId: "111111111",
      telegramUsername: "alice",
      payoutWalletAddress: "UQ_ALICE_WALLET",
      internalBalanceUsd: 0,
    },
    {
      id: "u2",
      telegramId: "222222222",
      telegramUsername: "bob",
      payoutWalletAddress: "UQ_BOB_WALLET",
      internalBalanceUsd: 0,
    },
  ];
  
  export const photos: Photo[] = [];
  export const purchaseIntents: PurchaseIntent[] = [];
  export const ledgerEntries: LedgerEntry[] = [];
  
  export function getUserById(userId: string) {
    return users.find((user) => user.id === userId);
  }
  
  export function getUserByTelegramId(telegramId: string) {
    return users.find((user) => user.telegramId === telegramId);
  }
  
  export function createOrGetUser(
    telegramId: string,
    telegramUsername?: string,
    payoutWalletAddress = "",
  ) {
    const existingUser = getUserByTelegramId(telegramId);
    if (existingUser) {
      return existingUser;
    }
  
    const newUser: User = {
      id: `u_${Date.now()}`,
      telegramId,
      telegramUsername: telegramUsername ?? `user_${telegramId}`,
      payoutWalletAddress,
      internalBalanceUsd: 0,
    };
  
    users.push(newUser);
    return newUser;
  }
  
  export function createPhoto(input: {
    ownerUserId: string;
    imageName: string;
    description: string;
    imageUrl: string;
    creatorPriceUsd: number;
    imageAttributes?: Record<string, unknown>;
  }) {
    const photo: Photo = {
      id: `p_${Date.now()}`,
      ownerUserId: input.ownerUserId,
      imageName: input.imageName,
      description: input.description,
      imageUrl: input.imageUrl,
      creatorPriceUsd: input.creatorPriceUsd,
      imageAttributes: input.imageAttributes ?? {},
      createdAt: new Date().toISOString(),
    };
  
    photos.push(photo);
    return photo;
  }
  
  export function getPhotoById(photoId: string) {
    return photos.find((photo) => photo.id === photoId);
  }
  
  export function getPhotosByOwnerUserId(ownerUserId: string) {
    return photos.filter((photo) => photo.ownerUserId === ownerUserId);
  }
  
  export function getAvailablePhotos() {
    return photos;
  }
  
  export function createPurchaseIntent(photoId: string, platformFeeUsd: number) {
    const photo = getPhotoById(photoId);
    if (!photo) {
      throw new Error("Photo not found");
    }
  
    const intent: PurchaseIntent = {
      id: `pi_${Date.now()}`,
      photoId: photo.id,
      sellerUserId: photo.ownerUserId,
      creatorAmountUsd: photo.creatorPriceUsd,
      platformFeeUsd,
      totalAmountUsd: photo.creatorPriceUsd + platformFeeUsd,
      status: "pending_payment",
      createdAt: new Date().toISOString(),
    };
  
    purchaseIntents.push(intent);
    return intent;
  }
  
  export function markIntentAsPaid(intentId: string, txHash: string) {
    const intent = purchaseIntents.find((entry) => entry.id === intentId);
    if (!intent) {
      throw new Error("Intent not found");
    }
  
    if (intent.status !== "pending_payment") {
      throw new Error("Intent already processed");
    }
  
    intent.status = "paid";
    intent.paymentTxHash = txHash;
  
    const ledgerEntry: LedgerEntry = {
      id: `le_${Date.now()}`,
      userId: intent.sellerUserId,
      purchaseIntentId: intent.id,
      type: "credit",
      amountUsd: intent.creatorAmountUsd,
      createdAt: new Date().toISOString(),
    };
  
    ledgerEntries.push(ledgerEntry);
  
    const seller = getUserById(intent.sellerUserId);
    if (!seller) {
      throw new Error("Seller not found");
    }
  
    seller.internalBalanceUsd += intent.creatorAmountUsd;
  
    return intent;
  }