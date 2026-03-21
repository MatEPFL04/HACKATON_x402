import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Uses Claude to extract meaningful product attributes/tags from a free-text description.
 * Returns a list of lowercase, normalized attribute strings.
 *
 * Falls back to a comma-split of the description if the API call fails.
 */
export async function extractAttributes(description: string): Promise<string[]> {
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 512,
      system:
        "You are a product tagging assistant for a marketplace. " +
        "You always respond with valid JSON only, no explanation, no markdown." +
        "You never invent new characteristics." +
        "If description isn't clear or unsufficient only put 1 tag and the tag : unknown-product",
      messages: [
        {
          role: "user",
          content: `Given this product description, extract a list of concise, relevant attributes/tags.

Rules:
- Return between 3 and 10 tags
- Each tag must be lowercase, no accents, no special characters (letters, digits, hyphens only)
- Tags should cover: product category, material, color, style, condition, brand (if mentioned), and any other key characteristics
- Be specific but not overly granular
- Output ONLY valid JSON: {"tags": ["tag1", "tag2", "tag3"]}

Product description: ${description}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text block in response");
    }

    const parsed = JSON.parse(textBlock.text) as { tags: string[] };
    const tags = parsed.tags
      .map((t) =>
        t
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // remove accents
          .replace(/[^a-z0-9-]/g, "-")     // replace invalid chars with hyphen
          .replace(/-+/g, "-")             // collapse multiple hyphens
          .replace(/^-|-$/g, "")           // trim leading/trailing hyphens
      )
      .filter(Boolean);

    return tags.length > 0 ? tags : ["untagged"];
  } catch (err) {
    console.warn("[extract-attributes] Claude API failed, falling back to comma-split:", err);
    // Fallback: comma-split the description
    const tags = description
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    return tags.length > 0 ? tags : ["untagged"];
  }
}
