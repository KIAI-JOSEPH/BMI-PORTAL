// BMI UMS - AI Routes (Local LLM via Ollama)
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  generateAIResponse,
  chatCompletions,
  checkOllamaHealth,
} from "../services/ollama.js";
import { authMiddleware, getUser } from "../middleware/auth.js";
import type { AppEnv } from "../types/hono.js";
import { logger } from "../utils/logger.js";
import type { ApiResponse } from "../types/index.js";

const aiRouter = new Hono<AppEnv>();

// Validation schemas
const chatSchema = z.object({
  prompt: z.string().min(1).max(10000),
  context: z.string().max(500).optional(),
  stream: z.boolean().default(false),
});

const openAIChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().max(10000),
      }),
    )
    .min(1)
    .max(50), // cap message history
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().max(4096).optional(),
});

// Metadata extraction schema with strict size limits
const metadataSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1).max(50),
  base64Data: z.string().max(500_000), // ~375KB decoded — enough for text extraction
});

/**
 * Strip prompt injection attempts from user input
 */
function sanitizePrompt(input: string): string {
  return input
    .replace(
      /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
      "[filtered]",
    )
    .replace(/system\s*prompt/gi, "[filtered]")
    .replace(/you\s+are\s+now/gi, "[filtered]")
    .replace(/act\s+as\s+(a\s+)?(?!BMI)/gi, "[filtered]")
    .trim();
}

/**
 * POST /api/v1/ai/chat
 */
aiRouter.post(
  "/chat",
  authMiddleware,
  zValidator("json", chatSchema),
  async (c) => {
    try {
      const { prompt, context } = c.req.valid("json");
      const user = getUser(c);

      const safePrompt = sanitizePrompt(prompt);
      logger.info("AI chat request", {
        user: user?.email,
        promptLength: safePrompt.length,
      });

      const response = await generateAIResponse(safePrompt, context);

      return c.json<ApiResponse<{ response: string }>>({
        success: true,
        data: { response },
      });
    } catch (error) {
      logger.error("AI chat error:", error);
      return c.json<ApiResponse<never>>(
        { success: false, error: "AI service temporarily unavailable" },
        503,
      );
    }
  },
);

/**
 * POST /api/v1/ai/completions
 */
aiRouter.post(
  "/completions",
  authMiddleware,
  zValidator("json", openAIChatSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const response = await chatCompletions(body.messages, {
        temperature: body.temperature,
        max_tokens: body.max_tokens,
      });
      return c.json<ApiResponse<typeof response>>({
        success: true,
        data: response,
      });
    } catch (error) {
      logger.error("AI completions error:", error);
      return c.json<ApiResponse<never>>(
        { success: false, error: "AI service temporarily unavailable" },
        503,
      );
    }
  },
);

/**
 * POST /api/v1/ai/chat/completions
 * Backward-compatible alias for clients expecting /chat/completions.
 */
aiRouter.post(
  "/chat/completions",
  authMiddleware,
  zValidator("json", openAIChatSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const response = await chatCompletions(body.messages, {
        temperature: body.temperature,
        max_tokens: body.max_tokens,
      });
      return c.json<ApiResponse<typeof response>>({
        success: true,
        data: response,
      });
    } catch (error) {
      logger.error("AI completions error:", error);
      return c.json<ApiResponse<never>>(
        { success: false, error: "AI service temporarily unavailable" },
        503,
      );
    }
  },
);

/**
 * GET /api/v1/ai/health
 */
aiRouter.get("/health", async (c) => {
  const health = await checkOllamaHealth();
  return c.json<ApiResponse<typeof health>>(
    {
      success: health.running && health.modelAvailable,
      data: health,
    },
    health.running && health.modelAvailable ? 200 : 503,
  );
});

/**
 * POST /api/v1/ai/extract-metadata
 * Extract metadata from uploaded documents — strict size limits
 */
aiRouter.post(
  "/extract-metadata",
  authMiddleware,
  zValidator("json", metadataSchema),
  async (c) => {
    try {
      const { fileName, fileType } = c.req.valid("json");

      const prompt = `Analyze this document and extract metadata.
File: ${sanitizePrompt(fileName)}
Type: ${sanitizePrompt(fileType)}

Provide a JSON response with:
- title: Document title
- author: Author name (if available)
- year: Publication year (if available)
- category: One of [Theology, ICT, Business, Education, General]
- description: Brief 20-word description

Return ONLY valid JSON, no markdown.`;

      const response = await generateAIResponse(prompt);

      let metadata;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        metadata = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      } catch {
        metadata = {
          title: fileName,
          author: "Unknown",
          year: new Date().getFullYear().toString(),
          category: "General",
          description: "Document uploaded to BMI University system",
        };
      }

      return c.json<ApiResponse<typeof metadata>>({
        success: true,
        data: metadata,
      });
    } catch (error) {
      logger.error("Metadata extraction error:", error);
      return c.json<ApiResponse<never>>(
        { success: false, error: "Failed to extract metadata" },
        500,
      );
    }
  },
);

export default aiRouter;
