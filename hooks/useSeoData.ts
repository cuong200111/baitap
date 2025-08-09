import { useState, useEffect } from 'react';
import { Domain } from '@/config';

export interface AdminSeoSettings {
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
    linkedin_url: string;
    youtube_url: string;
    instagram_url: string;
    tiktok_url: string;
    default_og_image: string;
  };
  analytics: {
    google_analytics_id: string;
    google_tag_manager_id: string;
    google_search_console_verification: string;
    bing_webmaster_verification: string;
    facebook_pixel_id: string;
    hotjar_id: string;
    google_ads_id: string;
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
    latitude: string;
    longitude: string;
    enable_organization_schema: boolean;
    enable_breadcrumb_schema: boolean;
    enable_product_schema: boolean;
    enable_review_schema: boolean;
  };
  technical: {
    enable_compression: boolean;
    enable_caching: boolean;
    lazy_load_images: boolean;
    minify_html: boolean;
    minify_css: boolean;
    minify_js: boolean;
    enable_sitemap: boolean;
    sitemap_include_images: boolean;
    sitemap_include_videos: boolean;
    sitemap_max_urls: number;
    robots_txt_custom: string;
  };
}

export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonicalUrl: string;
  structuredData?: any;
}

export function useSeoData() {
  const [settings, setSettings] = useState<AdminSeoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSeoSettings();
  }, []);

  const loadSeoSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${Domain}/api/seo/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SEO settings');
      console.error('Failed to load SEO settings:', err);
      
      // Set fallback settings
      setSettings({
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
          linkedin_url: '',
          youtube_url: '',
          instagram_url: '',
          tiktok_url: '',
          default_og_image: '/og-image.jpg',
        },
        analytics: {
          google_analytics_id: '',
          google_tag_manager_id: '',
          google_search_console_verification: '',
          bing_webmaster_verification: '',
          facebook_pixel_id: '',
          hotjar_id: '',
          google_ads_id: '',
          enable_analytics: true,
        },
        schema: {
          organization_name: 'HACOM',
          organization_logo: '/logo.png',
          organization_address: 'Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội',
          organization_phone: '1900 1903',
          organization_email: 'contact@hacom.vn',
          business_type: 'ElectronicsStore',
          business_hours: 'Mo-Su 08:00-22:00',
          latitude: '21.0285',
          longitude: '105.8542',
          enable_organization_schema: true,
          enable_breadcrumb_schema: true,
          enable_product_schema: true,
          enable_review_schema: true,
        },
        technical: {
          enable_compression: true,
          enable_caching: true,
          lazy_load_images: true,
          minify_html: true,
          minify_css: true,
          minify_js: true,
          enable_sitemap: true,
          sitemap_include_images: true,
          sitemap_include_videos: true,
          sitemap_max_urls: 50000,
          robots_txt_custom: '',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSeoMetadata = (options: {
    title?: string;
    description?: string;
    keywords?: string;
    path?: string;
    type?: 'page' | 'product' | 'category';
    image?: string;
    productData?: any;
    categoryData?: any;
  }): SeoMetadata => {
    if (!settings) {
      return {
        title: 'HACOM',
        description: 'HACOM - Máy tính, Laptop, Gaming Gear',
        keywords: 'máy tính, laptop, gaming',
        ogTitle: 'HACOM',
        ogDescription: 'HACOM - Máy tính, Laptop, Gaming Gear',
        ogImage: '/og-image.jpg',
        ogUrl: 'https://hacom.vn',
        twitterTitle: 'HACOM',
        twitterDescription: 'HACOM - Máy tính, Laptop, Gaming Gear',
        twitterImage: '/og-image.jpg',
        canonicalUrl: 'https://hacom.vn',
      };
    }

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

    // Generate title based on pattern and type - ensure strings
    let finalTitle = String(title || settings.general.site_name || 'HACOM');
    if (title) {
      const titleStr = String(title);
      if (type === 'product' && settings.general.product_meta_title_pattern) {
        finalTitle = String(settings.general.product_meta_title_pattern)
          .replace('{product_name}', titleStr)
          .replace('{category}', String(productData?.category_name || ''));
      } else if (type === 'category' && settings.general.category_meta_title_pattern) {
        finalTitle = String(settings.general.category_meta_title_pattern)
          .replace('{category_name}', titleStr)
          .replace('{description}', String(categoryData?.description || ''));
      } else if (settings.general.default_meta_title_pattern) {
        finalTitle = String(settings.general.default_meta_title_pattern).replace('{title}', titleStr);
      }
    }

    // Generate description
    let finalDescription = description || settings.general.site_description;
    if (settings.general.auto_generate_meta_description && !description) {
      if (type === 'product' && productData) {
        finalDescription = generateProductDescription(productData, settings);
      } else if (type === 'category' && categoryData) {
        finalDescription = generateCategoryDescription(categoryData, settings);
      }
    }

    // Truncate description if needed
    if (finalDescription.length > settings.general.meta_description_length) {
      finalDescription = finalDescription.substring(0, settings.general.meta_description_length - 3) + '...';
    }

    // Build URLs
    const canonicalUrl = `${settings.general.site_url}${path}`;
    const finalImage = image || settings.social.default_og_image;
    const fullImageUrl = finalImage.startsWith('http') ? finalImage : `${settings.general.site_url}${finalImage}`;

    // Generate structured data
    const structuredData = generateStructuredData(type, {
      title: finalTitle,
      description: finalDescription,
      canonicalUrl,
      productData,
      categoryData,
    }, settings);

    return {
      title: finalTitle,
      description: finalDescription,
      keywords: keywords || settings.general.site_keywords,
      ogTitle: finalTitle,
      ogDescription: finalDescription,
      ogImage: fullImageUrl,
      ogUrl: canonicalUrl,
      twitterTitle: finalTitle,
      twitterDescription: finalDescription,
      twitterImage: fullImageUrl,
      canonicalUrl,
      structuredData,
    };
  };

  const getSiteName = () => {
    return settings?.general?.site_name || 'HACOM';
  };

  const getOrganizationName = () => {
    return settings?.schema?.organization_name || 'HACOM';
  };

  const getContactInfo = () => {
    return {
      phone: settings?.schema?.organization_phone || '1900 1903',
      email: settings?.schema?.organization_email || 'contact@hacom.vn',
      address: settings?.schema?.organization_address || 'Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội',
    };
  };

  return {
    settings,
    loading,
    error,
    reload: loadSeoSettings,
    generateSeoMetadata,
    getSiteName,
    getOrganizationName,
    getContactInfo,
  };
}

// Helper functions
function generateProductDescription(product: any, settings: AdminSeoSettings): string {
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

  parts.push(`Bảo hành chính hãng, giao hàng toàn quốc tại ${settings.schema.organization_name}.`);

  return parts.join(' - ');
}

function generateCategoryDescription(category: any, settings: AdminSeoSettings): string {
  const parts = [];

  if (category.name) {
    parts.push(`${category.name} chất lượng cao`);
  }

  if (category.description) {
    parts.push(category.description);
  }

  parts.push(`Giá tốt nhất, bảo hành chính hãng tại ${settings.schema.organization_name}.`);

  return parts.join(' - ');
}

function generateStructuredData(type: string, data: any, settings: AdminSeoSettings): any {
  const structuredData: any = {};

  // Organization schema
  if (settings.schema.enable_organization_schema) {
    structuredData.organization = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: settings.schema.organization_name,
      url: settings.general.site_url,
      logo: `${settings.general.site_url}${settings.schema.organization_logo}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Hà Nội',
        addressCountry: 'VN',
        streetAddress: settings.schema.organization_address,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: settings.schema.organization_phone,
        contactType: 'customer service',
        email: settings.schema.organization_email,
      },
      '@id': `${settings.general.site_url}#organization`,
    };
  }

  // Product schema
  if (type === 'product' && settings.schema.enable_product_schema && data.productData) {
    const product = data.productData;
    structuredData.product = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || product.short_description,
      sku: product.sku,
      image: product.images && product.images.length > 0 ? product.images[0] : settings.social.default_og_image,
      offers: {
        '@type': 'Offer',
        price: product.sale_price || product.price,
        priceCurrency: 'VND',
        availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: settings.schema.organization_name,
        },
      },
      brand: {
        '@type': 'Brand',
        name: settings.schema.organization_name,
      },
    };
  }

  // Website/WebPage schema
  structuredData.webpage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: data.title,
    description: data.description,
    url: data.canonicalUrl,
    mainEntity: structuredData.product || structuredData.organization,
  };

  return structuredData;
}
