/**
 * Analytics tracking system
 * Tracks user interactions, clicks, and usage patterns
 */

import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const analyticsDir = path.join(process.cwd(), 'tmp', 'analytics');
const analyticsFile = path.join(analyticsDir, 'analytics.json');
const feedbackFile = path.join(analyticsDir, 'feedback.json');

// Ensure analytics directory exists
function ensureAnalyticsDir() {
  if (!fs.existsSync(analyticsDir)) {
    fs.mkdirSync(analyticsDir, { recursive: true });
  }
}

// Initialize analytics file if it doesn't exist
function initializeAnalyticsFile() {
  ensureAnalyticsDir();
  if (!fs.existsSync(analyticsFile)) {
    const initialData = {
      totalUploads: 0,
      totalDownloads: 0,
      totalFeedback: 0,
      uniqueUsers: 0,
      sessions: [],
      downloads: [],
      uploads: [],
      pageViews: 0,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(analyticsFile, JSON.stringify(initialData, null, 2));
  }
}

// Initialize feedback file
function initializeFeedbackFile() {
  ensureAnalyticsDir();
  if (!fs.existsSync(feedbackFile)) {
    fs.writeFileSync(feedbackFile, JSON.stringify([], null, 2));
  }
}

// Read analytics data
export function getAnalytics() {
  try {
    initializeAnalyticsFile();
    const data = fs.readFileSync(analyticsFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Failed to read analytics', error as Error);
    return null;
  }
}

// Save analytics data
function saveAnalytics(data: any) {
  try {
    ensureAnalyticsDir();
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(analyticsFile, JSON.stringify(data, null, 2));
  } catch (error) {
    logger.error('Failed to save analytics', error as Error);
  }
}

// Track page view
export function trackPageView(req: any) {
  try {
    const analytics = getAnalytics();
    if (analytics) {
      analytics.pageViews = (analytics.pageViews || 0) + 1;
      
      const ip = getClientIP(req);
      const session = {
        timestamp: new Date().toISOString(),
        ip,
        userAgent: req.headers['user-agent'] || 'unknown',
        type: 'page_view',
      };
      
      analytics.sessions = analytics.sessions || [];
      analytics.sessions.push(session);
      
      // Keep only last 1000 sessions
      if (analytics.sessions.length > 1000) {
        analytics.sessions = analytics.sessions.slice(-1000);
      }
      
      saveAnalytics(analytics);
    }
  } catch (error) {
    logger.error('Failed to track page view', error as Error);
  }
}

// Track upload
export function trackUpload(req: any, fileCount: number, totalSize: number) {
  try {
    const analytics = getAnalytics();
    if (analytics) {
      analytics.totalUploads = (analytics.totalUploads || 0) + 1;
      
      const ip = getClientIP(req);
      const upload = {
        timestamp: new Date().toISOString(),
        ip,
        fileCount,
        totalSize,
        userAgent: req.headers['user-agent'] || 'unknown',
      };
      
      analytics.uploads = analytics.uploads || [];
      analytics.uploads.push(upload);
      
      // Keep only last 500 uploads
      if (analytics.uploads.length > 500) {
        analytics.uploads = analytics.uploads.slice(-500);
      }
      
      saveAnalytics(analytics);
      logger.info('Upload tracked', { ip, fileCount, totalSize });
    }
  } catch (error) {
    logger.error('Failed to track upload', error as Error);
  }
}

// Track download
export function trackDownload(req: any, format: string, jobId: string) {
  try {
    const analytics = getAnalytics();
    if (analytics) {
      analytics.totalDownloads = (analytics.totalDownloads || 0) + 1;
      
      const ip = getClientIP(req);
      const download = {
        timestamp: new Date().toISOString(),
        ip,
        format,
        jobId,
        userAgent: req.headers['user-agent'] || 'unknown',
      };
      
      analytics.downloads = analytics.downloads || [];
      analytics.downloads.push(download);
      
      // Keep only last 500 downloads
      if (analytics.downloads.length > 500) {
        analytics.downloads = analytics.downloads.slice(-500);
      }
      
      saveAnalytics(analytics);
      logger.info('Download tracked', { ip, format, jobId });
    }
  } catch (error) {
    logger.error('Failed to track download', error as Error);
  }
}

// Track feedback
export function trackFeedback(feedback: any) {
  try {
    // Update analytics
    const analytics = getAnalytics();
    if (analytics) {
      analytics.totalFeedback = (analytics.totalFeedback || 0) + 1;
      saveAnalytics(analytics);
    }
    
    // Save feedback to separate file
    initializeFeedbackFile();
    const feedbackData = JSON.parse(fs.readFileSync(feedbackFile, 'utf-8'));
    feedbackData.push({
      ...feedback,
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
    });
    
    // Keep only last 1000 feedbacks
    if (feedbackData.length > 1000) {
      feedbackData.shift();
    }
    
    fs.writeFileSync(feedbackFile, JSON.stringify(feedbackData, null, 2));
    logger.info('Feedback tracked and saved', { rating: feedback.rating });
  } catch (error) {
    logger.error('Failed to track feedback', error as Error);
  }
}

// Get all feedback
export function getAllFeedback() {
  try {
    initializeFeedbackFile();
    const data = fs.readFileSync(feedbackFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Failed to read feedback', error as Error);
    return [];
  }
}

// Get feedback statistics
export function getFeedbackStats() {
  try {
    const feedbackData = getAllFeedback();
    
    const total = feedbackData.length;
    if (total === 0) {
      return {
        total: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }
    
    const ratings = feedbackData.map((f: any) => f.rating);
    const sum = ratings.reduce((a: number, b: number) => a + b, 0);
    const average = sum / total;
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r: number) => {
      distribution[r as keyof typeof distribution]++;
    });
    
    const percentages = {
      1: (distribution[1] / total) * 100,
      2: (distribution[2] / total) * 100,
      3: (distribution[3] / total) * 100,
      4: (distribution[4] / total) * 100,
      5: (distribution[5] / total) * 100,
    };
    
    return {
      total,
      average: Math.round(average * 10) / 10,
      distribution,
      percentages: {
        1: Math.round(percentages[1]),
        2: Math.round(percentages[2]),
        3: Math.round(percentages[3]),
        4: Math.round(percentages[4]),
        5: Math.round(percentages[5]),
      },
    };
  } catch (error) {
    logger.error('Failed to get feedback stats', error as Error);
    return null;
  }
}

// Get unique users (by IP)
export function getUniqueUsers() {
  try {
    const analytics = getAnalytics();
    if (!analytics || !analytics.sessions) return 0;
    
    const uniqueIPs = new Set();
    analytics.sessions.forEach((session: any) => {
      uniqueIPs.add(session.ip);
    });
    
    return uniqueIPs.size;
  } catch (error) {
    logger.error('Failed to get unique users', error as Error);
    return 0;
  }
}

// Get client IP
function getClientIP(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

// Get analytics summary
export function getAnalyticsSummary() {
  try {
    const analytics = getAnalytics();
    const feedbackStats = getFeedbackStats();
    const uniqueUsers = getUniqueUsers();
    
    // Calculate download breakdown by format
    const downloads = analytics?.downloads || [];
    const downloadsByFormat = {
      pdf: downloads.filter((d: any) => d.format === 'pdf').length,
      docx: downloads.filter((d: any) => d.format === 'docx').length,
      txt: downloads.filter((d: any) => d.format === 'txt').length,
      md: downloads.filter((d: any) => d.format === 'md').length,
    };
    
    return {
      totalPageViews: analytics?.pageViews || 0,
      totalUploads: analytics?.totalUploads || 0,
      totalDownloads: analytics?.totalDownloads || 0,
      totalFeedback: analytics?.totalFeedback || 0,
      uniqueUsers,
      feedbackStats,
      downloadsByFormat,
      recentActivity: {
        uploads: (analytics?.uploads || []).slice(-10),
        downloads: (analytics?.downloads || []).slice(-10),
        sessions: (analytics?.sessions || []).slice(-10),
      },
      lastUpdated: analytics?.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to get analytics summary', error as Error);
    return null;
  }
}

// Export initialization functions
export { ensureAnalyticsDir, initializeAnalyticsFile, initializeFeedbackFile };
