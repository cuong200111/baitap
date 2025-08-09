import type { Metadata } from 'next';
import { Domain } from '@/config';

interface AdminSeoData {
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
    google_search_console_verification: string;
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

// Fetch admin SEO settings
async function fetchAdminSeoSettings(): Promise<AdminSeoData> {
  try {
    const response = await fetch(`${Domain}/api/seo/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data for metadata
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Failed to fetch admin SEO settings:', error);
    
    // Return fallback settings
    return {
      general: {
        site_name: 'HACOM - Máy tính, Laptop, Gaming Gear',
        site_description: 'HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.',
        site_keywords: 'máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM',
        site_url: 'https://hacom.vn',
        site_logo: '/logo.png',
        site_favicon: '/favicon.ico',
        default_meta_title_pattern: '{title} | HACOM',
        product_meta_title_pattern: '{product_name} - {category} | HACOM',
        category_meta_title_pattern: '{category_name} - {description} | HACOM',
        auto_generate_meta_description: true,
        meta_description_length: 160,
      },
      social: {
        facebook_app_id: '',
        twitter_site: '@hacom_vn',
        default_og_image: '/og-image.jpg',
      },
      analytics: {
        google_analytics_id: '',
        google_tag_manager_id: '',
        google_search_console_verification: '',
        enable_analytics: true,
      },
      schema: {
        organization_name: 'HACOM',
        organization_logo: '/logo.png',
        organization_address: 'Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội',
        organization_phone: '1900 1903',
        organization_email: 'contact@hacom.vn',
        business_type: 'ElectronicsStore',
        enable_organization_schema: true,
        enable_product_schema: true,
      },
    };
  }
}

// Generate metadata using admin SEO settings
export async function generateAdminMetadata(options: {
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
  type?: 'page' | 'product' | 'category';
  image?: string;
  productData?: any;
  categoryData?: any;
}): Promise<Metadata> {
  const adminSeoData = await fetchAdminSeoSettings();
  
  const {
    title,
    description,
    keywords,
    path = '',
    type = 'page',
    image,
    productData,
    categoryData,
  } = options;

  // Generate title based on pattern and type - ensure all values are strings
  let finalTitle = String(title || adminSeoData.general.site_name || 'HACOM');
  if (title) {
    const titleStr = String(title);
    if (type === 'product' && adminSeoData.general.product_meta_title_pattern) {
      finalTitle = String(adminSeoData.general.product_meta_title_pattern)
        .replace('{product_name}', titleStr)
        .replace('{category}', String(productData?.category_name || ''));
    } else if (type === 'category' && adminSeoData.general.category_meta_title_pattern) {
      finalTitle = String(adminSeoData.general.category_meta_title_pattern)
        .replace('{category_name}', titleStr)
        .replace('{description}', String(categoryData?.description || ''));
    } else if (adminSeoData.general.default_meta_title_pattern) {
      finalTitle = String(adminSeoData.general.default_meta_title_pattern).replace('{title}', titleStr);
    }
  }

  // Generate description
  let finalDescription = description || adminSeoData.general.site_description;
  if (adminSeoData.general.auto_generate_meta_description && !description) {
    if (type === 'product' && productData) {
      finalDescription = generateProductDescription(productData, adminSeoData);
    } else if (type === 'category' && categoryData) {
      finalDescription = generateCategoryDescription(categoryData, adminSeoData);
    }
  }

  // Truncate description if needed
  if (finalDescription.length > adminSeoData.general.meta_description_length) {
    finalDescription = finalDescription.substring(0, adminSeoData.general.meta_description_length - 3) + '...';
  }

  // Build URLs
  const canonicalUrl = `${adminSeoData.general.site_url}${path}`;
  const finalImage = image || adminSeoData.social.default_og_image;
  const fullImageUrl = finalImage.startsWith('http') ? finalImage : `${adminSeoData.general.site_url}${finalImage}`;

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: keywords || adminSeoData.general.site_keywords,
    authors: [{ name: adminSeoData.schema.organization_name }],
    creator: adminSeoData.schema.organization_name,
    publisher: adminSeoData.schema.organization_name,
    applicationName: adminSeoData.general.site_name,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: canonicalUrl,
      siteName: adminSeoData.general.site_name,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: finalTitle,
        },
      ],
      locale: 'vi_VN',
      type: type === 'product' ? 'website' : 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      site: adminSeoData.social.twitter_site,
      creator: adminSeoData.social.twitter_site,
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
    verification: {
      google: adminSeoData.analytics.google_search_console_verification,
    },
    other: {
      'application-name': adminSeoData.general.site_name,
      'msapplication-TileColor': '#dc2626',
      'theme-color': '#dc2626',
    },
  };
}

// Helper functions
function generateProductDescription(product: any, adminSeoData: AdminSeoData): string {
  const parts = [];

  if (product.name) {
    parts.push(product.name);
  }

  if (product.short_description) {
    parts.push(product.short_description);
  } else if (product.description) {
    const cleanDesc = product.description.replace(/<[^>]*>/g, '').substring(0, 100);
    parts.push(cleanDesc);
  }

  if (product.price) {
    const formattedPrice = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(product.price);
    parts.push(`Giá: ${formattedPrice}`);
  }

  parts.push(`Bảo hành chính hãng, giao hàng toàn quốc tại ${adminSeoData.schema.organization_name}.`);

  return parts.join(' - ');
}

function generateCategoryDescription(category: any, adminSeoData: AdminSeoData): string {
  const parts = [];

  if (category.name) {
    parts.push(`${category.name} chất lượng cao`);
  }

  if (category.description) {
    parts.push(category.description);
  }

  parts.push(`Giá tốt nhất, bảo hành chính hãng tại ${adminSeoData.schema.organization_name}.`);

  return parts.join(' - ');
}

// Export utility function to get site name for use in components
export async function getAdminSiteName(): Promise<string> {
  const adminSeoData = await fetchAdminSeoSettings();
  return adminSeoData.general.site_name;
}

// Export utility function to get organization name
export async function getAdminOrganizationName(): Promise<string> {
  const adminSeoData = await fetchAdminSeoSettings();
  return adminSeoData.schema.organization_name;
}

// Export utility function to get contact info
export async function getAdminContactInfo(): Promise<{
  phone: string;
  email: string;
  address: string;
}> {
  const adminSeoData = await fetchAdminSeoSettings();
  return {
    phone: adminSeoData.schema.organization_phone,
    email: adminSeoData.schema.organization_email,
    address: adminSeoData.schema.organization_address,
  };
}
