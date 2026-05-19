import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import { importRelationalData } from "../services/importService.js";

const importRouter = new Hono();

const importRequestSchema = z
  .object({
    faculties: z.array(z.any()).optional(),
    departments: z.array(z.any()).optional(),
    programs: z.array(z.any()).optional(),
    courses: z.array(z.any()).optional(),
    program_courses: z.array(z.any()).optional(),
    staff: z.array(z.any()).optional(),
    students: z.array(z.any()).optional(),
    enrollments: z.array(z.any()).optional(),
    grades: z.array(z.any()).optional(),
  })
  .passthrough();

importRouter.post("/v2", authMiddleware, requireRole("admin", "registrar"), async (c) => {
  try {
    const rawBody = await c.req.json();
    const parseResult = importRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          error: "Invalid request format",
          details: parseResult.error.issues,
        },
        400,
      );
    }
    const data = parseResult.data;
    logger.info("Starting V2 Relational Import via endpoint");
    
    const results = await importRelationalData(data);
    
    return c.json({ success: true, results });
  } catch (error: unknown) {
    logger.error("V2 import failed", error);
    return c.json({ success: false, error: "Import processing failed" }, 500);
  }
});

export default importRouter;
