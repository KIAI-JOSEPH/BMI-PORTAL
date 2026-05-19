// BMI UMS - Campuses Routes
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getPocketBase, authenticateAdmin } from "../services/pocketbase.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { auditMiddleware, logAction } from "../middleware/audit.js";
import { logger } from "../utils/logger.js";
import { parsePagination, sanitizeFilter } from "../utils/helpers.js";
import { ApiResponseSchema, ErrorResponseSchema } from "../openapi/common.js";
import type { AppEnv } from "../types/hono.js";

const campusesRouter = new OpenAPIHono<AppEnv>();

// Apply middleware
campusesRouter.use("*", authMiddleware);
campusesRouter.use("*", auditMiddleware);

// Validation schemas
const CampusSchema = z
  .object({
    id: z.string().openapi({ example: "123" }),
    name: z.string().openapi({ example: "Main Campus" }),
    code: z.string().openapi({ example: "MAIN" }),
    location: z.string().openapi({ example: "Nairobi, Kenya" }),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
    created: z.string().openapi({ example: "2024-05-19T03:15:05Z" }),
    updated: z.string().openapi({ example: "2024-05-19T03:15:05Z" }),
  })
  .openapi("Campus");

const CampusInputSchema = z
  .object({
    name: z.string().min(1).max(100).openapi({ example: "Main Campus" }),
    code: z.string().min(1).max(50).openapi({ example: "MAIN" }),
    location: z.string().min(1).max(100).openapi({ example: "Nairobi, Kenya" }),
    status: z.enum(["active", "inactive"]).default("active"),
  })
  .openapi("CampusInput");

// Route definitions
const listCampusesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Campuses"],
  summary: "List campuses",
  description: "List all campuses with pagination and filtering",
  request: {
    query: z.object({
      page: z.string().optional().openapi({ example: "1" }),
      perPage: z.string().optional().openapi({ example: "50" }),
      status: z.string().optional().openapi({ example: "active" }),
      search: z.string().optional().openapi({ example: "Main" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(z.array(CampusSchema)),
        },
      },
      description: "List of campuses",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

const listAllCampusesRoute = createRoute({
  method: "get",
  path: "/all",
  tags: ["Campuses"],
  summary: "List all campuses (no pagination)",
  description: "Get a full list of all active campuses for dropdowns",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(z.array(CampusSchema)),
        },
      },
      description: "All active campuses",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

const getCampusRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Campuses"],
  summary: "Get campus by ID",
  description: "Get details of a single campus",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(CampusSchema),
        },
      },
      description: "Campus details",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Campus not found",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

const createCampusRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Campuses"],
  summary: "Create campus",
  description: "Create a new campus record",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CampusInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(CampusSchema),
        },
      },
      description: "Campus created successfully",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

const updateCampusRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Campuses"],
  summary: "Update campus",
  description: "Update an existing campus record",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: CampusInputSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(CampusSchema),
        },
      },
      description: "Campus updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Campus not found",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

const deleteCampusRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Campuses"],
  summary: "Delete campus",
  description: "Delete a campus record",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(z.null()),
        },
      },
      description: "Campus deleted successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Campus not found",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

// Implement routes
campusesRouter.openapi(listCampusesRoute, async (c) => {
  try {
    const pb = getPocketBase();
    if (!pb.authStore.isValid) {
      await authenticateAdmin();
    }

    const { page: p, perPage: pp, status, search } = c.req.valid("query");
    const { page, perPage } = parsePagination(p, pp, {
      page: 1,
      perPage: 50,
      maxPerPage: 100,
    });

    const filters: string[] = [];
    if (status) filters.push(`status = "${sanitizeFilter(status)}"`);
    if (search) {
      const s = sanitizeFilter(search);
      filters.push(`(name ~ "${s}" || code ~ "${s}" || location ~ "${s}")`);
    }

    const filterString = filters.length > 0 ? filters.join(" && ") : "";

    const result = await pb.collection("campuses").getList(page, perPage, {
      sort: "name",
      ...(filterString ? { filter: filterString } : {}),
    });

    return c.json({
      success: true,
      data: result.items as any,
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.totalItems,
      },
    });
  } catch (error) {
    logger.error("Get campuses error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch campuses",
      },
      500,
    );
  }
});

campusesRouter.openapi(listAllCampusesRoute, async (c) => {
  try {
    const pb = getPocketBase();
    const result = await pb.collection("campuses").getFullList({
      filter: 'status = "active"',
      sort: "name",
    });

    return c.json({
      success: true,
      data: result as any,
    });
  } catch (error) {
    logger.error("Get all campuses error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch all campuses",
      },
      500,
    );
  }
});

campusesRouter.openapi(getCampusRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const pb = getPocketBase();
    const campus = await pb.collection("campuses").getOne(id);

    return c.json({
      success: true,
      data: campus as any,
    });
  } catch (error) {
    logger.error("Get campus error:", error);
    return c.json(
      {
        success: false,
        error: "Campus not found",
      },
      404,
    );
  }
});

campusesRouter.openapi(createCampusRoute, requireRole("admin"), async (c) => {
  try {
    const data = c.req.valid("json");
    const pb = getPocketBase();
    const campus = await pb.collection("campuses").create(data);

    return c.json(
      {
        success: true,
        data: campus as any,
        message: "Campus created successfully",
      },
      201,
    );
  } catch (error) {
    logger.error("Create campus error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to create campus",
      },
      500,
    );
  }
});

campusesRouter.openapi(updateCampusRoute, requireRole("admin"), async (c) => {
  try {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const pb = getPocketBase();
    const campus = await pb.collection("campuses").update(id, data);

    return c.json({
      success: true,
      data: campus as any,
      message: "Campus updated successfully",
    });
  } catch (error) {
    logger.error("Update campus error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to update campus",
      },
      500,
    );
  }
});

campusesRouter.openapi(deleteCampusRoute, requireRole("admin"), async (c) => {
  try {
    const { id } = c.req.valid("param");
    const pb = getPocketBase();
    await pb.collection("campuses").delete(id);

    return c.json({
      success: true,
      data: null,
      message: "Campus deleted successfully",
    });
  } catch (error) {
    logger.error("Delete campus error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to delete campus",
      },
      500,
    );
  }
});

export default campusesRouter;
