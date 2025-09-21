import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics 4 tracking
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
    fbq: (command: string, ...args: any[]) => void;
  }
}

const GA_TRACKING_ID = 'G-XXXXXXXXXX'; // Replace with actual GA4 ID
const FB_PIXEL_ID = '1234567890123456'; // Replace with actual Facebook Pixel ID

export const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize Google Analytics
    if (typeof window !== 'undefined' && !window.gtag) {
      // Load GA4 script
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
      document.head.appendChild(script1);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', GA_TRACKING_ID, {
        page_location: window.location.href,
        page_title: document.title,
        send_page_view: false // We'll send manually
      });

      // Load Facebook Pixel
      const script2 = document.createElement('script');
      script2.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${FB_PIXEL_ID}');
      `;
      document.head.appendChild(script2);

      // Load Facebook Pixel no-script fallback
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `
        <img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1" />
      `;
      document.body.appendChild(noscript);
    }
  }, []);

  useEffect(() => {
    // Track page views on route change
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_TRACKING_ID, {
        page_location: window.location.href,
        page_title: document.title,
      });
      
      // Track page view
      window.gtag('event', 'page_view', {
        page_location: window.location.href,
        page_title: document.title,
      });
    }

    // Facebook Pixel page view
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location]);

  return null;
};

// Event tracking functions
export const trackEvent = (eventName: string, parameters?: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

export const trackPurchase = (transactionId: string, value: number, currency = 'USD', items: any[] = []) => {
  // Google Analytics Enhanced Ecommerce
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        item_brand: item.brand || 'GCG'
      }))
    });
  }

  // Facebook Pixel Purchase
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      value: value,
      currency: currency,
      content_ids: items.map(item => item.id),
      content_type: 'product',
      num_items: items.reduce((total, item) => total + item.quantity, 0)
    });
  }
};

export const trackAddToCart = (item: any) => {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'USD',
      value: item.price * item.quantity,
      items: [{
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        item_brand: item.brand || 'GCG'
      }]
    });
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [item.id],
      content_type: 'product',
      value: item.price * item.quantity,
      currency: 'USD'
    });
  }
};

export const trackViewItem = (item: any) => {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'USD',
      value: item.price,
      items: [{
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        price: item.price,
        item_brand: item.brand || 'GCG'
      }]
    });
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [item.id],
      content_type: 'product',
      value: item.price,
      currency: 'USD'
    });
  }
};

export const trackBeginCheckout = (items: any[], value: number) => {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'USD',
      value: value,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        item_brand: item.brand || 'GCG'
      }))
    });
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: items.map(item => item.id),
      content_type: 'product',
      value: value,
      currency: 'USD',
      num_items: items.reduce((total, item) => total + item.quantity, 0)
    });
  }
};

export const trackSearch = (searchTerm: string, results?: number) => {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      ...(results !== undefined && { search_results: results })
    });
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Search', {
      search_string: searchTerm
    });
  }
};

export const trackSignUp = (method?: string) => {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method || 'email'
    });
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      status: true
    });
  }
};

export const trackLogin = (method?: string) => {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'login', {
      method: method || 'email'
    });
  }
};

export const trackShare = (method: string, contentType: string, itemId?: string) => {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'share', {
      method: method,
      content_type: contentType,
      item_id: itemId
    });
  }
};

export default Analytics;