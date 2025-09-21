import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: number;
  currency?: string;
  availability?: 'in stock' | 'out of stock';
  brand?: string;
  category?: string;
  structuredData?: object;
}

export default function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  price,
  currency = 'USD',
  availability,
  brand,
  category,
  structuredData
}: SEOProps) {
  const siteTitle = 'GCG - Luxury Eyewear';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const currentUrl = url || window.location.href;
  const defaultImage = '/images/og-image.jpg';
  const ogImage = image || defaultImage;

  // Product structured data for e-commerce
  const productStructuredData = type === 'product' && price ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": title,
    "description": description,
    "image": [ogImage],
    "brand": {
      "@type": "Brand",
      "name": brand || "GCG"
    },
    "category": category,
    "offers": {
      "@type": "Offer",
      "url": currentUrl,
      "priceCurrency": currency,
      "price": price,
      "availability": `https://schema.org/${availability === 'in stock' ? 'InStock' : 'OutOfStock'}`,
      "seller": {
        "@type": "Organization",
        "name": "GCG"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    }
  } : null;

  // Organization structured data
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GCG",
    "description": "Premium luxury eyewear and sunglasses collection",
    "url": "https://gcg-eyewear.com",
    "logo": "https://gcg-eyewear.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-GCG-EYES",
      "contactType": "customer service",
      "availableLanguage": "English"
    },
    "sameAs": [
      "https://www.instagram.com/gcg_eyewear",
      "https://www.facebook.com/gcg_eyewear",
      "https://twitter.com/gcg_eyewear"
    ]
  };

  // Combine structured data
  const finalStructuredData = structuredData || productStructuredData || organizationStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@gcg_eyewear" />

      {/* Product Specific Meta Tags */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
          {availability && <meta property="product:availability" content={availability} />}
          {brand && <meta property="product:brand" content={brand} />}
          {category && <meta property="product:category" content={category} />}
        </>
      )}

      {/* Structured Data */}
      {finalStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(finalStructuredData)}
        </script>
      )}

      {/* Performance and Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />

      {/* Preload Critical Resources */}
      <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="" />
      <link rel="preconnect" href="https://images.unsplash.com" />
      
      {/* Theme and App Configuration */}
      <meta name="theme-color" content="#000000" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="GCG" />
    </Helmet>
  );
}