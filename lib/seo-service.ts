import { Domain } from "@/config";

export interface SeoSettings {
  general: {
    site_name: string;
    site_description: string;
    site_keywords: string;
    site_url: string;
    site_logo: string;
    site_favicon: string;
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
    enable_analytics: boolean;
  };
  schema: {
    organization_name: string;
    organization_logo: string;
    organization_address: string;
    organization_phone: string;
    organization_email: string;
    business_type: string;
    enable_organization_schema: boolean;
    enable_product_schema: boolean;
  };
}

// Cache for SEO settings
let seoSettingsCache: SeoSettings | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getSeoSettings(): Promise<SeoSettings> {
  // Return cached settings if available and not expired
  if (seoSettingsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return seoSettingsCache;
  }

  try {
    const response = await fetch(`${Domain}/api/admin/seo-settings`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        seoSettingsCache = data.data;
        cacheTimestamp = Date.now();
        return data.data;
      }
    }
  } catch (error) {
    console.error("Failed to fetch SEO settings:", error);
  }

  // Return default settings if API fails
  return getDefaultSeoSettings();
}

function getDefaultSeoSettings(): SeoSettings {
  return {
    general: {
      site_name: "HACOM - Máy tính, Laptop, Gaming Gear",
      site_description: "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
      site_keywords: "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM",
      site_url: "https://hacom.vn",
      site_logo: "/logo.png",
      site_favicon: "/favicon.ico",
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
      enable_analytics: true
    },
    schema: {
      organization_name: "HACOM",
      organization_logo: "/logo.png",
      organization_address: "Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội",
      organization_phone: "1900 1903",
      organization_email: "contact@hacom.vn",
      business_type: "ElectronicsStore",
      enable_organization_schema: true,
      enable_product_schema: true
    }
  };
}

export interface PageSeoData {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
  type?: string;
}

export function generateMetadata(pageData: PageSeoData, seoSettings: SeoSettings) {
  const { title, description, keywords, url, image, type = "website" } = pageData;
  const settings = seoSettings.general;
  const social = seoSettings.social;

  // Generate meta title using pattern
  let metaTitle = title;
  if (settings.default_meta_title_pattern && title !== settings.site_name) {
    metaTitle = settings.default_meta_title_pattern
      .replace("{title}", title)
      .replace("{sitename}", settings.site_name);
  }

  // Ensure title length is reasonable
  if (metaTitle.length > 60) {
    metaTitle = metaTitle.substring(0, 57) + "...";
  }

  // Generate meta description
  let metaDescription = description;
  if (metaDescription.length > settings.meta_description_length) {
    metaDescription = metaDescription.substring(0, settings.meta_description_length - 3) + "...";
  }

  // Build full URL
  const fullUrl = url ? `${settings.site_url}${url}` : settings.site_url;
  
  // Use provided image or default OG image
  const ogImage = image || social.default_og_image;
  const fullImageUrl = ogImage?.startsWith('http') ? ogImage : `${settings.site_url}${ogImage}`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords || settings.site_keywords,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: fullUrl,
      siteName: settings.site_name,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
      locale: 'vi_VN',
      type: type,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      site: social.twitter_site,
      images: [fullImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: fullUrl,
    },
    other: {
      // Schema.org structured data
      'application/ld+json': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: metaTitle,
        description: metaDescription,
        url: fullUrl,
        isPartOf: {
          "@type": "WebSite",
          name: settings.site_name,
          url: settings.site_url,
        },
        ...(seoSettings.schema.enable_organization_schema && {
          publisher: {
            "@type": "Organization",
            name: seoSettings.schema.organization_name,
            logo: `${settings.site_url}${seoSettings.schema.organization_logo}`,
            address: seoSettings.schema.organization_address,
            telephone: seoSettings.schema.organization_phone,
            email: seoSettings.schema.organization_email,
          }
        })
      })
    }
  };
}

// Helper functions for specific page types
export async function generatePageMetadata(
  title: string, 
  description: string, 
  url?: string,
  image?: string
) {
  const seoSettings = await getSeoSettings();
  
  return generateMetadata({
    title,
    description,
    url,
    image
  }, seoSettings);
}

export async function generateProductMetadata(
  productName: string,
  productDescription: string,
  category: string,
  price?: number,
  image?: string,
  url?: string
) {
  const seoSettings = await getSeoSettings();
  const settings = seoSettings.general;
  
  // Use product title pattern
  let title = productName;
  if (settings.product_meta_title_pattern) {
    title = settings.product_meta_title_pattern
      .replace("{product_name}", productName)
      .replace("{category}", category)
      .replace("{sitename}", settings.site_name);
  }

  return generateMetadata({
    title,
    description: productDescription,
    url,
    image,
    type: "product"
  }, seoSettings);
}

export async function generateCategoryMetadata(
  categoryName: string,
  categoryDescription: string,
  url?: string,
  image?: string
) {
  const seoSettings = await getSeoSettings();
  const settings = seoSettings.general;
  
  // Use category title pattern
  let title = categoryName;
  if (settings.category_meta_title_pattern) {
    title = settings.category_meta_title_pattern
      .replace("{category_name}", categoryName)
      .replace("{description}", categoryDescription)
      .replace("{sitename}", settings.site_name);
  }

  return generateMetadata({
    title,
    description: categoryDescription,
    url,
    image
  }, seoSettings);
}
