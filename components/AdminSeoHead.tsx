"use client";

import Head from "next/head";
import { useAdminSeoMetadata } from "@/contexts/AdminSeoContext";

interface AdminSeoHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
  type?: "page" | "product" | "category";
  image?: string;
  productData?: any;
  categoryData?: any;
  children?: React.ReactNode;
}

export function AdminSeoHead({
  title,
  description,
  keywords,
  path,
  type = "page",
  image,
  productData,
  categoryData,
  children,
}: AdminSeoHeadProps) {
  const seoMetadata = useAdminSeoMetadata({
    title,
    description,
    keywords,
    path,
    type,
    image,
    productData,
    categoryData,
  });

  return (
    <Head>
      {/* Basic meta tags */}
      <title>{seoMetadata.title}</title>
      <meta name="description" content={seoMetadata.description} />
      <meta name="keywords" content={seoMetadata.keywords} />
      <link rel="canonical" href={seoMetadata.canonicalUrl} />

      {/* Open Graph meta tags */}
      <meta property="og:title" content={seoMetadata.ogTitle} />
      <meta property="og:description" content={seoMetadata.ogDescription} />
      <meta property="og:image" content={seoMetadata.ogImage} />
      <meta property="og:url" content={seoMetadata.ogUrl} />
      <meta
        property="og:type"
        content="website"
      />
      <meta property="og:site_name" content="HACOM" />

      {/* Twitter Card meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoMetadata.twitterTitle} />
      <meta
        name="twitter:description"
        content={seoMetadata.twitterDescription}
      />
      <meta name="twitter:image" content={seoMetadata.twitterImage} />

      {/* Structured Data */}
      {seoMetadata.structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(seoMetadata.structuredData),
          }}
        />
      )}

      {/* Additional custom content */}
      {children}
    </Head>
  );
}
