const axios = require("axios");
const { DEFAULT_MODEL } = require("./openrouter");

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is missing in .env");
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Function to generate text using any model
const generateText = async (model, prompt, max_tokens = 300) => {
  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: model,
        messages: [{ role: "user", content: prompt }],
        max_tokens,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FRONTEND_URL || "https://sih.aysh.me",
          "X-Title": process.env.APP_NAME || "SIH 2025",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error("OpenRouter API error:", err.response?.data || err.message);
    throw err;
  }
};

// Function to generate a concise thread title based on user message using AI
const generateThreadTitle = async (userMessage) => {
  const models = [DEFAULT_MODEL];

  for (const model of models) {
    try {
      const prompt = `Create a short 2-4 word title for this farming question or issue. Focus on the main problem or topic.

Examples:
- "My tomato plants have brown spots" → "Tomato Leaf Disease"
- "What fertilizer for wheat?" → "Wheat Fertilizer"
- "Yellowing chili leaves after watering" → "Chili Yellowing Issue"
- "Heavy rain killing my plants" → "Waterlogged Plants"

Message: "${userMessage}"

Title:`;

      const title = await generateText(model, prompt, 20);

      // Clean up the response
      let cleanTitle = title.trim().replace(/^["']|["']$/g, ""); // Remove quotes if present

      // Remove any extra text that might be added
      cleanTitle = cleanTitle.split("\n")[0]; // Take only first line
      cleanTitle = cleanTitle
        .replace(/^(Title:|Chat Title:|Summary:)/i, "")
        .trim();

      // Ensure it's not too long
      if (cleanTitle.length > 50) {
        const truncated = cleanTitle.substring(0, 47);
        const lastSpace = truncated.lastIndexOf(" ");
        cleanTitle =
          lastSpace > 20
            ? truncated.substring(0, lastSpace) + "..."
            : truncated + "...";
      }

      // If we got a valid response, return it
      if (cleanTitle && cleanTitle.length >= 3) {
        console.log(`Thread title generated using ${model}: "${cleanTitle}"`);
        return cleanTitle;
      }

      console.log(
        `${model} returned empty/invalid response, trying next model...`
      );
    } catch (error) {
      console.error(`Error with ${model}:`, error.message);
      // Continue to next model
    }
  }

  // If all AI models fail, use fallback
  console.log("All AI models failed, using fallback title generation");
  return createFallbackTitle(userMessage);
};

// Fallback function for title generation
const createFallbackTitle = (userMessage) => {
  let title = userMessage.trim();

  // Remove common greeting words
  title = title.replace(
    /^(hi|hello|hey|good morning|good afternoon|good evening)[,\s]*/i,
    ""
  );

  // Remove "I have" or similar phrases
  title = title.replace(
    /^(i have|i am having|i'm having|i got|i'm facing)\s*/i,
    ""
  );

  // Handle question words
  title = title.replace(/^(what|how|when|where|why|which)\s+/i, "");

  // Capitalize and truncate
  title = title.charAt(0).toUpperCase() + title.slice(1);

  if (title.length > 50) {
    const truncated = title.substring(0, 47);
    const lastSpace = truncated.lastIndexOf(" ");
    title =
      lastSpace > 20
        ? truncated.substring(0, lastSpace) + "..."
        : truncated + "...";
  }

  return (
    title ||
    userMessage.substring(0, 47) + (userMessage.length > 47 ? "..." : "")
  );
};

module.exports = { generateText, generateThreadTitle };
