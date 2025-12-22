import { Request, Response } from 'express';
import { z } from 'zod';

// Validation schema for error reporting
const errorReportSchema = z.object({
  message: z.string().min(1),
  stack: z.string().optional(),
  url: z.string().optional(),
  lineNumber: z.number().optional(),
  columnNumber: z.number().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  additionalInfo: z.record(z.string(), z.any()).optional()
});

/**
 * Handle client-side error reporting
 */
export async function reportError(req: Request, res: Response) {
  try {
    console.log('🚨 Client Error Report:', req.body);
    const validation = errorReportSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid error report data',
        errors: validation.error.issues
      });
    }

    const errorData = validation.data;

    // Log the error to console (in production, you might want to send to a logging service)
    console.error('🚨 Client Error Report:', {
      message: errorData.message,
      stack: errorData.stack,
      url: errorData.url,
      lineNumber: errorData.lineNumber,
      columnNumber: errorData.columnNumber,
      userAgent: errorData.userAgent,
      timestamp: errorData.timestamp || new Date().toISOString(),
      userId: errorData.userId,
      sessionId: errorData.sessionId,
      additionalInfo: errorData.additionalInfo,
      ip: req.ip,
      userAgentHeader: req.get('User-Agent')
    });

    // In a production environment, you might want to:
    // 1. Store errors in a database
    // 2. Send to external logging service (Sentry, LogRocket, etc.)
    // 3. Send email notifications for critical errors
    // 4. Rate limit error reporting per user/IP

    res.status(200).json({
      success: true,
      message: 'Error report received successfully',
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

  } catch (error) {
    console.error('Error handling error report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process error report'
    });
  }
}

/**
 * Get error statistics (admin only)
 */
export async function getErrorStats(req: Request, res: Response) {
  try {
    // This would typically query a database for error statistics
    // For now, return a placeholder response
    res.json({
      success: true,
      stats: {
        totalErrors: 0,
        errorsLast24h: 0,
        errorsLast7d: 0,
        mostCommonErrors: [],
        errorTrends: []
      }
    });
  } catch (error) {
    console.error('Error fetching error stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch error statistics'
    });
  }
}
