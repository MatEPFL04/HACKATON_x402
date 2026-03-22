import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

// ============================================================
// Singleton embedder
// Loaded once at first use, then reused for every call.
// Model: all-MiniLM-L6-v2 (~25MB, 384-dim vectors)
// ============================================================

// Promise-based singleton — concurrent calls share the same load promise
// instead of each spawning their own, preventing double-loading.
let embedderPromise: Promise<FeatureExtractionPipeline> | null = null;

async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (!embedderPromise) {
    console.log("[embeddings] Loading all-MiniLM-L6-v2...");
    embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      dtype: "fp32",
    }).then((model) => {
      console.log("[embeddings] Model ready.");
      return model;
    });
  }
  return embedderPromise;
}

/**
 * Converts a text string into a 384-dimensional embedding vector.
 * Uses mean pooling + L2 normalisation so cosine similarity = dot product.
 */
export async function embed(text: string): Promise<number[]> {
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

/**
 * Cosine similarity between two normalised vectors (result in [-1, 1]).
 * Since embed() already normalises, this is just a dot product.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
