/**
 * BMI UMS - University Grading System
 * Main barrel export for the grading system module
 * 
 * This module provides a comprehensive, world-class grading system supporting:
 * - Multiple international grading scales (US 4.0, ECTS, Percentage, Custom)
 * - Weighted assessment components
 * - Multi-level GPA calculations (course, semester, cumulative)
 * - Grade analytics and distributions
 * - Academic standing determinations
 * - Grade appeal workflows
 * - Audit trails and compliance
 */

// Core types
export * from './types';

// Domain models
export * from './models';

// Services
export * from './services';

// Calculators
export * from './calculators';

// Engines
export * from './engines';

// Repositories
export * from './repositories';

// Utilities
export * from './utils';
