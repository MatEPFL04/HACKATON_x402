export interface ImageRecord {
  id: string;
  image_name: string;
  owner_ID: string;
  owner_walletAddress: string;
  attributs_image: string[];
  price: string;
  created_at: string;
  // 384-dim sentence embedding of the description + tags (all-MiniLM-L6-v2)
  // Absent on images uploaded before semantic search was added.
  embedding?: number[];
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
  image_data?: string;   // base64, pour la preview floutée
  score?: number;        // cosine similarity score from semantic search (0-1)
}

export interface ImageDownloadResponse {
  id: string;
  image_name: string;
  attributs_image: string[];
  owner_walletAddress: string;
  image_data: string;
}

export interface SearchParams {
  q?: string;       // free-text semantic query (uses embeddings)
  tags?: string[];  // exact tag match (fallback for images without embeddings)
  min_price?: string;
  max_price?: string;
  owner_ID?: string;
  limit?: number;
  offset?: number;
}