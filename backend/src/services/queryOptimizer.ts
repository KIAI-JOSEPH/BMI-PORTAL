/**
 * BMI UMS - Query Optimizer
 * Implements eager loading, caching, and query optimization patterns
 */

import { withPocketBase } from './pocketbasePool.js';
import { logger } from '../utils/logger.js';

/**
 * In-memory cache for reference data
 * Reference data changes infrequently, so caching dramatically improves performance
 */
class QueryCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  set(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

const queryCache = new QueryCache();

/**
 * Query options for optimization
 */
export interface QueryOptions {
  expand?: string | string[];
  filter?: string;
  sort?: string;
  page?: number;
  perPage?: number;
  cache?: boolean;
  cacheTTL?: number;
}

/**
 * Optimized query builder
 */
export class OptimizedQuery {
  private collection: string;
  private options: QueryOptions = {};
  
  constructor(collection: string) {
    this.collection = collection;
  }
  
  /**
   * Add eager loading (expand relations)
   */
  expand(relations: string | string[]): this {
    this.options.expand = Array.isArray(relations) ? relations.join(',') : relations;
    return this;
  }
  
  /**
   * Add filter
   */
  filter(filter: string): this {
    this.options.filter = filter;
    return this;
  }
  
  /**
   * Add sorting
   */
  sort(sort: string): this {
    this.options.sort = sort;
    return this;
  }
  
  /**
   * Add pagination
   */
  paginate(page: number, perPage: number = 50): this {
    this.options.page = page;
    this.options.perPage = perPage;
    return this;
  }
  
  /**
   * Enable caching
   */
  cached(ttl: number = 300000): this {
    this.options.cache = true;
    this.options.cacheTTL = ttl;
    return this;
  }
  
  /**
   * Execute the query
   */
  async execute(): Promise<any> {
    const cacheKey = this.getCacheKey();
    
    // Check cache if enabled
    if (this.options.cache) {
      const cached = queryCache.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return cached;
      }
    }
    
    // Execute query
    const start = Date.now();
    const result = await withPocketBase(async (pb) => {
      const { page = 1, perPage = 50, expand, filter, sort } = this.options;
      
      return pb.collection(this.collection).getList(page, perPage, {
        expand,
        filter,
        sort,
      });
    });
    
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 500) {
      logger.warn(`Slow query detected: ${this.collection} (${duration}ms)`, {
        collection: this.collection,
        options: this.options,
      });
    }
    
    // Cache result if enabled
    if (this.options.cache) {
      queryCache.set(cacheKey, result, this.options.cacheTTL);
    }
    
    return result;
  }
  
  /**
   * Execute and get first item
   */
  async first(): Promise<any> {
    this.options.perPage = 1;
    const result = await this.execute();
    return result.items[0] || null;
  }
  
  /**
   * Get cache key for this query
   */
  private getCacheKey(): string {
    return `${this.collection}:${JSON.stringify(this.options)}`;
  }
}

/**
 * Create an optimized query
 */
export function query(collection: string): OptimizedQuery {
  return new OptimizedQuery(collection);
}

/**
 * Batch load multiple records by IDs (DataLoader pattern)
 */
export async function batchLoad(
  collection: string,
  ids: string[],
  expand?: string
): Promise<Map<string, any>> {
  if (ids.length === 0) {
    return new Map();
  }
  
  const result = await withPocketBase(async (pb) => {
    const filter = ids.map(id => `id="${id}"`).join(' || ');
    return pb.collection(collection).getList(1, ids.length, {
      filter,
      expand,
    });
  });
  
  const map = new Map();
  for (const item of result.items) {
    map.set(item.id, item);
  }
  
  return map;
}

/**
 * Optimized student queries with eager loading
 */
export const StudentQueries = {
  /**
   * Get students with campus and academic records
   */
  async getWithRelations(filters: {
    page?: number;
    perPage?: number;
    campusId?: string;
    status?: string;
    search?: string;
  } = {}) {
    const { page = 1, perPage = 50, campusId, status, search } = filters;
    
    let filterStr = '';
    const conditions: string[] = [];
    
    if (campusId) conditions.push(`campus_id="${campusId}"`);
    if (status) conditions.push(`status="${status}"`);
    if (search) {
      conditions.push(`(full_name~"${search}" || student_code~"${search}" || reg_no~"${search}")`);
    }
    
    if (conditions.length > 0) {
      filterStr = conditions.join(' && ');
    }
    
    const result = await query('students')
      .expand(['campus_id', 'academic_records_via_student_id'])
      .filter(filterStr)
      .sort('-created')
      .paginate(page, perPage)
      .execute();

    // Normalise names: split full_name into first_name / last_name when absent
    result.items = result.items.map((s: any) => {
      if (s.full_name && !s.first_name) {
        const parts = s.full_name.trim().split(/\s+/);
        return { ...s, first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' };
      }
      return s;
    });

    return result;
  },
  
  /**
   * Get student with full academic history
   */
  async getWithAcademicHistory(studentId: string) {
    return withPocketBase(async (pb) => {
      let student = await pb.collection('students').getOne(studentId, {
        expand: 'campus_id',
      });
      // Ensure first_name/last_name are always populated from full_name
      // (our import stores full_name; split here so every caller gets consistent data)
      if (student.full_name && !student.first_name) {
        const parts = student.full_name.trim().split(/\s+/);
        student = { ...student, first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' };
      }
      
      const academicRecords = await pb.collection('academic_records').getList(1, 100, {
        filter: `student_id="${studentId}"`,
        expand: 'course_id,course_id.module_id',
        sort: '-academic_year,-semester',
      });
      
      return {
        ...student,
        academic_records: academicRecords.items,
      };
    });
  },
  
  /**
   * Get students by campus (cached)
   */
  async getByCampus(campusId: string) {
    return query('students')
      .expand('campus_id')
      .filter(`campus_id="${campusId}"`)
      .sort('full_name')
      .cached(600000) // Cache for 10 minutes
      .execute();
  },
};

/**
 * Optimized academic record queries
 */
export const AcademicRecordQueries = {
  /**
   * Get academic records with student and course details
   */
  async getWithDetails(filters: {
    page?: number;
    perPage?: number;
    studentId?: string;
    courseId?: string;
    academicYear?: string;
    semester?: string;
  } = {}) {
    const { page = 1, perPage = 50, studentId, courseId, academicYear, semester } = filters;
    
    const conditions: string[] = [];
    if (studentId) conditions.push(`student_id="${studentId}"`);
    if (courseId) conditions.push(`course_id="${courseId}"`);
    if (academicYear) conditions.push(`academic_year="${academicYear}"`);
    if (semester) conditions.push(`semester="${semester}"`);
    
    const filterStr = conditions.length > 0 ? conditions.join(' && ') : '';
    
    return query('academic_records')
      .expand(['student_id', 'course_id', 'course_id.module_id'])
      .filter(filterStr)
      .sort('-academic_year,-semester')
      .paginate(page, perPage)
      .execute();
  },
  
  /**
   * Get student transcript (all academic records)
   */
  async getTranscript(studentId: string) {
    return query('academic_records')
      .expand(['course_id', 'course_id.module_id'])
      .filter(`student_id="${studentId}"`)
      .sort('-academic_year,-semester')
      .paginate(1, 500)
      .execute();
  },
};

/**
 * Optimized course queries
 */
export const CourseQueries = {
  /**
   * Get courses with module details
   */
  async getWithModules(filters: {
    page?: number;
    perPage?: number;
    moduleId?: string;
  } = {}) {
    const { page = 1, perPage = 50, moduleId } = filters;
    
    const filterStr = moduleId ? `module_id="${moduleId}"` : '';
    
    return query('courses')
      .expand('module_id')
      .filter(filterStr)
      .sort('code')
      .paginate(page, perPage)
      .cached(600000) // Cache for 10 minutes (courses change infrequently)
      .execute();
  },
};

/**
 * Reference data queries (heavily cached)
 */
export const ReferenceDataQueries = {
  /**
   * Get all campuses (cached)
   */
  async getCampuses() {
    return query('campuses')
      .sort('name')
      .paginate(1, 100)
      .cached(1800000) // Cache for 30 minutes
      .execute();
  },
  
  /**
   * Get all modules (cached)
   */
  async getModules() {
    return query('modules')
      .sort('sort_order')
      .paginate(1, 100)
      .cached(1800000) // Cache for 30 minutes
      .execute();
  },
};

/**
 * Cache management
 */
export const CacheManager = {
  /**
   * Invalidate cache for a collection
   */
  invalidate(collection: string): void {
    queryCache.invalidatePattern(`^${collection}:`);
    logger.info(`Cache invalidated for collection: ${collection}`);
  },
  
  /**
   * Clear all cache
   */
  clearAll(): void {
    queryCache.clear();
    logger.info('All cache cleared');
  },
  
  /**
   * Get cache statistics
   */
  getStats() {
    return queryCache.getStats();
  },
};

/**
 * Query performance monitoring
 */
export class QueryMonitor {
  private static queries: Array<{
    collection: string;
    duration: number;
    timestamp: number;
    options: any;
  }> = [];
  
  static log(collection: string, duration: number, options: any): void {
    this.queries.push({
      collection,
      duration,
      timestamp: Date.now(),
      options,
    });
    
    // Keep only last 1000 queries
    if (this.queries.length > 1000) {
      this.queries.shift();
    }
  }
  
  static getStats(): {
    totalQueries: number;
    avgDuration: number;
    slowQueries: number;
    byCollection: Record<string, { count: number; avgDuration: number }>;
  } {
    const byCollection: Record<string, { count: number; totalDuration: number }> = {};
    let slowQueries = 0;
    
    for (const query of this.queries) {
      if (!byCollection[query.collection]) {
        byCollection[query.collection] = { count: 0, totalDuration: 0 };
      }
      byCollection[query.collection].count++;
      byCollection[query.collection].totalDuration += query.duration;
      
      if (query.duration > 500) {
        slowQueries++;
      }
    }
    
    const totalDuration = this.queries.reduce((sum, q) => sum + q.duration, 0);
    
    return {
      totalQueries: this.queries.length,
      avgDuration: this.queries.length > 0 ? totalDuration / this.queries.length : 0,
      slowQueries,
      byCollection: Object.fromEntries(
        Object.entries(byCollection).map(([name, stats]) => [
          name,
          {
            count: stats.count,
            avgDuration: stats.totalDuration / stats.count,
          },
        ])
      ),
    };
  }
}
