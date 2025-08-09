"use client";

import { useEffect, useState } from 'react';
import Head from 'next/head';

interface SeoData {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  structuredData?: any;
  pageType?: string;
  productData?: any;
  categoryData?: any;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

interface SeoSettings {
  general: {
    site_name: string;
    site_url: string;
    site_description: string;
    site_keywords: string;
    default_meta_title_pattern: string;
    product_meta_title_pattern: string;
    category_meta_title_pattern: string;
    auto_generate_meta_description: boolean;
    meta_description_length: number;
  };
  social: {
    facebook_app_id: string;
    twitter_site: string;
    default_og_image: string;
  };
  analytics: {
    google_analytics_id: string;
    google_tag_manager_id: string;
    google_search_console_verification: string;
    bing_webmaster_verification: string;
    facebook_pixel_id: string;
    enable_analytics: boolean;
  };
  schema: {
    organization_name: string;
    organization_logo: string;
    organization_address: string;
    organization_phone: string;
    organization_email: string;
    business_type: string;
    business_hours: string;
    latitude: number;
    longitude: number;
    enable_organization_schema: boolean;
    enable_breadcrumb_schema: boolean;
    enable_product_schema: boolean;
    enable_review_schema: boolean;
  };
}

interface SeoHeadProps {
  data?: SeoData;
}

export default function SeoHead({ data }: SeoHeadProps) {
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadSeoSettings();
  }, []);

  const loadSeoSettings = async () => {
    try {
      // Only load on client side
      if (typeof window === 'undefined') return;

      const response = await fetch('/api/seo/settings');
      const result = await response.json();
      if (result.success) {
        setSeoSettings(result.data);
      }
    } catch (error) {
      console.error('Error loading SEO settings:', error);
      // Set fallback settings
      setSeoSettings({
        general: {
          site_name: "HACOM - Máy tính, Laptop, Gaming Gear",
          site_url: "https://hacom.vn",
          site_description: "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
          site_keywords: "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM",
          default_meta_title_pattern: "{title} | HACOM",
          product_meta_title_pattern: "{product_name} - {category} | HACOM",
          category_meta_title_pattern: "{category_name} - {description} | HACOM",
          auto_generate_meta_description: true,
          meta_description_length: 160
        },
        social: {
          facebook_app_id: "",
          twitter_site: "@hacom_vn",
          default_og_image: "/og-image.jpg"
        },
        analytics: {
          google_analytics_id: "",
          google_tag_manager_id: "",
          google_search_console_verification: "",
          bing_webmaster_verification: "",
          facebook_pixel_id: "",
          enable_analytics: false
        },
        schema: {
          organization_name: "HACOM",
          organization_logo: "/logo.png",
          organization_address: "Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội",
          organization_phone: "1900 1903",
          organization_email: "contact@hacom.vn",
          business_type: "ElectronicsStore",
          business_hours: "Mo-Su 08:00-22:00",
          latitude: 21.0285,
          longitude: 105.8542,
          enable_organization_schema: true,
          enable_breadcrumb_schema: true,
          enable_product_schema: true,
          enable_review_schema: true
        }
      });
    }
  };

  if (!mounted || !seoSettings) {
    return null;
  }

  // Generate title based on patterns
  const generateTitle = () => {
    if (data?.title) {
      let titlePattern = seoSettings.general.default_meta_title_pattern;
      
      if (data.pageType === 'product' && data.productData) {
        titlePattern = seoSettings.general.product_meta_title_pattern;
        return titlePattern
          .replace('{product_name}', data.productData.name || data.title)
          .replace('{category}', data.productData.category || '')
          .replace('{price}', data.productData.price || '')
          .replace('{sku}', data.productData.sku || '');
      } else if (data.pageType === 'category' && data.categoryData) {
        titlePattern = seoSettings.general.category_meta_title_pattern;
        return titlePattern
          .replace('{category_name}', data.categoryData.name || data.title)
          .replace('{description}', data.categoryData.description || '')
          .replace('{count}', data.categoryData.count || '');
      }
      
      return titlePattern
        .replace('{title}', data.title)
        .replace('{sitename}', seoSettings.general.site_name);
    }
    
    return seoSettings.general.site_name;
  };

  // Generate description
  const generateDescription = () => {
    if (data?.description) {
      const maxLength = seoSettings.general.meta_description_length;
      return data.description.length > maxLength 
        ? data.description.substring(0, maxLength - 3) + '...'
        : data.description;
    }
    return seoSettings.general.site_description;
  };

  // Generate keywords
  const generateKeywords = () => {
    if (data?.keywords) {
      return `${data.keywords}, ${seoSettings.general.site_keywords}`;
    }
    return seoSettings.general.site_keywords;
  };

  // Generate canonical URL
  const generateCanonical = () => {
    if (data?.canonical) {
      return data.canonical;
    }
    if (typeof window !== 'undefined') {
      return `${seoSettings.general.site_url}${window.location.pathname}`;
    }
    return seoSettings.general.site_url;
  };

  // Generate Open Graph image
  const generateOgImage = () => {
    if (data?.ogImage) {
      return data.ogImage.startsWith('http') ? data.ogImage : `${seoSettings.general.site_url}${data.ogImage}`;
    }
    return `${seoSettings.general.site_url}${seoSettings.social.default_og_image}`;
  };

  // Generate Organization Schema
  const generateOrganizationSchema = () => {
    if (!seoSettings.schema.enable_organization_schema) return null;

    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": seoSettings.schema.organization_name,
      "url": seoSettings.general.site_url,
      "logo": `${seoSettings.general.site_url}${seoSettings.schema.organization_logo}`,
      "description": seoSettings.general.site_description,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": seoSettings.schema.organization_address,
        "addressCountry": "VN"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": seoSettings.schema.organization_phone,
        "contactType": "customer service",
        "email": seoSettings.schema.organization_email
      },
      "sameAs": [
        seoSettings.social.facebook_app_id ? `https://facebook.com/${seoSettings.social.facebook_app_id}` : null,
        seoSettings.social.twitter_site ? `https://twitter.com/${seoSettings.social.twitter_site.replace('@', '')}` : null,
      ].filter(Boolean),
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": seoSettings.schema.latitude,
        "longitude": seoSettings.schema.longitude
      },
      "openingHours": seoSettings.schema.business_hours,
      "@id": `${seoSettings.general.site_url}#organization`
    };
  };

  // Generate Website Schema
  const generateWebsiteSchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": seoSettings.general.site_name,
      "url": seoSettings.general.site_url,
      "description": seoSettings.general.site_description,
      "publisher": {
        "@id": `${seoSettings.general.site_url}#organization`
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${seoSettings.general.site_url}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };
  };

  // Generate Breadcrumb Schema
  const generateBreadcrumbSchema = () => {
    if (!seoSettings.schema.enable_breadcrumb_schema || !data?.breadcrumbs) return null;

    const breadcrumbList = data.breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `${seoSettings.general.site_url}${crumb.url}`
    }));

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbList
    };
  };

  // Generate Product Schema
  const generateProductSchema = () => {
    if (!seoSettings.schema.enable_product_schema || !data?.productData) return null;

    const product = data.productData;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "sku": product.sku,
      "mpn": product.mpn,
      "brand": {
        "@type": "Brand",
        "name": product.brand || seoSettings.schema.organization_name
      },
      "image": product.images?.map((img: string) => 
        img.startsWith('http') ? img : `${seoSettings.general.site_url}${img}`
      ),
      "offers": {
        "@type": "Offer",
        "url": `${seoSettings.general.site_url}/products/${product.id}`,
        "priceCurrency": "VND",
        "price": product.price,
        "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@id": `${seoSettings.general.site_url}#organization`
        }
      },
      ...(product.aggregateRating && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.aggregateRating.ratingValue,
          "reviewCount": product.aggregateRating.reviewCount
        }
      })
    };
  };

  // Combine all schemas
  const combineSchemas = () => {
    const schemas = [
      generateOrganizationSchema(),
      generateWebsiteSchema(),
      generateBreadcrumbSchema(),
      generateProductSchema(),
      data?.structuredData
    ].filter(Boolean);

    return schemas.length > 0 ? {
      "@context": "https://schema.org",
      "@graph": schemas
    } : null;
  };

  const title = generateTitle();
  const description = generateDescription();
  const keywords = generateKeywords();
  const canonical = generateCanonical();
  const ogImage = generateOgImage();
  const combinedSchema = combineSchemas();

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content={seoSettings.schema.organization_name} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={data?.ogType || "website"} />
      <meta property="og:site_name" content={seoSettings.general.site_name} />
      {seoSettings.social.facebook_app_id && (
        <meta property="fb:app_id" content={seoSettings.social.facebook_app_id} />
      )}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={data?.twitterCard || "summary_large_image"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {seoSettings.social.twitter_site && (
        <meta name="twitter:site" content={seoSettings.social.twitter_site} />
      )}
      
      {/* Search Engine Verification */}
      {seoSettings.analytics.google_search_console_verification && (
        <meta name="google-site-verification" content={seoSettings.analytics.google_search_console_verification} />
      )}
      {seoSettings.analytics.bing_webmaster_verification && (
        <meta name="msvalidate.01" content={seoSettings.analytics.bing_webmaster_verification} />
      )}
      
      {/* Structured Data */}
      {combinedSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(combinedSchema)
          }}
        />
      )}
      
      {/* Analytics Scripts */}
      {seoSettings.analytics.enable_analytics && (
        <>
          {/* Google Analytics 4 */}
          {seoSettings.analytics.google_analytics_id && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${seoSettings.analytics.google_analytics_id}`}
              />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${seoSettings.analytics.google_analytics_id}');
                  `
                }}
              />
            </>
          )}
          
          {/* Google Tag Manager */}
          {seoSettings.analytics.google_tag_manager_id && (
            <>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','${seoSettings.analytics.google_tag_manager_id}');
                  `
                }}
              />
              <noscript>
                <iframe 
                  src={`https://www.googletagmanager.com/ns.html?id=${seoSettings.analytics.google_tag_manager_id}`}
                  height="0" 
                  width="0" 
                  style={{ display: 'none', visibility: 'hidden' }}
                />
              </noscript>
            </>
          )}
          
          {/* Facebook Pixel */}
          {seoSettings.analytics.facebook_pixel_id && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${seoSettings.analytics.facebook_pixel_id}');
                  fbq('track', 'PageView');
                `
              }}
            />
          )}
        </>
      )}
    </Head>
  );
}
