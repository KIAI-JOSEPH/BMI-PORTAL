// BMI UMS - Helper Functions

/**
 * Generate a unique serial number for certificates
 * Format: BMI-YYYY-NNNNNN
 */
export function generateCertificateSerial(year: number, sequence: number): string {
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `BMI-${year}-${paddedSequence}`;
}

/**
 * Validate certificate serial format
 */
export function isValidCertificateSerial(serial: string): boolean {
  return /^BMI-\d{4}-\d{6}$/.test(serial);
}

/**
 * Generate content hash for certificate verification
 * Uses SHA-256 via the Web Crypto API (available in Node 18+ and all browsers)
 */
export async function generateContentHash(data: {
  serial: string;
  studentId: string;
  name: string;
  degree: string;
  issueDate: string;
}): Promise<string> {
  const input = `${data.serial}|${data.studentId}|${data.name}|${data.degree}|BMI University|${data.issueDate}`;
  
  // Use Node.js built-in crypto for SHA-256 (no external dependency needed)
  const { createHash } = await import('crypto');
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate GPA class
 */
export function calculateGPAClass(gpa: number): string {
  if (gpa >= 3.7) return 'First Class Honours';
  if (gpa >= 3.3) return 'Second Class Honours (Upper Division)';
  if (gpa >= 3.0) return 'Second Class Honours (Lower Division)';
  if (gpa >= 2.0) return 'Pass';
  return 'Fail';
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Parse pagination parameters
 */
export function parsePagination(
  page: string | undefined,
  perPage: string | undefined,
  defaults: { page: number; perPage: number; maxPerPage: number }
): { page: number; perPage: number; offset: number } {
  const parsedPage = Math.max(1, parseInt(page || String(defaults.page), 10) || defaults.page);
  const parsedPerPage = Math.min(
    defaults.maxPerPage,
    Math.max(1, parseInt(perPage || String(defaults.perPage), 10) || defaults.perPage)
  );
  
  return {
    page: parsedPage,
    perPage: parsedPerPage,
    offset: (parsedPage - 1) * parsedPerPage,
  };
}

/**
 * Generate avatar color based on name
 */
export function generateAvatarColor(name: string): string {
  const colors = [
    'bg-purple-600',
    'bg-blue-600',
    'bg-emerald-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-cyan-600',
    'bg-indigo-600',
    'bg-teal-600',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Sanitize a string for safe use in PocketBase filter expressions.
 * Strips quotes and backslashes, and truncates to maxLength.
 */
export function sanitizeFilter(value: string, maxLength: number = 100): string {
    return value.replace(/["'\\]/g, '').substring(0, maxLength);
}