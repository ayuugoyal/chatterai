// lib/embeddings/index.ts
// Embedding service using Hugging Face Transformers for RAG

import { pipeline } from "@xenova/transformers";

// Use a smaller, efficient model for embeddings
const MODEL_NAME = "Xenova/all-MiniLM-L6-v2"; // 384 dimensions, good for semantic search

// Singleton pattern to avoid reloading the model
let embeddingPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log("Loading embedding model:", MODEL_NAME);
    embeddingPipeline = await pipeline("feature-extraction", MODEL_NAME);
    console.log("Embedding model loaded successfully");
  }
  return embeddingPipeline;
}

/**
 * Generate embeddings for a given text
 * @param text Text to embed
 * @returns 384-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipe = await getEmbeddingPipeline();

    // Generate embedding
    const output = await pipe(text, {
      pooling: "mean",
      normalize: true,
    });

    // Convert to array
    return Array.from(output.data);
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts Array of texts to embed
 * @returns Array of 384-dimensional vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const embeddings = await Promise.all(
      texts.map((text) => generateEmbedding(text))
    );
    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error("Failed to generate embeddings");
  }
}

/**
 * Split text into chunks for embedding
 * @param text Text to chunk
 * @param chunkSize Max characters per chunk
 * @param overlap Overlap between chunks
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);

    // Only add non-empty chunks
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }

    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Calculate cosine similarity between two vectors
 * @param vec1 First vector
 * @param vec2 Second vector
 * @returns Similarity score (0-1)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
