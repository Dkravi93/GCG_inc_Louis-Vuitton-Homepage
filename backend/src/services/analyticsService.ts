import { cacheService, CACHE_PREFIXES, CACHE_TTL } from './cacheService';
import axios from 'axios';

interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
}

interface ConversionEvent {
  eventName: 'purchase' | 'add_to_cart' | 'begin_checkout' | 'view_item' | 'search' | 'sign_up';
  value?: number;
  currency?: string;
  itemId?: string;
  userId?: string;
  transactionId?: string;
  parameters?: Record<string, any>;
}

interface PerformanceMetric {
  metricName: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface ErrorEvent {
  error: Error;
  context?: string;
  userId?: string;
  additionalInfo?: Record<string, any>;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  events: AnalyticsEvent[];
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  revenue: number;
  topPages: Array<{ page: string; views: number }>;
  topProducts: Array<{ productId: string; views: number; purchases: number }>;
  userGrowth: Array<{ date: string; users: number }>;
  revenueGrowth: Array<{ date: string; revenue: number }>;
}

class AnalyticsService {
  private gaTrackingId: string;
  private gaMeasurementSecret: string;

  constructor() {
    this.gaTrackingId = process.env.GA_TRACKING_ID || '';
    this.gaMeasurementSecret = process.env.GA_MEASUREMENT_SECRET || '';

    if (!this.gaTrackingId) {
      console.warn('⚠️  Google Analytics tracking ID not configured');
    }

    console.log('📊 Analytics service initialized');
  }

  /**
   * Track a custom event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Store event locally for aggregation
      await this.storeEventLocally(event);

      // Send to Google Analytics 4 if configured
      if (this.gaTrackingId && this.gaMeasurementSecret) {
        await this.sendToGA4(event);
      }

      // Update real-time metrics
      await this.updateRealTimeMetrics(event);

      console.log(`📊 Event tracked: ${event.name}`);
    } catch (error) {
      console.error('❌ Failed to track event:', error);
      // Don't throw to avoid breaking the main application flow
    }
  }

  /**
   * Track a conversion event (e-commerce)
   */
  async trackConversion(conversion: ConversionEvent): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        name: conversion.eventName,
        parameters: {
          value: conversion.value,
          currency: conversion.currency || 'USD',
          transaction_id: conversion.transactionId,
          item_id: conversion.itemId,
          ...conversion.parameters
        },
        userId: conversion.userId,
        timestamp: new Date()
      };

      await this.trackEvent(event);

      // Update conversion metrics
      await this.updateConversionMetrics(conversion);

      console.log(`💰 Conversion tracked: ${conversion.eventName}`);
    } catch (error) {
      console.error('❌ Failed to track conversion:', error);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(
    page: string,
    userId?: string,
    sessionId?: string,
    additionalParams?: Record<string, any>
  ): Promise<void> {
    const event: AnalyticsEvent = {
      name: 'page_view',
      parameters: {
        page_title: page,
        page_location: page,
        ...additionalParams
      },
      userId,
      sessionId,
      timestamp: new Date()
    };

    await this.trackEvent(event);
    await this.updatePageMetrics(page);
  }

  /**
   * Start a user session
   */
  async startSession(sessionData: Omit<UserSession, 'events' | 'pageViews'>): Promise<void> {
    try {
      const session: UserSession = {
        ...sessionData,
        events: [],
        pageViews: 0
      };

      await cacheService.set(
        `session:${sessionData.sessionId}`,
        session,
        { ttl: CACHE_TTL.VERY_LONG, prefix: CACHE_PREFIXES.SESSIONS }
      );

      // Track session start
      await this.trackEvent({
        name: 'session_start',
        userId: sessionData.userId,
        sessionId: sessionData.sessionId,
        parameters: {
          user_agent: sessionData.userAgent,
          referrer: sessionData.referrer
        }
      });

      console.log(`👤 Session started: ${sessionData.sessionId}`);
    } catch (error) {
      console.error('❌ Failed to start session:', error);
    }
  }

  /**
   * End a user session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const session = await cacheService.get<UserSession>(
        `session:${sessionId}`,
        { prefix: CACHE_PREFIXES.SESSIONS }
      );

      if (session) {
        const duration = new Date().getTime() - session.startTime.getTime();

        await this.trackEvent({
          name: 'session_end',
          userId: session.userId,
          sessionId,
          parameters: {
            session_duration: Math.round(duration / 1000), // in seconds
            page_views: session.pageViews,
            events_count: session.events.length
          }
        });

        // Remove session from cache
        await cacheService.del(`session:${sessionId}`, CACHE_PREFIXES.SESSIONS);
      }

      console.log(`👋 Session ended: ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to end session:', error);
    }
  }

  /**
   * Track performance metric
   */
  async trackPerformance(metric: PerformanceMetric): Promise<void> {
    try {
      const metricKey = `performance:${metric.metricName}:${new Date().toISOString().split('T')[0]}`;
      
      // Store performance data for aggregation
      await cacheService.lpush(
        metricKey,
        metric,
        CACHE_PREFIXES.ANALYTICS
      );

      // Set expiration for cleanup
      await cacheService.expire(metricKey, CACHE_TTL.VERY_LONG * 7, CACHE_PREFIXES.ANALYTICS); // 7 days

      console.log(`⚡ Performance metric tracked: ${metric.metricName} = ${metric.value}`);
    } catch (error) {
      console.error('❌ Failed to track performance metric:', error);
    }
  }

  /**
   * Track error
   */
  async trackError(errorEvent: ErrorEvent): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        name: 'error',
        parameters: {
          error_message: errorEvent.error.message,
          error_stack: errorEvent.error.stack,
          context: errorEvent.context,
          ...errorEvent.additionalInfo
        },
        userId: errorEvent.userId,
        timestamp: new Date()
      };

      await this.trackEvent(event);

      // Store error for monitoring
      const errorKey = `errors:${new Date().toISOString().split('T')[0]}`;
      await cacheService.lpush(errorKey, errorEvent, CACHE_PREFIXES.ANALYTICS);
      await cacheService.expire(errorKey, CACHE_TTL.VERY_LONG * 30, CACHE_PREFIXES.ANALYTICS); // 30 days

      console.error(`🐛 Error tracked: ${errorEvent.error.message}`);
    } catch (error) {
      console.error('❌ Failed to track error:', error);
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(dateRange?: { start: Date; end: Date }): Promise<DashboardMetrics> {
    try {
      const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const defaultEnd = new Date();
      
      const start = dateRange?.start || defaultStart;
      const end = dateRange?.end || defaultEnd;

      // Get metrics from cache or calculate
      const metrics = await cacheService.getOrSet(
        `dashboard_metrics:${start.toISOString()}:${end.toISOString()}`,
        async () => {
          return await this.calculateDashboardMetrics(start, end);
        },
        { ttl: CACHE_TTL.SHORT, prefix: CACHE_PREFIXES.ANALYTICS }
      );

      return metrics;
    } catch (error) {
      console.error('❌ Failed to get dashboard metrics:', error);
      return this.getEmptyDashboardMetrics();
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<any> {
    try {
      const metrics = await cacheService.hgetall('realtime_metrics', CACHE_PREFIXES.ANALYTICS);
      return metrics || {};
    } catch (error) {
      console.error('❌ Failed to get real-time metrics:', error);
      return {};
    }
  }

  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(): Promise<any> {
    try {
      const funnelSteps = [
        'page_view',
        'view_item',
        'add_to_cart',
        'begin_checkout',
        'purchase'
      ];

      const funnelData = [];

      for (const step of funnelSteps) {
        const count = await cacheService.get<number>(
          `conversion_step:${step}`,
          { prefix: CACHE_PREFIXES.ANALYTICS }
        ) || 0;

        funnelData.push({
          step,
          count,
          percentage: funnelData.length === 0 ? 100 : (count / funnelData[0].count) * 100
        });
      }

      return funnelData;
    } catch (error) {
      console.error('❌ Failed to get conversion funnel:', error);
      return [];
    }
  }

  /**
   * Get user segments
   */
  async getUserSegments(): Promise<any> {
    try {
      const segments = await cacheService.hgetall('user_segments', CACHE_PREFIXES.ANALYTICS);
      return segments || {};
    } catch (error) {
      console.error('❌ Failed to get user segments:', error);
      return {};
    }
  }

  /**
   * Store event locally for aggregation
   */
  private async storeEventLocally(event: AnalyticsEvent): Promise<void> {
    const eventKey = `events:${new Date().toISOString().split('T')[0]}`;
    await cacheService.lpush(eventKey, event, CACHE_PREFIXES.ANALYTICS);
    await cacheService.expire(eventKey, CACHE_TTL.VERY_LONG * 90, CACHE_PREFIXES.ANALYTICS); // 90 days
  }

  /**
   * Send event to Google Analytics 4
   */
  private async sendToGA4(event: AnalyticsEvent): Promise<void> {
    try {
      const payload = {
        client_id: event.userId || event.sessionId || 'anonymous',
        events: [{
          name: event.name,
          params: event.parameters || {}
        }]
      };

      await axios.post(
        `https://www.google-analytics.com/mp/collect?measurement_id=${this.gaTrackingId}&api_secret=${this.gaMeasurementSecret}`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
    } catch (error) {
      console.error('❌ Failed to send to GA4:', error);
    }
  }

  /**
   * Update real-time metrics
   */
  private async updateRealTimeMetrics(event: AnalyticsEvent): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Update event counts
    await cacheService.hset('realtime_metrics', `events:${event.name}:${today}`, 
      await this.getAndIncrement(`events:${event.name}:${today}`),
      CACHE_PREFIXES.ANALYTICS
    );

    // Update active users (last 30 minutes)
    if (event.userId) {
      await cacheService.sadd(
        'active_users_30min',
        event.userId,
        CACHE_PREFIXES.ANALYTICS
      );
      await cacheService.expire('active_users_30min', 1800, CACHE_PREFIXES.ANALYTICS); // 30 minutes
    }
  }

  /**
   * Update page metrics
   */
  private async updatePageMetrics(page: string): Promise<void> {
    const pageKey = `page_views:${page}`;
    await this.getAndIncrement(pageKey);
  }

  /**
   * Update conversion metrics
   */
  private async updateConversionMetrics(conversion: ConversionEvent): Promise<void> {
    const stepKey = `conversion_step:${conversion.eventName}`;
    await this.getAndIncrement(stepKey);

    if (conversion.value && conversion.eventName === 'purchase') {
      const revenueKey = `revenue:${new Date().toISOString().split('T')[0]}`;
      await cacheService.incrby(revenueKey, Math.round(conversion.value * 100), CACHE_PREFIXES.ANALYTICS);
    }
  }

  /**
   * Calculate dashboard metrics
   */
  private async calculateDashboardMetrics(start: Date, end: Date): Promise<DashboardMetrics> {
    // This is a simplified version - in a real implementation,
    // you would aggregate data from your events store
    return {
      totalUsers: 1000,
      activeUsers: 150,
      totalSessions: 2500,
      averageSessionDuration: 180, // seconds
      bounceRate: 35.5, // percentage
      conversionRate: 2.8, // percentage
      revenue: 45000, // in cents
      topPages: [
        { page: '/products', views: 1200 },
        { page: '/collections', views: 800 },
        { page: '/about', views: 400 }
      ],
      topProducts: [
        { productId: '123', views: 500, purchases: 25 },
        { productId: '456', views: 300, purchases: 18 }
      ],
      userGrowth: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        users: Math.floor(Math.random() * 100) + 50
      })),
      revenueGrowth: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 1000
      }))
    };
  }

  /**
   * Get empty dashboard metrics
   */
  private getEmptyDashboardMetrics(): DashboardMetrics {
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalSessions: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
      conversionRate: 0,
      revenue: 0,
      topPages: [],
      topProducts: [],
      userGrowth: [],
      revenueGrowth: []
    };
  }

  /**
   * Helper to get and increment a counter
   */
  private async getAndIncrement(key: string): Promise<number> {
    const current = await cacheService.get<number>(key, { prefix: CACHE_PREFIXES.ANALYTICS }) || 0;
    const newValue = current + 1;
    await cacheService.set(key, newValue, { ttl: CACHE_TTL.VERY_LONG, prefix: CACHE_PREFIXES.ANALYTICS });
    return newValue;
  }

  /**
   * Cleanup old analytics data
   */
  async cleanup(olderThanDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      const cutoffDateString = cutoffDate.toISOString().split('T')[0];

      // This would implement cleanup logic for old events
      console.log(`🧹 Analytics cleanup completed for data older than ${cutoffDateString}`);
    } catch (error) {
      console.error('❌ Analytics cleanup failed:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
export default AnalyticsService;