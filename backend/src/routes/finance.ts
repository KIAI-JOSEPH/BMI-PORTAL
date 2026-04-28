// BMI UMS - Finance Routes
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { auditMiddleware, logAction } from '../middleware/audit.js';
import { logger } from '../utils/logger.js';
import { parsePagination, formatCurrency } from '../utils/helpers.js';
import type { ApiResponse, Transaction } from '../types/index.js';

const financeRouter = new Hono();

// Apply auth middleware
financeRouter.use('*', authMiddleware);
financeRouter.use('*', auditMiddleware);

// Validation schemas
const transactionSchema = z.object({
  ref: z.string().min(1),
  name: z.string().min(1),
  desc: z.string().min(1),
  amt: z.number().positive(),
  status: z.enum(['Paid', 'Pending', 'Failed']).default('Pending'),
  date: z.string().min(1),
  studentId: z.string().optional(),
});

const updateTransactionSchema = transactionSchema.partial();

/**
 * GET /api/v1/finance/transactions
 * List all transactions
 */
financeRouter.get('/transactions', async (c) => {
  try {
    const pb = getPocketBase();
    
    const { page, perPage } = parsePagination(
      c.req.query('page'),
      c.req.query('perPage'),
      { page: 1, perPage: 20, maxPerPage: 100 }
    );
    
    const status = c.req.query('status');
    const search = c.req.query('search');
    
    const filters: string[] = [];
    if (status) filters.push(`status = "${status}"`);
    if (search) {
      filters.push(`(name ~ "${search}" || ref ~ "${search}" || desc ~ "${search}")`);
    }
    
    const filterString = filters.join(' && ') || undefined;
    
    const result = await pb.collection('transactions').getList(page, perPage, {
      filter: filterString,
      sort: '-date',
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
    logger.error('Get transactions error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch transactions',
    }, 500);
  }
});

/**
 * GET /api/v1/finance/transactions/:id
 * Get a single transaction
 */
financeRouter.get('/transactions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    const transaction = await pb.collection('transactions').getOne(id);
    
    return c.json<ApiResponse<Transaction>>({
      success: true,
      data: transaction as unknown as Transaction,
    });
    
  } catch (error) {
    logger.error('Get transaction error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Transaction not found',
    }, 404);
  }
});

/**
 * POST /api/v1/finance/transactions
 * Create a new transaction
 */
financeRouter.post(
  '/transactions',
  requireRole('admin', 'registrar', 'staff'),
  zValidator('json', transactionSchema),
  logAction('CREATE', 'transactions'),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const pb = getPocketBase();
      
      const newTransaction = await pb.collection('transactions').create(data);
      
      logger.info('Transaction created', { transactionId: newTransaction.id });
      
      return c.json<ApiResponse<Transaction>>({
        success: true,
        data: newTransaction as unknown as Transaction,
        message: 'Transaction recorded successfully',
      }, 201);
      
    } catch (error) {
      logger.error('Create transaction error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to create transaction',
      }, 500);
    }
  }
);

/**
 * PATCH /api/v1/finance/transactions/:id
 * Update a transaction
 */
financeRouter.patch(
  '/transactions/:id',
  requireRole('admin', 'registrar', 'staff'),
  zValidator('json', updateTransactionSchema),
  logAction('UPDATE', 'transactions'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const pb = getPocketBase();
      
      const updated = await pb.collection('transactions').update(id, data);
      
      logger.info('Transaction updated', { transactionId: id });
      
      return c.json<ApiResponse<Transaction>>({
        success: true,
        data: updated as unknown as Transaction,
        message: 'Transaction updated successfully',
      });
      
    } catch (error) {
      logger.error('Update transaction error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to update transaction',
      }, 500);
    }
  }
);

/**
 * DELETE /api/v1/finance/transactions/:id
 * Delete a transaction
 */
financeRouter.delete(
  '/transactions/:id',
  requireRole('admin'),
  logAction('DELETE', 'transactions'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const pb = getPocketBase();
      
      await pb.collection('transactions').delete(id);
      
      logger.info('Transaction deleted', { transactionId: id });
      
      return c.json<ApiResponse<null>>({
        success: true,
        data: null,
        message: 'Transaction deleted successfully',
      });
      
    } catch (error) {
      logger.error('Delete transaction error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to delete transaction',
      }, 500);
    }
  }
);

/**
 * GET /api/v1/finance/stats
 * Get financial statistics
 */
financeRouter.get('/stats', async (c) => {
  try {
    const pb = getPocketBase();
    
    const allTransactions = await pb.collection('transactions').getFullList();
    const transactions = allTransactions as unknown as Transaction[];
    
    const paidTransactions = transactions.filter(t => t.status === 'Paid');
    const pendingTransactions = transactions.filter(t => t.status === 'Pending');
    const failedTransactions = transactions.filter(t => t.status === 'Failed');
    
    const stats = {
      totalTransactions: transactions.length,
      totalRevenue: paidTransactions.reduce((sum, t) => sum + t.amt, 0),
      pendingAmount: pendingTransactions.reduce((sum, t) => sum + t.amt, 0),
      failedAmount: failedTransactions.reduce((sum, t) => sum + t.amt, 0),
      byStatus: {
        Paid: paidTransactions.length,
        Pending: pendingTransactions.length,
        Failed: failedTransactions.length,
      },
      averageTransaction: paidTransactions.length > 0 
        ? paidTransactions.reduce((sum, t) => sum + t.amt, 0) / paidTransactions.length 
        : 0,
    };
    
    return c.json<ApiResponse<typeof stats>>({
      success: true,
      data: stats,
    });
    
  } catch (error) {
    logger.error('Get finance stats error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch statistics',
    }, 500);
  }
});

/**
 * GET /api/v1/finance/reports/monthly
 * Get monthly financial report
 */
financeRouter.get('/reports/monthly', requireRole('admin', 'registrar'), async (c) => {
  try {
    const year = c.req.query('year') || new Date().getFullYear().toString();
    const pb = getPocketBase();
    
    const transactions = await pb.collection('transactions').getFullList({
      filter: `date >= "${year}-01-01" && date <= "${year}-12-31"`,
    }) as unknown as Transaction[];
    
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthStr = month.toString().padStart(2, '0');
      const monthTransactions = transactions.filter(t => t.date.startsWith(`${year}-${monthStr}`));
      
      return {
        month,
        monthName: new Date(`${year}-${monthStr}-01`).toLocaleString('en-US', { month: 'short' }),
        revenue: monthTransactions.filter(t => t.status === 'Paid').reduce((sum, t) => sum + t.amt, 0),
        pending: monthTransactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amt, 0),
        count: monthTransactions.length,
      };
    });
    
    return c.json<ApiResponse<typeof monthlyData>>({
      success: true,
      data: monthlyData,
    });
    
  } catch (error) {
    logger.error('Get monthly report error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to generate report',
    }, 500);
  }
});

export default financeRouter;
