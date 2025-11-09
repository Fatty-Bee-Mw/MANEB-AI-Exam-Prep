/**
 * Feedback API - Sends student feedback to email and WhatsApp
 * Email: ylikagwa@gmail.com
 * WhatsApp: +265880646248
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../lib/utils/logger';
import { checkRateLimit } from '../../lib/utils/validation';
import { trackFeedback } from '../../lib/utils/analytics';

interface FeedbackData {
  name: string;
  email?: string;
  phone?: string;
  rating: number;
  comment: string;
  subject?: string;
  timestamp: string;
}

/**
 * Send feedback via multiple channels
 */
async function sendFeedback(feedback: FeedbackData): Promise<void> {
  const message = formatFeedbackMessage(feedback);
  
  // Log feedback
  logger.info('Feedback received', feedback);
  
  // Send to email using Netlify Forms or SendGrid
  await sendEmailNotification(feedback, message);
  
  // Send to WhatsApp (using API or simple link)
  await sendWhatsAppNotification(message);
}

/**
 * Format feedback message
 */
function formatFeedbackMessage(feedback: FeedbackData): string {
  return `
🎓 NEW MANEB EXAM PREP FEEDBACK

👤 Name: ${feedback.name}
📧 Email: ${feedback.email || 'Not provided'}
📱 Phone: ${feedback.phone || 'Not provided'}
⭐ Rating: ${feedback.rating}/5
📝 Subject: ${feedback.subject || 'General Feedback'}

💬 Comment:
${feedback.comment}

🕐 Timestamp: ${feedback.timestamp}
  `.trim();
}

/**
 * Send email notification
 */
async function sendEmailNotification(feedback: FeedbackData, message: string): Promise<void> {
  // Use Netlify Forms submission (recommended for Netlify hosting)
  // Or integrate with SendGrid, Mailgun, etc.
  
  const recipientEmail = 'ylikagwa@gmail.com';
  
  try {
    // Option 1: Use a third-party email service (if configured)
    if (process.env.SENDGRID_API_KEY) {
      // SendGrid integration
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      await sgMail.send({
        to: recipientEmail,
        from: process.env.SENDGRID_FROM_EMAIL || recipientEmail,
        subject: `⭐ ${feedback.rating}/5 - MANEB Exam Prep Feedback`,
        text: message,
        html: `<pre>${message}</pre>`,
      });
      
      logger.info('Email sent via SendGrid');
    } else {
      // Log that email service is not configured
      logger.warn('Email service not configured. Feedback logged only.', { 
        recipient: recipientEmail,
        feedback 
      });
    }
  } catch (error) {
    logger.error('Failed to send email', error as Error);
    // Don't throw - we still want to save the feedback
  }
}

/**
 * Send WhatsApp notification
 */
async function sendWhatsAppNotification(message: string): Promise<void> {
  const whatsappNumber = '265880646248'; // Format: country code + number (no + or -)
  
  try {
    // Option 1: Use WhatsApp Business API (if configured)
    if (process.env.WHATSAPP_API_TOKEN) {
      // WhatsApp Business API integration
      const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: whatsappNumber,
          type: 'text',
          text: { body: message },
        }),
      });
      
      if (!response.ok) {
        throw new Error('WhatsApp API request failed');
      }
      
      logger.info('WhatsApp notification sent');
    } else {
      // Log that WhatsApp service is not configured
      logger.warn('WhatsApp API not configured. Use WhatsApp link manually.', { 
        number: whatsappNumber 
      });
    }
  } catch (error) {
    logger.error('Failed to send WhatsApp notification', error as Error);
    // Don't throw - feedback is still saved
  }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || 'unknown';
  return ip;
}

/**
 * Main API handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  const origin = req.headers.origin || '';
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Use POST to submit feedback',
    });
  }
  
  // Rate limiting (max 5 feedbacks per 15 min per IP)
  const clientId = getClientIdentifier(req);
  const allowed = checkRateLimit(clientId, 5, 900000);
  
  if (!allowed) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many feedback submissions. Please try again in 15 minutes.',
    });
  }
  
  // Validate input
  const { name, email, phone, rating, comment, subject } = req.body;
  
  if (!name || !rating || !comment) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      message: 'Name, rating, and comment are required',
    });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: 'Invalid rating',
      message: 'Rating must be between 1 and 5',
    });
  }
  
  if (comment.length < 10) {
    return res.status(400).json({
      success: false,
      error: 'Comment too short',
      message: 'Please provide at least 10 characters of feedback',
    });
  }
  
  // Prepare feedback data
  const feedback: FeedbackData = {
    name: name.trim(),
    email: email?.trim(),
    phone: phone?.trim(),
    rating: parseInt(rating),
    comment: comment.trim(),
    subject: subject?.trim(),
    timestamp: new Date().toISOString(),
  };
  
  // Send feedback
  await sendFeedback(feedback);
  
  // Track feedback in analytics
  trackFeedback(feedback);
  
  // Return success response
  return res.status(200).json({
    success: true,
    message: 'Thank you for your feedback! We have received your response.',
    data: {
      feedbackId: Date.now().toString(),
      timestamp: feedback.timestamp,
    },
  });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
