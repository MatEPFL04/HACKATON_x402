// ============================================================
// Shared types for the image marketplace
// ============================================================

/**
 * Metadata record for a stored image.
 * Written by the Telegram webhook, read by the marketplace API.
 */
export interface ImageRecord {
  id: string;
  image_name: string;
  owner_ID: string;
  owner_walletAddress: string;
  attributs_image: string[];
  /** Price in atomic BSA USD (9 decimals). Ex: "10000000" = 0.01 BSA USD */
  price: string;
  created_at: string;
}

/**
 * Payload sent by the Telegram bot to POST /api/telegram/webhook.
 */
export interface TelegramWebhookPayload {
  image_name: string;
  user_ID: string;
  attributs_image: string[];
  image_data: string;
  /** Price in atomic BSA USD (9 decimals) */
  price: string;
  user_walletAddress: string;
}

/**
 * Public metadata returned by search and detail endpoints.
 * Excludes base64 image data and wallet address.
 */
export interface ImagePublicMeta {
  id: string;
  image_name: string;
  attributs_image: string[];
  price: string;
  owner_ID: string;
  created_at: string;
}

/**
 * Full image response returned after a paid download.
 */
export interface ImageDownloadResponse {
  id: string;
  image_name: string;
  attributs_image: string[];
  owner_walletAddress: string;
  image_data: string;
}

/**
 * Query parameters for the search endpoint.
 */
export interface SearchParams {
  tags?: string[];
  min_price?: string;
  max_price?: string;
  owner_ID?: string;
  limit?: number;
  offset?: number;
}