/**
 * Cleanup endpoint for removing old files
 * Can be triggered by Netlify scheduled functions or external cron
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { cleanupOldFiles } from '../../lib/utils/fileCleanup';
import { logger } from '../../lib/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple authentication - check for secret key
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.API_SECRET_KEY}`;

  if (!process.env.API_SECRET_KEY || authHeader !== expectedAuth) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Valid API secret key required'
    });
  }

  try {
    logger.info('Manual cleanup triggered via API');
    await cleanupOldFiles();
    
    res.status(200).json({
      success: true,
      message: 'Cleanup completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cleanup API error', error as Error);
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
    });
  }
}
