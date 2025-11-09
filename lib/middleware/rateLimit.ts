/**
 * Rate limiting middleware for API protection
 * Essential for preventing abuse in production
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { checkRateLimit } from '../utils/validation';
import { createError, ErrorCode, handleError } from '../utils/errorHandler';

/**
 * Gets client identifier for rate limiting
 */
function getClientIdentifier(req: NextApiRequest): string {
  // Use IP address or other identifier
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || 'unknown';
  
  return ip;
}

/**
 * Rate limit middleware
 */
export function rateLimitMiddleware(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  maxRequests: number = 20,
  windowMs: number = 900000 // 15 minutes
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Check if rate limiting is enabled
    if (process.env.ENABLE_RATE_LIMITING !== 'true') {
      return handler(req, res);
    }

    const identifier = getClientIdentifier(req);
    const allowed = checkRateLimit(identifier, maxRequests, windowMs);

    if (!allowed) {
      const error = createError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'Too many requests. Please try again in 15 minutes.'
      );
      return handleError(error, res);
    }

    return handler(req, res);
  };
}
