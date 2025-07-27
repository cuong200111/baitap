"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import { seoManager, SeoMetaData } from "@/lib/seo-utils";

interface SeoHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  structuredData?: any;
  breadcrumbs?: Array<{ name: string; url: string }>;
  productData?: any;
  categoryData?: any;
  customMeta?: SeoMetaData;
}

export default function SeoHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = "website",
  noIndex = false,
  noFollow = false,
  structuredData,
  breadcrumbs,
  productData,
  categoryData,
  customMeta,
}: SeoHeadProps) {
  const [metaData, setMetaData] = useState<SeoMetaData | null>(null);
  const [analytics, setAnalytics] = useState<string>("");

  useEffect(() => {
    const generateMeta = async () => {
      let seoData: SeoMetaData;

      // Use custom meta data if provided
      if (customMeta) {
        seoData = customMeta;
      }
      // Generate product meta data
      else if (productData) {
        seoData = await seoManager.generateProductMeta(productData);
      }
      // Generate category meta data
      else if (categoryData) {
        seoData = await seoManager.generateCategoryMeta(categoryData);
      }
      // Generate default/homepage meta data
      else {
        seoData = await seoManager.generateHomepageMeta();
      }

      // Override with props if provided
      if (title) seoData.title = title;
      if (description) seoData.description = description;
      if (keywords) seoData.keywords = keywords;
      if (canonicalUrl) seoData.canonicalUrl = canonicalUrl;
      if (ogImage) seoData.ogImage = ogImage;
      if (ogType) seoData.ogType = ogType;
      if (noIndex || noFollow) {
        seoData.robots = {
          index: !noIndex,
          follow: !noFollow,
        };
      }

      // Add breadcrumb structured data
      if (breadcrumbs && breadcrumbs.length > 0) {
        const breadcrumbSchema =
          seoManager.generateBreadcrumbSchema(breadcrumbs);
        if (breadcrumbSchema) {
          if (seoData.structuredData) {
            // If there's already structured data, create an array
            if (Array.isArray(seoData.structuredData)) {
              seoData.structuredData.push(breadcrumbSchema);
            } else {
              seoData.structuredData = [
                seoData.structuredData,
                breadcrumbSchema,
              ];
            }
          } else {
            seoData.structuredData = breadcrumbSchema;
          }
        }
      }

      // Add custom structured data
      if (structuredData) {
        if (seoData.structuredData) {
          if (Array.isArray(seoData.structuredData)) {
            seoData.structuredData.push(structuredData);
          } else {
            seoData.structuredData = [seoData.structuredData, structuredData];
          }
        } else {
          seoData.structuredData = structuredData;
        }
      }

      setMetaData(seoData);

      // Generate analytics tags
      const analyticsHtml = seoManager.generateAnalyticsTags();
      setAnalytics(analyticsHtml);
    };

    generateMeta();
  }, [
    title,
    description,
    keywords,
    canonicalUrl,
    ogImage,
    ogType,
    noIndex,
    noFollow,
    structuredData,
    breadcrumbs,
    productData,
    categoryData,
    customMeta,
  ]);

  if (!metaData) {
    return null;
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{metaData.title}</title>
      <meta name="description" content={metaData.description} />
      {metaData.keywords && (
        <meta name="keywords" content={metaData.keywords} />
      )}
      {metaData.canonicalUrl && (
        <link rel="canonical" href={metaData.canonicalUrl} />
      )}

      {/* Robots */}
      <meta
        name="robots"
        content={`${metaData.robots?.index ? "index" : "noindex"},${metaData.robots?.follow ? "follow" : "nofollow"}`}
      />

      {/* Open Graph */}
      <meta property="og:title" content={metaData.ogTitle || metaData.title} />
      <meta
        property="og:description"
        content={metaData.ogDescription || metaData.description}
      />
      <meta property="og:type" content={metaData.ogType || "website"} />
      {metaData.canonicalUrl && (
        <meta property="og:url" content={metaData.canonicalUrl} />
      )}
      {metaData.ogImage && (
        <meta property="og:image" content={metaData.ogImage} />
      )}
      <meta property="og:site_name" content="HACOM" />

      {/* Twitter Card */}
      <meta
        name="twitter:card"
        content={metaData.twitterCard || "summary_large_image"}
      />
      <meta
        name="twitter:title"
        content={metaData.twitterTitle || metaData.title}
      />
      <meta
        name="twitter:description"
        content={metaData.twitterDescription || metaData.description}
      />
      {metaData.twitterImage && (
        <meta name="twitter:image" content={metaData.twitterImage} />
      )}

      {/* Additional Meta Tags */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=5"
      />
      <meta name="theme-color" content="#dc2626" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="format-detection" content="telephone=no" />

      {/* Favicon and Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link rel="manifest" href="/site.webmanifest" />

      {/* DNS Prefetch for Performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      <link rel="dns-prefetch" href="//connect.facebook.net" />

      {/* Preload Critical Resources */}
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />

      {/* Language and Region */}
      <meta httpEquiv="content-language" content="vi" />
      <meta name="geo.region" content="VN" />
      <meta name="geo.placename" content="Vietnam" />

      {/* Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

      {/* Structured Data */}
      {metaData.structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(metaData.structuredData, null, 2),
          }}
        />
      )}

      {/* Analytics and Tracking */}
      {analytics && <div dangerouslySetInnerHTML={{ __html: analytics }} />}
    </Head>
  );
}

// Specific SEO components for different page types
export function ProductSeoHead({
  product,
  breadcrumbs,
}: {
  product: any;
  breadcrumbs?: Array<{ name: string; url: string }>;
}) {
  return <SeoHead productData={product} breadcrumbs={breadcrumbs} />;
}

export function CategorySeoHead({
  category,
  breadcrumbs,
}: {
  category: any;
  breadcrumbs?: Array<{ name: string; url: string }>;
}) {
  return <SeoHead categoryData={category} breadcrumbs={breadcrumbs} />;
}

export function HomepageSeoHead() {
  return <SeoHead />;
}

// Custom hook for managing SEO data
export function useSeo(pageType: string, entityId?: string | number) {
  const [seoData, setSeoData] = useState<SeoMetaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSeoData = async () => {
      try {
        setLoading(true);

        let data: SeoMetaData;

        switch (pageType) {
          case "homepage":
            data = await seoManager.generateHomepageMeta();
            break;
          case "product":
            if (entityId) {
              // Load product data and generate meta
              const response = await fetch(`/api/products/${entityId}`);
              const productData = await response.json();
              if (productData.success) {
                data = await seoManager.generateProductMeta(productData.data);
              } else {
                data = await seoManager.generateHomepageMeta();
              }
            } else {
              data = await seoManager.generateHomepageMeta();
            }
            break;
          case "category":
            if (entityId) {
              // Load category data and generate meta
              const response = await fetch(`/api/categories/${entityId}`);
              const categoryData = await response.json();
              if (categoryData.success) {
                data = await seoManager.generateCategoryMeta(categoryData.data);
              } else {
                data = await seoManager.generateHomepageMeta();
              }
            } else {
              data = await seoManager.generateHomepageMeta();
            }
            break;
          default:
            data = await seoManager.generateHomepageMeta();
        }

        setSeoData(data);
      } catch (error) {
        console.error("Failed to load SEO data:", error);
        // Fallback to homepage meta
        const fallback = await seoManager.generateHomepageMeta();
        setSeoData(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadSeoData();
  }, [pageType, entityId]);

  return { seoData, loading };
}
