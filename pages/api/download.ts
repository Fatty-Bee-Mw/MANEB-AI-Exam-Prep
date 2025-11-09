import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { logger } from '../../lib/utils/logger';
import { createError, ErrorCode, handleError, asyncHandler } from '../../lib/utils/errorHandler';
import { rateLimitMiddleware } from '../../lib/middleware/rateLimit';
import { corsMiddleware } from '../../lib/middleware/cors';
import { trackDownload } from '../../lib/utils/analytics';

const ALLOWED_FORMATS = ['pdf', 'docx', 'md', 'txt'];

async function downloadHandler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId, format } = req.query as { jobId?: string; format?: string };
  
  // Validation
  if (!jobId || !format) {
    throw createError(ErrorCode.VALIDATION_ERROR, 'Missing jobId or format parameter');
  }

  // Validate format
  if (!ALLOWED_FORMATS.includes(format)) {
    throw createError(ErrorCode.VALIDATION_ERROR, `Invalid format. Allowed: ${ALLOWED_FORMATS.join(', ')}`);
  }

  // Sanitize jobId (prevent path traversal)
  if (jobId.includes('..') || jobId.includes('/') || jobId.includes('\\')) {
    throw createError(ErrorCode.VALIDATION_ERROR, 'Invalid jobId format');
  }

  const dir = path.join(process.cwd(), 'tmp', 'exports');
  const filePath = path.join(dir, `${jobId}.${format}`);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    logger.warn('File not found for download', { jobId, format });
    throw createError(ErrorCode.NOT_FOUND, 'File not found. It may have expired or been deleted.');
  }

  try {
    const stat = fs.statSync(filePath);
    
    // Set appropriate content type
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      md: 'text/markdown',
      txt: 'text/plain',
    };

    res.setHeader('Content-Type', contentTypes[format] || 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="MANEB_ExamPrep_${jobId}.${format}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', (error) => {
      logger.error('File stream error', error);
      if (!res.headersSent) {
        throw createError(ErrorCode.SERVER_ERROR, 'Failed to download file');
      }
    });

    stream.pipe(res);
    
    // Track download in analytics
    trackDownload(req, format, jobId);
    
    logger.info('File downloaded', { jobId, format, size: stat.size });
  } catch (error) {
    logger.error('Download error', error as Error, { jobId, format });
    throw error;
  }
}

export default corsMiddleware(
  rateLimitMiddleware(
    asyncHandler(downloadHandler),
    50, // Higher limit for downloads
    900000
  )
);
