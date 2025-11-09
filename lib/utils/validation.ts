/**
 * Input validation utilities for security and data integrity
 * Prevents malicious uploads and ensures data quality
 */

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const MAX_FILES = parseInt(process.env.MAX_FILES_PER_REQUEST || '10');
const ALLOWED_EXTENSIONS = (process.env.ALLOWED_FILE_TYPES || 'pdf,docx,jpg,jpeg,png').split(',');

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates file upload based on size, type, and count
 */
export function validateFileUpload(
  file: { size: number; name: string; mimetype?: string },
  fileCount: number = 1
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check file count
  if (fileCount > MAX_FILES) {
    errors.push({
      field: 'fileCount',
      message: `Maximum ${MAX_FILES} files allowed per request`,
    });
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      field: 'fileSize',
      message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    });
  }

  // Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push({
      field: 'fileType',
      message: `File type .${ext} not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    });
  }

  // Check for path traversal attempts
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    errors.push({
      field: 'fileName',
      message: 'Invalid file name detected',
    });
  }

  // Validate MIME type if available
  if (file.mimetype) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push({
        field: 'mimeType',
        message: `MIME type ${file.mimetype} not allowed`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  let sanitized = filename.replace(/^.*[\\\/]/, '');
  
  // Remove any special characters except alphanumeric, dots, dashes, underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Prevent double extensions
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    const ext = parts.pop();
    sanitized = parts.join('_') + '.' + ext;
  }
  
  // Add timestamp to prevent overwrites
  const timestamp = Date.now();
  const nameParts = sanitized.split('.');
  const ext = nameParts.pop();
  const baseName = nameParts.join('.');
  
  return `${baseName}_${timestamp}.${ext}`;
}

/**
 * Validates API request body
 */
export function validateProcessRequest(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data) {
    errors.push({
      field: 'body',
      message: 'Request body is required',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limiting check (simple in-memory for Netlify serverless)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 20, windowMs: number = 900000): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Clean up old rate limit records
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}
