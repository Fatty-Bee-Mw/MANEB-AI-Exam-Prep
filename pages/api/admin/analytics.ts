/**
 * Admin Analytics API
 * Protected endpoint to view usage statistics
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getAnalyticsSummary, getAllFeedback, getFeedbackStats } from '../../../lib/utils/analytics';
import { logger } from '../../../lib/utils/logger';

// Simple auth check (you should use a proper auth system in production)
function isAuthorized(req: NextApiRequest): boolean {
  const authHeader = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD || 'maneb2024admin';
  
  if (!authHeader) return false;
  
  // Bearer token format: "Bearer password"
  const token = authHeader.replace('Bearer ', '');
  return token === adminPassword;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set JSON header immediately
  res.setHeader('Content-Type', 'application/json');
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }
  
  // Check authorization
  if (!isAuthorized(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid admin credentials',
    });
  }
  
  try {
    // Get analytics summary with error handling
    const summary = getAnalyticsSummary() || {
      totalPageViews: 0,
      totalUploads: 0,
      totalDownloads: 0,
      totalFeedback: 0,
      uniqueUsers: 0,
      feedbackStats: { excellent: 0, good: 0, average: 0, poor: 0, total: 0 },
      downloadsByFormat: { pdf: 0, docx: 0, txt: 0, md: 0 },
      recentActivity: { uploads: [], downloads: [], sessions: [] },
      lastUpdated: new Date().toISOString(),
    };
    
    const allFeedback = getAllFeedback() || [];
    const feedbackStats = getFeedbackStats() || { excellent: 0, good: 0, average: 0, poor: 0, total: 0 };
    
    // Calculate additional metrics
    const today = new Date().toISOString().split('T')[0];
    const todayFeedback = allFeedback.filter((f: any) => 
      f.timestamp?.startsWith(today) || f.savedAt?.startsWith(today)
    );
    
    const todayUploads = summary?.recentActivity.uploads.filter((u: any) =>
      u.timestamp.startsWith(today)
    ).length || 0;
    
    const todayDownloads = summary?.recentActivity.downloads.filter((d: any) =>
      d.timestamp.startsWith(today)
    ).length || 0;
    
    return res.status(200).json({
      success: true,
      data: {
        summary,
        feedback: {
          all: allFeedback.slice(-50), // Last 50 feedback entries
          stats: feedbackStats,
          today: todayFeedback.length,
        },
        today: {
          uploads: todayUploads,
          downloads: todayDownloads,
          feedback: todayFeedback.length,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get analytics', error as Error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics',
      message: (error as Error).message,
    });
  }
}
