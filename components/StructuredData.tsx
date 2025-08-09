"use client";

import { useEffect, useState } from 'react';
import { seoService, SeoSettings } from '@/lib/seo-service';

interface StructuredDataProps {
  type?: 'organization' | 'website' | 'breadcrumb' | 'product';
  data?: any;
}

export default function StructuredData({ type = 'organization', data }: StructuredDataProps) {
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(null);

  useEffect(() => {
    async function loadSeoSettings() {
      try {
        const settings = await seoService.loadSettings();
        setSeoSettings(settings);
      } catch (error) {
        console.error('Failed to load SEO settings:', error);
      }
    }

    loadSeoSettings();
  }, []);

  if (!seoSettings) return null;

  let structuredData: any = {};

  switch (type) {
    case 'organization':
      if (seoSettings.schema.enable_organization_schema) {
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: seoSettings.schema.organization_name,
          url: seoSettings.general.site_url,
          logo: `${seoSettings.general.site_url}${seoSettings.schema.organization_logo}`,
          description: seoSettings.general.site_description,
          address: {
            "@type": "PostalAddress",
            addressLocality: seoSettings.schema.organization_address
          },
          contactPoint: {
            "@type": "ContactPoint",
            telephone: seoSettings.schema.organization_phone,
            contactType: "customer service",
            availableLanguage: "Vietnamese"
          },
          sameAs: [
            seoSettings.social.facebook_app_id ? `https://facebook.com/${seoSettings.social.facebook_app_id}` : null,
            seoSettings.social.twitter_site ? `https://twitter.com/${seoSettings.social.twitter_site.replace('@', '')}` : null,
          ].filter(Boolean)
        };
      }
      break;

    case 'website':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: seoSettings.general.site_name,
        description: seoSettings.general.site_description,
        url: seoSettings.general.site_url,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${seoSettings.general.site_url}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        },
        publisher: {
          "@type": "Organization",
          name: seoSettings.schema.organization_name
        }
      };
      break;

    case 'breadcrumb':
      if (data && data.items) {
        structuredData = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: data.items.map((item: any, index: number) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: `${seoSettings.general.site_url}${item.url}`
          }))
        };
      }
      break;

    case 'product':
      if (seoSettings.schema.enable_product_schema && data) {
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: data.name,
          description: data.description,
          image: data.image ? `${seoSettings.general.site_url}${data.image}` : undefined,
          sku: data.sku,
          brand: {
            "@type": "Brand",
            name: seoSettings.schema.organization_name
          },
          offers: {
            "@type": "Offer",
            price: data.price,
            priceCurrency: "VND",
            availability: data.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            seller: {
              "@type": "Organization",
              name: seoSettings.schema.organization_name
            }
          },
          ...(data.rating && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: data.rating.value,
              reviewCount: data.rating.count
            }
          })
        };
      }
      break;
  }

  // Don't render if no structured data
  if (!structuredData["@context"]) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
}
