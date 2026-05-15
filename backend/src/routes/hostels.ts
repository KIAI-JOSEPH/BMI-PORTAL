/**
 * BMI UMS - Hostels Routes
 * API-backed CRUD for hostel management (previously localStorage-only).
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import type { ApiResponse } from '../types/index.js';

const hostelRouter = new Hono();
hostelRouter.use('*', authMiddleware);

const hostelSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['Male', 'Female']),
  capacity: z.number().int().positive(),
  location: z.string().min(1),
  status: z.enum(['Available', 'Near Capacity', 'Full']).default('Available'),
});

const roomAssignmentSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  hostelId: z.string().min(1),
  roomNumber: z.string().min(1),
  checkInDate: z.string(),
  status: z.enum(['Active', 'Revoked']).default('Active'),
});

// GET /api/v1/hostels — List all hostels
hostelRouter.get('/', async (c) => {
  try {
    const pb = getPocketBase();
    const records = await pb.collection('hostels').getFullList({ sort: '-created' });
    return c.json<ApiResponse<any>>({ success: true, data: records });
  } catch (error) {
    logger.error('List hostels error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to fetch hostels' }, 500);
  }
});

// POST /api/v1/hostels — Create a hostel
hostelRouter.post('/', requireRole('admin', 'registrar', 'staff'), zValidator('json', hostelSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const pb = getPocketBase();
    const record = await pb.collection('hostels').create(data);
    return c.json<ApiResponse<any>>({ success: true, data: record }, 201);
  } catch (error) {
    logger.error('Create hostel error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to create hostel' }, 500);
  }
});

// PATCH /api/v1/hostels/:id — Update a hostel
hostelRouter.patch('/:id', requireRole('admin', 'registrar', 'staff'), zValidator('json', hostelSchema.partial()), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const pb = getPocketBase();
    const record = await pb.collection('hostels').update(id, data);
    return c.json<ApiResponse<any>>({ success: true, data: record });
  } catch (error) {
    logger.error('Update hostel error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to update hostel' }, 500);
  }
});

// DELETE /api/v1/hostels/:id — Delete a hostel
hostelRouter.delete('/:id', requireRole('admin', 'registrar'), async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    await pb.collection('hostels').delete(id);
    return c.json<ApiResponse<null>>({ success: true, data: null });
  } catch (error) {
    logger.error('Delete hostel error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to delete hostel' }, 500);
  }
});

// GET /api/v1/hostels/assignments — List room assignments
hostelRouter.get('/assignments', async (c) => {
  try {
    const pb = getPocketBase();
    const records = await pb.collection('room_assignments').getFullList({ sort: '-created' });
    return c.json<ApiResponse<any>>({ success: true, data: records });
  } catch (error) {
    logger.error('List room assignments error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to fetch room assignments' }, 500);
  }
});

// POST /api/v1/hostels/assignments — Create a room assignment
hostelRouter.post('/assignments', requireRole('admin', 'registrar', 'staff'), zValidator('json', roomAssignmentSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const pb = getPocketBase();
    const record = await pb.collection('room_assignments').create(data);
    return c.json<ApiResponse<any>>({ success: true, data: record }, 201);
  } catch (error) {
    logger.error('Create room assignment error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to create room assignment' }, 500);
  }
});

export default hostelRouter;
