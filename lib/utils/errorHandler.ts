/**
 * Centralized error handling for consistent API responses
 * Ensures user-friendly error messages for African school users
 */

import { NextApiResponse } from 'next';
import { logger } from './logger';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
  statusCode: number;
}

class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export { AppError };

/**
 * User-friendly error messages optimized for African school context
 */
const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'The file you uploaded is not valid. Please check the requirements.',
  [ErrorCode.FILE_TOO_LARGE]: 'Your file is too large. Please upload a file smaller than 10MB.',
  [ErrorCode.UNSUPPORTED_FILE_TYPE]: 'This file type is not supported. Please upload PDF, DOCX, JPG, or PNG files.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a few minutes before trying again.',
  [ErrorCode.PROCESSING_ERROR]: 'We couldn\'t process your file. Please try again or contact support.',
  [ErrorCode.AI_SERVICE_ERROR]: 'Our AI service is temporarily unavailable. Please try again in a few minutes.',
  [ErrorCode.SERVER_ERROR]: 'Something went wrong on our end. Our team has been notified.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.UNAUTHORIZED]: 'You are not authorized to access this resource.',
};

/**
 * Handles errors and sends appropriate response
 */
export function handleError(
  error: Error | AppError,
  res: NextApiResponse,
  context?: Record<string, any>
): void {
  // Log the error
  logger.error('API Error', error, context);

  // Determine if it's our custom error
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  } else {
    // Unknown error - don't expose details to client
    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.SERVER_ERROR,
        message: errorMessages[ErrorCode.SERVER_ERROR],
      },
    });
  }
}

/**
 * Creates a standardized error
 */
export function createError(
  code: ErrorCode,
  customMessage?: string,
  details?: any
): AppError {
  const statusCodeMap: Record<ErrorCode, number> = {
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.FILE_TOO_LARGE]: 413,
    [ErrorCode.UNSUPPORTED_FILE_TYPE]: 400,
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCode.PROCESSING_ERROR]: 500,
    [ErrorCode.AI_SERVICE_ERROR]: 503,
    [ErrorCode.SERVER_ERROR]: 500,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.UNAUTHORIZED]: 401,
  };

  return new AppError(
    code,
    customMessage || errorMessages[code],
    statusCodeMap[code],
    details
  );
}

/**
 * Success response helper
 */
export function sendSuccess(
  res: NextApiResponse,
  data: any,
  message?: string,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
  });
}

/**
 * Async handler wrapper to catch errors
 */
export function asyncHandler(
  handler: (req: any, res: NextApiResponse) => Promise<void>
) {
  return async (req: any, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleError(error as Error, res);
    }
  };
}
