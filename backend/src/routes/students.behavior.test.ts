import { describe, it, expect, vi } from "vitest";
import studentsRouter from "./students.js";

// Mock the query optimizer so StudentQueries.getWithRelations returns test data
vi.mock("../services/queryOptimizer.js", () => ({
  StudentQueries: {
    getWithRelations: vi.fn().mockResolvedValue({
      items: [
        {
          id: "s1",
          student_code: "BMI-2024-0001",
          full_name: "John Doe",
          first_name: "John",
          last_name: "Doe",
          gender: "Male",
          email: "john@example.com",
          phone: "",
          programme: "GENERAL",
          admission_date: "2024-01-01",
          status: "Active",
          avatar_color: "bg-blue-600",
          photo_zoom: 1,
        },
      ],
      page: 1,
      perPage: 50,
      totalItems: 1,
    }),
    getWithAcademicHistory: vi.fn(),
    getByCampus: vi.fn(),
  },
  CacheManager: {
    invalidate: vi.fn(),
  },
}));

vi.mock("../services/pocketbasePool.js", () => ({
  withPocketBase: vi.fn(async (fn: (pb: any) => any) => {
    const pbMock = {
      collection: () => ({
        create: vi.fn().mockResolvedValue({ id: "s1" }),
        update: vi.fn().mockResolvedValue({ id: "s1" }),
        delete: vi.fn().mockResolvedValue({}),
        getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
      }),
    };
    return fn(pbMock);
  }),
}));

const mockUser = { sub: "u1", email: "admin@example.com", role: "admin" };
const getPocketBaseMock = vi.fn();

vi.mock("../services/pocketbase.js", () => ({
  getPocketBase: () => getPocketBaseMock(),
}));

vi.mock("../middleware/auth.js", () => ({
  authMiddleware: async (c: any, next: any) => {
    c.set("user", mockUser);
    await next();
  },
  optionalAuthMiddleware: async (c: any, next: any) => {
    c.set("user", mockUser);
    await next();
  },
  getUser: (c: any) => c.get("user"),
  requireRole: (...allowedRoles: string[]) => {
    return async (c: any, next: any) => {
      const user = c.get("user");
      if (!user)
        return c.json(
          { success: false, error: "Authentication required" },
          401,
        );
      if (!allowedRoles.includes(user.role)) {
        return c.json(
          { success: false, error: "Access denied: insufficient permissions" },
          403,
        );
      }
      await next();
    };
  },
}));

vi.mock("../middleware/audit.js", () => ({
  auditMiddleware: async (_c: any, next: any) => next(),
  logAction: () => async (_c: any, next: any) => next(),
}));

vi.mock("../utils/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe("Students route behavior", () => {
  it("GET /api/v1/students returns wrapped list + meta for admin", async () => {
    const getListMock = vi.fn().mockResolvedValue({
      items: [
        {
          id: "s1",
          student_number: "BMI-2024-0001",
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          phone: "",
          gender: "Male",
          program_code: "GENERAL",
          admission_date: "2024-01-01",
          status: "Active",
        },
      ],
      page: 1,
      perPage: 20,
      totalItems: 1,
    });

    getPocketBaseMock.mockReturnValue({
      authStore: { isValid: true },
      collection: () => ({
        getList: getListMock,
      }),
    });

    const req = new Request("http://localhost/", { method: "GET" });
    const res = await studentsRouter.fetch(req);

    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    // The route uses StudentQueries.getWithRelations (queryOptimizer), not direct pb getList
    expect(json.meta.page).toBe(1);
    expect(json.meta.perPage).toBe(50);
    expect(json.meta.total).toBe(1);
  });
});
