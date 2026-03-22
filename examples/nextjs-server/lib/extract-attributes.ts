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
        "You are a photo tagging assistant for an image marketplace where AI agents search for real human-taken photos. " +
        "Your tags must be useful for semantic search — an AI agent might search for 'two people overhead view' or 'gray jogger street'. " +
        "Always respond with valid JSON only, no explanation, no markdown.",
      messages: [
        {
          role: "user",
          content: `Extract search tags from this photo description.

Rules:
- Return 3 to 10 tags in English (description may be in any language)
- Each tag: lowercase, no accents, only letters/digits/hyphens
- Cover as many of these as apply: subjects (people/objects/animals), setting (indoor/outdoor/urban/nature), action or pose, colors, clothing, mood, lighting, camera angle, number of people
- Be specific: prefer "gray-jogger" over "clothes", "overhead-view" over "photo"
- Only return {"tags": ["bad-description"]} if the input is completely unintelligible or empty — a short or imperfect description still gets real tags
- Output ONLY valid JSON: {"tags": ["tag1", "tag2", "tag3"]}

Photo description: ${description}`,
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
