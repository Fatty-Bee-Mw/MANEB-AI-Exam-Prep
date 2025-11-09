/**
 * Health check endpoint for monitoring
 * Used by Netlify and external monitoring services
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getDirectorySize } from '../../lib/utils/fileCleanup';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  
  try {
    // Check if OpenAI key is configured
    const hasOpenAI = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
    
    // Check disk space usage
    const uploadDir = process.env.UPLOAD_TMP_DIR || '/tmp/uploads';
    const exportDir = path.join(process.cwd(), 'tmp', 'exports');
    const uploadSize = getDirectorySize(uploadDir);
    const exportSize = getDirectorySize(exportDir);
    const totalUsed = uploadSize + exportSize;
    const maxStorage = 2 * 1024 * 1024 * 1024; // 2GB
    const storageUsagePercent = (totalUsed / maxStorage) * 100;

    // Response time
    const responseTime = Date.now() - startTime;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        openai: hasOpenAI ? 'configured' : 'not_configured',
        storage: {
          used: Math.round(totalUsed / 1024 / 1024), // MB
          total: Math.round(maxStorage / 1024 / 1024), // MB
          usagePercent: Math.round(storageUsagePercent),
          status: storageUsagePercent > 90 ? 'critical' : storageUsagePercent > 75 ? 'warning' : 'healthy',
        },
      },
      responseTime: `${responseTime}ms`,
    };

    // Return 503 if critical issues
    if (!hasOpenAI || storageUsagePercent > 90) {
      return res.status(503).json({
        ...health,
        status: 'unhealthy',
      });
    }

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
}
