// Performance monitoring and error logging utilities

interface PerformanceMetrics {
  navigationTiming?: PerformanceNavigationTiming;
  resourceTimings?: PerformanceResourceTiming[];
  paintTimings?: PerformanceEntry[];
  vitals?: {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    ttfb?: number; // Time to First Byte
  };
}

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  line?: number;
  column?: number;
  timestamp: number;
  userAgent: string;
  userId?: string;
  sessionId: string;
  route: string;
  additionalContext?: any;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private sessionId: string;
  private errors: ErrorReport[] = [];
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.init();
  }

  private generateSessionId(): string {
    return `gcg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;
    this.setupErrorHandling();
    this.setupPerformanceObservers();
    this.collectInitialMetrics();
  }

  private setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        route: window.location.pathname,
        additionalContext: {
          type: 'javascript-error',
          error: event.error
        }
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        route: window.location.pathname,
        additionalContext: {
          type: 'promise-rejection',
          reason: event.reason
        }
      });
    });

    // React error boundary fallback
    window.addEventListener('react-error', ((event: CustomEvent) => {
      this.logError({
        message: event.detail.message,
        stack: event.detail.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        route: window.location.pathname,
        additionalContext: {
          type: 'react-error',
          componentStack: event.detail.componentStack
        }
      });
    }) as EventListener);
  }

  private setupPerformanceObservers() {
    // Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeResourceTiming();
    this.observeNavigationTiming();
  }

  private observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lcp = entries[entries.length - 1] as PerformanceEntry;
          this.metrics.vitals = {
            ...this.metrics.vitals,
            lcp: lcp.startTime
          };
          this.reportVital('LCP', lcp.startTime);
        }
      });

      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (error) {
        console.warn('LCP observer not supported');
      }
    }
  }

  private observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const fid = entries[0] as PerformanceEventTiming;
          const delay = fid.processingStart - fid.startTime;
          this.metrics.vitals = {
            ...this.metrics.vitals,
            fid: delay
          };
          this.reportVital('FID', delay);
        }
      });

      try {
        observer.observe({ type: 'first-input', buffered: true });
      } catch (error) {
        console.warn('FID observer not supported');
      }
    }
  }

  private observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        
        this.metrics.vitals = {
          ...this.metrics.vitals,
          cls: clsValue
        };
        this.reportVital('CLS', clsValue);
      });

      try {
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (error) {
        console.warn('CLS observer not supported');
      }
    }
  }

  private observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        this.metrics.resourceTimings = [
          ...(this.metrics.resourceTimings || []),
          ...entries
        ];

        // Report slow resources
        entries.forEach(entry => {
          if (entry.duration > 1000) { // Resources taking more than 1 second
            this.logSlowResource(entry);
          }
        });
      });

      try {
        observer.observe({ type: 'resource', buffered: true });
      } catch (error) {
        console.warn('Resource timing observer not supported');
      }
    }
  }

  private observeNavigationTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceNavigationTiming[];
        if (entries.length > 0) {
          this.metrics.navigationTiming = entries[0];
          
          // Calculate and report TTFB
          const ttfb = entries[0].responseStart - entries[0].requestStart;
          this.metrics.vitals = {
            ...this.metrics.vitals,
            ttfb: ttfb
          };
          this.reportVital('TTFB', ttfb);
        }
      });

      try {
        observer.observe({ type: 'navigation', buffered: true });
      } catch (error) {
        console.warn('Navigation timing observer not supported');
      }
    }
  }

  private collectInitialMetrics() {
    // Collect FCP when available
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcp) {
            this.metrics.vitals = {
              ...this.metrics.vitals,
              fcp: fcp.startTime
            };
            this.reportVital('FCP', fcp.startTime);
          }
        }
      });

      try {
        observer.observe({ type: 'paint', buffered: true });
      } catch (error) {
        console.warn('Paint timing observer not supported');
      }
    }
  }

  private reportVital(name: string, value: number) {
    // Report to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        custom_parameter_1: name,
        custom_parameter_2: Math.round(value),
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value)
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name}: ${Math.round(value)}ms`);
    }
  }

  private logSlowResource(entry: PerformanceResourceTiming) {
    console.warn(`Slow resource detected: ${entry.name} took ${Math.round(entry.duration)}ms`);
    
    // Report to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'slow_resource', {
        resource_url: entry.name,
        duration: Math.round(entry.duration),
        event_category: 'Performance',
        event_label: 'Slow Resource'
      });
    }
  }

  logError(error: ErrorReport) {
    this.errors.push(error);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', error);
    }

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_parameter_1: error.url,
        custom_parameter_2: error.route
      });
    }

    // Send to error reporting service (implement as needed)
    this.sendToErrorService(error);
  }

  private async sendToErrorService(error: ErrorReport) {
    // Implement your error reporting service here
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (e) {
      console.warn('Failed to send error to reporting service:', e);
    }
  }

  // Method to manually log custom events
  logCustomEvent(eventName: string, data: any) {
    const event = {
      name: eventName,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      route: window.location.pathname
    };

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'Custom',
        ...data
      });
    }

    console.log('Custom event:', event);
  }

  // Method to get current metrics
  getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  // Method to get error reports
  getErrors(): ErrorReport[] {
    return this.errors;
  }

  // Method to clear errors
  clearErrors() {
    this.errors = [];
  }
}

// Error boundary helper for React
export const logReactError = (error: Error, errorInfo: any) => {
  const event = new CustomEvent('react-error', {
    detail: {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    }
  });
  window.dispatchEvent(event);
};

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common performance tasks
export const measureAsyncOperation = async <T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - start;
    
    performanceMonitor.logCustomEvent('async_operation', {
      operation_name: name,
      duration: Math.round(duration),
      status: 'success'
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    performanceMonitor.logCustomEvent('async_operation', {
      operation_name: name,
      duration: Math.round(duration),
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
};

export const measureRender = (componentName: string, renderTime: number) => {
  if (renderTime > 16) { // Flag slow renders (>16ms for 60fps)
    performanceMonitor.logCustomEvent('slow_render', {
      component: componentName,
      render_time: Math.round(renderTime)
    });
  }
};

export default performanceMonitor;