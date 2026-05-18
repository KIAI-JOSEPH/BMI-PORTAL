// BMI UMS - Finance Routes
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getPocketBase } from "../services/pocketbase.js";
import { authMiddleware, requireRole, getUser } from "../middleware/auth.js";
import { auditMiddleware, logAction } from "../middleware/audit.js";
import { logger } from "../utils/logger.js";
import {
  parsePagination,
  sanitizeFilter,
  buildFilter,
  pbRecord,
} from "../utils/helpers.js";
import type { ApiResponse, Transaction } from "../types/index.js";

const financeRouter = new Hono();

// Apply auth middleware
financeRouter.use("*", authMiddleware);
financeRouter.use("*", auditMiddleware);

// Validation schemas
const transactionSchema = z.object({
  ref: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  desc: z.string().min(1).max(500),
  amt: z.number().positive().max(10_000_000), // max 10 million per transaction
  status: z.enum(["Paid", "Pending", "Failed"]).default("Pending"),
  date: z.string().min(1),
  studentId: z.string().optional(),
});

const updateTransactionSchema = transactionSchema.partial();

/**
 * GET /api/v1/finance/transactions
 * List all transactions
 */
financeRouter.get(
  "/transactions",
  requireRole("admin", "registrar", "student"),
  async (c) => {
    try {
      const user = getUser(c);
      const pb = getPocketBase();

      // Students can only see their own transactions
      if (user?.role === "student") {
        const { page, perPage } = parsePagination(
          c.req.query("page"),
          c.req.query("perPage"),
          { page: 1, perPage: 20, maxPerPage: 500 },
        );
        const studentId = user?.studentId;
        const result = await pb
          .collection("transactions")
          .getList(page, perPage, {
            filter: `student_id = "${(studentId || "").replace(/["'\\]/g, "")}"`,
            sort: "-date",
          });
        return c.json<ApiResponse<Transaction[]>>({
          success: true,
          data: result.items as unknown as Transaction[],
          meta: {
            page: result.page,
            perPage: result.perPage,
            total: result.totalItems,
          },
        });
      }

      const { page, perPage } = parsePagination(
        c.req.query("page"),
        c.req.query("perPage"),
        { page: 1, perPage: 20, maxPerPage: 500 },
      );

      const status = c.req.query("status");
      const search = c.req.query("search");

      const filters: string[] = [];
      if (status) filters.push(`status = "${sanitizeFilter(status)}"`);
      if (search) {
        const s = sanitizeFilter(search);
        filters.push(`(name ~ "${s}" || ref ~ "${s}" || desc ~ "${s}")`);
      }

      const filterString = buildFilter(filters);

      const result = await pb
        .collection("transactions")
        .getList(page, perPage, {
          ...(filterString ? { filter: filterString } : {}),
          sort: "-date",
        });

      return c.json<ApiResponse<Transaction[]>>({
        success: true,
        data: result.items as unknown as Transaction[],
        meta: {
          page: result.page,
          perPage: result.perPage,
          total: result.totalItems,
        },
      });
    } catch (error) {
      logger.error("Get transactions error:", error);
      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: "Failed to fetch transactions",
        },
        500,
      );
    }
  },
);

/**
 * GET /api/v1/finance/transactions/:id
 * Get a single transaction
 */
financeRouter.get(
  "/transactions/:id",
  requireRole("admin", "registrar", "student"),
  async (c) => {
    try {
      const id = c.req.param("id")!;
      const user = getUser(c);
      const pb = getPocketBase();

      const transaction = await pb.collection("transactions").getOne(id);

      // Students can only access their own transaction
      const studentId = user?.studentId;
      const txStudent = pbRecord<Transaction>(transaction).student_id;
      if (user?.role === "student" && txStudent !== studentId) {
        return c.json({ success: false, error: "Forbidden" }, 403);
      }

      return c.json<ApiResponse<Transaction>>({
        success: true,
        data: transaction as unknown as Transaction,
      });
    } catch (error) {
      logger.error("Get transaction error:", error);
      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: "Transaction not found",
        },
        404,
      );
    }
  },
);

/**
 * POST /api/v1/finance/transactions
 * Create a new transaction
 */
financeRouter.post(
  "/transactions",
  requireRole("admin", "registrar", "staff"),
  zValidator("json", transactionSchema),
  logAction("CREATE", "transactions"),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const pb = getPocketBase();

      const { studentId, ...rest } = data as typeof data & {
        studentId?: string;
      };
      const newTransaction = await pb.collection("transactions").create({
        ...rest,
        ...(studentId ? { student_id: studentId } : {}),
      });

      logger.info("Transaction created", { transactionId: newTransaction.id });

      return c.json<ApiResponse<Transaction>>(
        {
          success: true,
          data: newTransaction as unknown as Transaction,
          message: "Transaction recorded successfully",
        },
        201,
      );
    } catch (error) {
      logger.error("Create transaction error:", error);
      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: "Failed to create transaction",
        },
        500,
      );
    }
  },
);

/**
 * PATCH /api/v1/finance/transactions/:id
 * Update a transaction
 */
financeRouter.patch(
  "/transactions/:id",
  requireRole("admin", "registrar", "staff"),
  zValidator("json", updateTransactionSchema),
  logAction("UPDATE", "transactions"),
  async (c) => {
    try {
      const id = c.req.param("id")!;
      const data = c.req.valid("json");
      const pb = getPocketBase();

      const { studentId, ...rest } = data as typeof data & {
        studentId?: string;
      };
      const payload: Record<string, unknown> = { ...rest };
      if (studentId !== undefined) payload.student_id = studentId;

      const updated = await pb.collection("transactions").update(id, payload);

      logger.info("Transaction updated", { transactionId: id });

      return c.json<ApiResponse<Transaction>>({
        success: true,
        data: updated as unknown as Transaction,
        message: "Transaction updated successfully",
      });
    } catch (error) {
      logger.error("Update transaction error:", error);
      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: "Failed to update transaction",
        },
        500,
      );
    }
  },
);

/**
 * DELETE /api/v1/finance/transactions/:id
 * Delete a transaction
 */
financeRouter.delete(
  "/transactions/:id",
  requireRole("admin"),
  logAction("DELETE", "transactions"),
  async (c) => {
    try {
      const id = c.req.param("id")!;
      const pb = getPocketBase();

      await pb.collection("transactions").delete(id);

      logger.info("Transaction deleted", { transactionId: id });

      return c.json<ApiResponse<null>>({
        success: true,
        data: null,
        message: "Transaction deleted successfully",
      });
    } catch (error) {
      logger.error("Delete transaction error:", error);
      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: "Failed to delete transaction",
        },
        500,
      );
    }
  },
);

/**
 * GET /api/v1/finance/stats
 * Get financial statistics
 */
financeRouter.get("/stats", requireRole("admin", "registrar"), async (c) => {
  try {
    const pb = getPocketBase();

    const [txAll, txPaid, txPending, txFailed] = await Promise.all([
      pb.collection("transactions").getList(1, 1),
      pb
        .collection("transactions")
        .getList(1, 1, { filter: 'status = "Paid"' }),
      pb
        .collection("transactions")
        .getList(1, 1, { filter: 'status = "Pending"' }),
      pb
        .collection("transactions")
        .getList(1, 1, { filter: 'status = "Failed"' }),
    ]);

    // Fetch amounts for revenue calculation (last 5000 paid transactions)
    const paidRecords = await pb.collection("transactions").getList(1, 5000, {
      filter: 'status = "Paid"',
      fields: "amt",
    });
    const pendingRecords = await pb
      .collection("transactions")
      .getList(1, 5000, {
        filter: 'status = "Pending"',
        fields: "amt",
      });
    const failedRecords = await pb.collection("transactions").getList(1, 5000, {
      filter: 'status = "Failed"',
      fields: "amt",
    });

    const totalRevenue = paidRecords.items.reduce(
      (sum: number, t) => sum + (pbRecord<Transaction>(t).amt || 0),
      0,
    );
    const pendingAmount = pendingRecords.items.reduce(
      (sum: number, t) => sum + (pbRecord<Transaction>(t).amt || 0),
      0,
    );
    const failedAmount = failedRecords.items.reduce(
      (sum: number, t) => sum + (pbRecord<Transaction>(t).amt || 0),
      0,
    );

    const stats = {
      totalTransactions: txAll.totalItems,
      totalRevenue,
      pendingAmount,
      failedAmount,
      byStatus: {
        Paid: txPaid.totalItems,
        Pending: txPending.totalItems,
        Failed: txFailed.totalItems,
      },
      averageTransaction:
        paidRecords.items.length > 0
          ? (totalRevenue as number) / paidRecords.items.length
          : 0,
    };

    return c.json<ApiResponse<typeof stats>>({ success: true, data: stats });
  } catch (error) {
    logger.error("Get finance stats error:", error);
    return c.json<ApiResponse<never>>(
      { success: false, error: "Failed to fetch statistics" },
      500,
    );
  }
});

/**
 * GET /api/v1/finance/reports/monthly
 * Get monthly financial report
 */
financeRouter.get(
  "/reports/monthly",
  requireRole("admin", "registrar"),
  async (c) => {
    try {
      const rawYear =
        c.req.query("year") || new Date().getFullYear().toString();
      const year = /^\d{4}$/.test(rawYear)
        ? rawYear
        : new Date().getFullYear().toString();
      const pb = getPocketBase();

      const transactions = (await pb
        .collection("transactions")
        .getList(1, 5000, {
          filter: `date >= "${year}-01-01" && date <= "${year}-12-31"`,
          fields: "date,status,amt",
        })) as { items: Transaction[] };

      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthStr = month.toString().padStart(2, "0");
        const monthTx = transactions.items.filter((t: Transaction) =>
          t.date?.startsWith(`${year}-${monthStr}`),
        );
        return {
          month,
          monthName: new Date(`${year}-${monthStr}-01`).toLocaleString(
            "en-US",
            { month: "short" },
          ),
          revenue: monthTx
            .filter((t: Transaction) => t.status === "Paid")
            .reduce((sum: number, t: Transaction) => sum + (t.amt || 0), 0),
          pending: monthTx
            .filter((t: Transaction) => t.status === "Pending")
            .reduce((sum: number, t: Transaction) => sum + (t.amt || 0), 0),
          count: monthTx.length,
        };
      });

      return c.json<ApiResponse<typeof monthlyData>>({
        success: true,
        data: monthlyData,
      });
    } catch (error) {
      logger.error("Get monthly report error:", error);
      return c.json<ApiResponse<never>>(
        { success: false, error: "Failed to generate report" },
        500,
      );
    }
  },
);

export default financeRouter;
