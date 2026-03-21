export interface ImageRecord {
  id: string;
  image_name: string;
  owner_ID: string;
  owner_walletAddress: string;
  attributs_image: string[];
  price: string;
  created_at: string;
}

export interface TelegramWebhookPayload {
  image_name: string;
  user_ID: string;
  attributs_image: string[];
  image_data: string;
  price: string;
  user_walletAddress: string;
}

export interface ImagePublicMeta {
  id: string;
  image_name: string;
  attributs_image: string[];
  price: string;
  owner_ID: string;
  created_at: string;
  image_data?: string; // base64, pour la preview floutée
}

export interface ImageDownloadResponse {
  id: string;
  image_name: string;
  attributs_image: string[];
  owner_walletAddress: string;
  image_data: string;
}

export interface SearchParams {
  tags?: string[];
  min_price?: string;
  max_price?: string;
  owner_ID?: string;
  limit?: number;
  offset?: number;
}