/**
 * Analytics Tracking API
 * Track page views and user actions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { trackPageView } from '../../lib/utils/analytics';
import { logger } from '../../lib/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { action } = req.body;

    if (action === 'pageview') {
      trackPageView(req);
      logger.info('Page view tracked');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Failed to track action', error as Error);
    return res.status(500).json({ success: false, error: 'Failed to track action' });
  }
}
