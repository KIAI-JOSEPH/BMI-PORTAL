/**
 * BMI UMS - Weighted Grade Calculator Tests
 */
import { describe, it, expect } from 'vitest';
import { calculateWeightedGrade } from './WeightedGradeCalculator';
import { AssessmentComponent, GradeStatus } from '../types';

describe('WeightedGradeCalculator', () => {
  const mockComponents: AssessmentComponent[] = [
    { id: '1', name: 'Assignment 1', weight: 20, type: 'ASSIGNMENT', minScore: 0, maxScore: 100, isMandatory: true },
    { id: '2', name: 'Midterm', weight: 30, type: 'EXAM', minScore: 0, maxScore: 100, isMandatory: true },
    { id: '3', name: 'Final Exam', weight: 50, type: 'EXAM', minScore: 0, maxScore: 100, isMandatory: true },
  ];

  it('calculates perfect score correctly', () => {
    const scores = [
      { componentId: '1', componentType: 'ASSIGNMENT', score: 100, maxScore: 100, weight: 20 },
      { componentId: '2', componentType: 'EXAM', score: 100, maxScore: 100, weight: 30 },
      { componentId: '3', componentType: 'EXAM', score: 100, maxScore: 100, weight: 50 },
    ];

    const result = calculateWeightedGrade(mockComponents, scores);
    expect(result.finalGrade).toBe(100);
    expect(result.status).toBe(GradeStatus.PENDING_REVIEW);
    expect(result.isComplete).toBe(true);
  });

  it('calculates partial scores correctly', () => {
    const scores = [
      { componentId: '1', componentType: 'ASSIGNMENT', score: 80, maxScore: 100, weight: 20 }, // 16 pts
      { componentId: '2', componentType: 'EXAM', score: 70, maxScore: 100, weight: 30 },       // 21 pts
      { componentId: '3', componentType: 'EXAM', score: 60, maxScore: 100, weight: 50 },       // 30 pts
    ];

    const result = calculateWeightedGrade(mockComponents, scores);
    expect(result.finalGrade).toBe(67); // 16 + 21 + 30
  });

  it('handles incomplete grading as PROVISIONAL', () => {
    const scores = [
      { componentId: '1', componentType: 'ASSIGNMENT', score: 80, maxScore: 100, weight: 20 },
    ];

    const result = calculateWeightedGrade(mockComponents, scores);
    expect(result.status).toBe(GradeStatus.PROVISIONAL);
    expect(result.isComplete).toBe(false);
    expect(result.missingComponents).toContain('Midterm');
    expect(result.missingComponents).toContain('Final Exam');
  });

  it('normalizes grade if total weight is not 100%', () => {
    // We need components whose weights sum to 20
    const limitedComponents: AssessmentComponent[] = [
      { id: '1', name: 'Assignment 1', weight: 20, type: 'ASSIGNMENT', minScore: 0, maxScore: 100, isMandatory: true }
    ];

    const scores = [
      { componentId: '1', componentType: 'ASSIGNMENT', score: 80, maxScore: 100, weight: 20 },
    ];
    
    // total weight is 20, but final grade should be 80% if we normalize
    const result = calculateWeightedGrade(limitedComponents, scores);
    // Formula: (weightedScore / totalDefinedWeight) * 100 = (16 / 20) * 100 = 80
    expect(result.finalGrade).toBe(80);
  });
});

// Helper needed since it's used in the calculator but not exported
function roundToTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
