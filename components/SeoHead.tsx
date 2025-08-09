"use client";

import Head from 'next/head';
import { useEffect, useState } from 'react';
import { seoService, type PageSeoData } from '@/lib/seo-service';

interface SeoHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: 'page' | 'product' | 'category';
  productData?: any;
  categoryData?: any;
  noIndex?: boolean;
  children?: React.ReactNode;
}

export default function SeoHead({
  title,
  description,
  keywords,
  canonical,
  image,
  type = 'page',
  productData,
  categoryData,
  noIndex = false,
  children
}: SeoHeadProps) {
  const [seoData, setSeoData] = useState<PageSeoData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function generateSeoData() {
      try {
        const path = typeof window !== 'undefined' ? window.location.pathname : canonical || '';
        
        const data = await seoService.generatePageSeo({
          title,
          description,
          keywords,
          path,
          type,
          image,
          productData,
          categoryData
        });
        
        setSeoData(data);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error generating SEO data:', error);
        setIsLoaded(true);
      }
    }

    generateSeoData();
  }, [title, description, keywords, canonical, image, type, productData, categoryData]);

  if (!isLoaded || !seoData) {
    return null;
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={seoData.keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={seoData.canonical} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={seoData.ogTitle} />
      <meta property="og:description" content={seoData.ogDescription} />
      <meta property="og:image" content={seoData.ogImage} />
      <meta property="og:url" content={seoData.ogUrl} />
      <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
      <meta property="og:site_name" content="HACOM" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoData.twitterTitle} />
      <meta name="twitter:description" content={seoData.twitterDescription} />
      <meta name="twitter:image" content={seoData.twitterImage} />
      
      {/* Structured Data */}
      {seoData.structuredData && Object.keys(seoData.structuredData).map((key) => (
        <script
          key={key}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(seoData.structuredData[key])
          }}
        />
      ))}
      
      {/* Additional children */}
      {children}
    </Head>
  );
}

// Higher-order component for pages
export function withSeo(Component: React.ComponentType<any>, defaultSeoProps: Partial<SeoHeadProps> = {}) {
  return function SeoWrappedComponent(props: any) {
    const seoProps = { ...defaultSeoProps, ...props.seoProps };
    
    return (
      <>
        <SeoHead {...seoProps} />
        <Component {...props} />
      </>
    );
  };
}
