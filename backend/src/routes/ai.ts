// BMI UMS - AI Routes (Local LLM via Ollama)
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { generateAIResponse, chatCompletions, checkOllamaHealth } from '../services/ollama.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import type { ApiResponse } from '../types/index.js';

const aiRouter = new Hono();

// Validation schema
const chatSchema = z.object({
  prompt: z.string().min(1).max(10000),
  context: z.string().optional(),
  stream: z.boolean().default(false),
});

const openAIChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })).min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
});

/**
 * POST /api/v1/ai/chat
 * Send a message to the local AI assistant
 */
aiRouter.post('/chat', authMiddleware, zValidator('json', chatSchema), async (c) => {
  try {
    const { prompt, context } = c.req.valid('json');
    const user = c.get('user') as { email: string } | undefined;
    
    logger.info('AI chat request', { user: user?.email, promptLength: prompt.length });
    
    const response = await generateAIResponse(prompt, context);
    
    return c.json<ApiResponse<{ response: string }>>({
      success: true,
      data: { response },
    });
    
  } catch (error) {
    logger.error('AI chat error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'AI service temporarily unavailable',
    }, 503);
  }
});

/**
 * POST /api/v1/ai/completions
 * OpenAI-compatible chat completions endpoint
 */
aiRouter.post('/completions', authMiddleware, zValidator('json', openAIChatSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    
    const response = await chatCompletions(body.messages, {
      temperature: body.temperature,
      max_tokens: body.max_tokens,
    });
    
    return c.json(response);
    
  } catch (error) {
    logger.error('AI completions error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'AI service temporarily unavailable',
    }, 503);
  }
});

/**
 * GET /api/v1/ai/health
 * Check Ollama service health
 */
aiRouter.get('/health', async (c) => {
  const health = await checkOllamaHealth();
  
  return c.json<ApiResponse<typeof health>>({
    success: health.running && health.modelAvailable,
    data: health,
  }, health.running && health.modelAvailable ? 200 : 503);
});

/**
 * POST /api/v1/ai/extract-metadata
 * Extract metadata from uploaded documents using AI
 */
aiRouter.post('/extract-metadata', authMiddleware, async (c) => {
  try {
    const body = await c.req.json<{ fileName: string; fileType: string; base64Data: string }>();
    
    const prompt = `Analyze this document and extract metadata:
File: ${body.fileName}
Type: ${body.fileType}

Provide a JSON response with:
- title: Document title
- author: Author name (if available)
- year: Publication year (if available)
- category: One of [Theology, ICT, Business, Education, General]
- description: Brief 20-word description

Return ONLY valid JSON.`;
    
    const response = await generateAIResponse(prompt);
    
    // Parse JSON from response
    let metadata;
    try {
      // Try to extract JSON from markdown code blocks or raw response
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || 
                        response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
      metadata = JSON.parse(jsonStr);
    } catch {
      metadata = {
        title: body.fileName,
        author: 'Unknown',
        year: new Date().getFullYear().toString(),
        category: 'General',
        description: 'Document uploaded to BMI University system',
      };
    }
    
    return c.json<ApiResponse<typeof metadata>>({
      success: true,
      data: metadata,
    });
    
  } catch (error) {
    logger.error('Metadata extraction error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to extract metadata',
    }, 500);
  }
});

export default aiRouter;
