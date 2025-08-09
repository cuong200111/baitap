// SEO Service - Load settings from database and apply to metadata
import { Domain } from "@/config";

export interface SeoSettings {
  general: {
    site_name: string;
    site_url: string;
    site_description: string;
    site_keywords: string;
    site_logo: string;
    site_favicon: string;
    default_meta_title_pattern: string;
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
  technical: {
    enable_sitemap: boolean;
    enable_compression: boolean;
    enable_caching: boolean;
    lazy_load_images: boolean;
    sitemap_max_urls: number;
  };
}

export interface PageSeoData {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  structuredData?: any;
}

class SeoService {
  private settings: SeoSettings | null = null;
  private isClient = typeof window !== "undefined";

  // Load SEO settings from API
  async loadSettings(): Promise<SeoSettings> {
    try {
      if (this.settings) {
        return this.settings;
      }

      // Use different URL for server-side vs client-side
      const baseUrl = this.isClient
        ? Domain
        : process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      console.log(`🔍 Loading SEO settings from: ${baseUrl}/api/seo/settings`);

      const response = await fetch(`${baseUrl}/api/seo/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Don't cache on server-side
        cache: this.isClient ? "force-cache" : "no-store",
      });

      if (!response.ok) {
        console.warn(
          `Failed to load SEO settings (${response.status}), using defaults`,
        );
        return this.getDefaultSettings();
      }

      const data = await response.json();

      if (data.success && data.data) {
        this.settings = data.data;
        console.log(
          `✅ SEO settings loaded: ${Object.keys(data.data).join(", ")}`,
        );
        return this.settings;
      }

      console.warn("SEO API returned invalid data, using defaults");
      return this.getDefaultSettings();
    } catch (error) {
      console.error("Error loading SEO settings:", error);
      return this.getDefaultSettings();
    }
  }

  // Get default settings if API fails
  private getDefaultSettings(): SeoSettings {
    return {
      general: {
        site_name: "HACOM - Máy tính, Laptop",
        site_url: "https://hacom.vn",
        site_description:
          "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
        site_keywords:
          "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM",
        site_logo: "/logo.png",
        site_favicon: "/favicon.ico",
        default_meta_title_pattern: "{title} | HACOM",
        auto_generate_meta_description: true,
        meta_description_length: 160,
      },
      social: {
        facebook_app_id: "",
        twitter_site: "@hacom_vn",
        default_og_image: "/og-image.jpg",
      },
      analytics: {
        google_analytics_id: "",
        google_tag_manager_id: "",
        google_search_console_verification: "",
        enable_analytics: true,
      },
      schema: {
        organization_name: "HACOM",
        organization_logo: "/logo.png",
        organization_address: "Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội",
        organization_phone: "1900 1903",
        organization_email: "contact@hacom.vn",
        business_type: "ElectronicsStore",
        enable_organization_schema: true,
        enable_product_schema: true,
      },
      technical: {
        enable_sitemap: true,
        enable_compression: true,
        enable_caching: true,
        lazy_load_images: true,
        sitemap_max_urls: 50000,
      },
    };
  }

  // Generate page-specific SEO data
  async generatePageSeo(options: {
    title?: string;
    description?: string;
    keywords?: string;
    path?: string;
    type?: "page" | "product" | "category";
    image?: string;
    productData?: any;
    categoryData?: any;
  }): Promise<PageSeoData> {
    const settings = await this.loadSettings();
    const {
      title,
      description,
      keywords,
      path = "",
      type = "page",
      image,
      productData,
      categoryData,
    } = options;

    // Generate title based on pattern
    let finalTitle = title || settings.general.site_name;
    if (title && settings.general.default_meta_title_pattern) {
      finalTitle = settings.general.default_meta_title_pattern.replace(
        "{title}",
        title,
      );
    }

    // Generate description
    let finalDescription = description || settings.general.site_description;
    if (settings.general.auto_generate_meta_description && !description) {
      if (type === "product" && productData) {
        finalDescription = this.generateProductDescription(
          productData,
          settings,
        );
      } else if (type === "category" && categoryData) {
        finalDescription = this.generateCategoryDescription(
          categoryData,
          settings,
        );
      }
    }

    // Truncate description if needed
    if (finalDescription.length > settings.general.meta_description_length) {
      finalDescription =
        finalDescription.substring(
          0,
          settings.general.meta_description_length - 3,
        ) + "...";
    }

    // Build canonical URL
    const canonical = `${settings.general.site_url}${path}`;

    // Build image URL
    const finalImage = image || settings.social.default_og_image;
    const fullImageUrl = finalImage.startsWith("http")
      ? finalImage
      : `${settings.general.site_url}${finalImage}`;

    return {
      title: finalTitle,
      description: finalDescription,
      keywords: keywords || settings.general.site_keywords,
      canonical,
      ogTitle: finalTitle,
      ogDescription: finalDescription,
      ogImage: fullImageUrl,
      ogUrl: canonical,
      twitterTitle: finalTitle,
      twitterDescription: finalDescription,
      twitterImage: fullImageUrl,
      structuredData: this.generateStructuredData(
        type,
        { title: finalTitle, description: finalDescription, ...options },
        settings,
      ),
    };
  }

  // Generate product description
  private generateProductDescription(
    product: any,
    settings: SeoSettings,
  ): string {
    const parts = [];

    if (product.name) {
      parts.push(product.name);
    }

    if (product.short_description) {
      parts.push(product.short_description);
    } else if (product.description) {
      const cleanDesc = product.description
        .replace(/<[^>]*>/g, "")
        .substring(0, 100);
      parts.push(cleanDesc);
    }

    if (product.price) {
      const formattedPrice = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(product.price);
      parts.push(`Giá: ${formattedPrice}`);
    }

    parts.push("Bảo hành chính hãng, giao hàng toàn quốc tại HACOM.");

    return parts.join(" - ");
  }

  // Generate category description
  private generateCategoryDescription(
    category: any,
    settings: SeoSettings,
  ): string {
    const parts = [];

    if (category.name) {
      parts.push(`${category.name} chất lượng cao`);
    }

    if (category.description) {
      parts.push(category.description);
    }

    parts.push("Giá tốt nhất, bảo hành chính hãng tại HACOM.");

    return parts.join(" - ");
  }

  // Generate structured data (JSON-LD)
  private generateStructuredData(
    type: string,
    data: any,
    settings: SeoSettings,
  ): any {
    const structuredData: any = {};

    // Organization schema
    if (settings.schema.enable_organization_schema) {
      structuredData.organization = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: settings.schema.organization_name,
        url: settings.general.site_url,
        logo: `${settings.general.site_url}${settings.schema.organization_logo}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hà Nội",
          addressCountry: "VN",
          streetAddress: settings.schema.organization_address,
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: settings.schema.organization_phone,
          contactType: "customer service",
          email: settings.schema.organization_email,
        },
        "@id": `${settings.general.site_url}#organization`,
      };
    }

    // Product schema
    if (
      type === "product" &&
      settings.schema.enable_product_schema &&
      data.productData
    ) {
      const product = data.productData;
      structuredData.product = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || product.short_description,
        sku: product.sku,
        image:
          product.images && product.images.length > 0
            ? product.images[0]
            : settings.social.default_og_image,
        offers: {
          "@type": "Offer",
          price: product.sale_price || product.price,
          priceCurrency: "VND",
          availability:
            product.stock_quantity > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: settings.schema.organization_name,
          },
        },
        brand: {
          "@type": "Brand",
          name: settings.schema.organization_name,
        },
      };
    }

    // Website/WebPage schema
    structuredData.webpage = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: data.title,
      description: data.description,
      url: data.canonical,
      mainEntity: structuredData.product || structuredData.organization,
    };

    return structuredData;
  }

  // Get settings for a specific category
  async getSettings(category?: keyof SeoSettings): Promise<SeoSettings | any> {
    const settings = await this.loadSettings();
    return category ? settings[category] : settings;
  }

  // Clear cached settings
  clearCache(): void {
    this.settings = null;
  }
}

// Export singleton instance
export const seoService = new SeoService();

// Export default for easier imports
export default seoService;

// Helper function for generating category metadata
export async function generateCategoryMetadata(
  categoryName: string,
  categoryDescription?: string,
  categoryImage?: string,
) {
  try {
    const settings = await seoService.loadSettings();

    const title = `${categoryName} | ${settings.general.site_name}`;
    const description =
      categoryDescription ||
      `Khám phá danh mục ${categoryName} tại ${settings.general.site_name}. ${settings.general.site_description}`;

    // Smart Open Graph image selection
    const ogImage = categoryImage ||
                   settings.social.category_og_image ||
                   settings.social.default_og_image;

    const fullImageUrl = ogImage?.startsWith('http')
      ? ogImage
      : `${settings.general.site_url}${ogImage}`;

    return {
      title,
      description,
      keywords: `${categoryName}, ${settings.general.site_keywords}`,
      openGraph: {
        title,
        description,
        images: [{ url: fullImageUrl }],
        type: "website",
        siteName: settings.general.site_name,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [fullImageUrl],
        site: settings.social.twitter_site,
      },
    };
  } catch (error) {
    console.error("Error generating category metadata:", error);

    // Fallback metadata
    return {
      title: `${categoryName} | HACOM`,
      description: `Khám phá danh mục ${categoryName} tại HACOM. Chuyên cung cấp máy tính, laptop, gaming gear chính hãng.`,
      keywords: `${categoryName}, máy tính, laptop, gaming, HACOM`,
    };
  }
}

// Helper function for generating product metadata
export async function generateProductMetadata(
  productName: string,
  productDescription?: string,
  productImage?: string,
  productPrice?: number,
  productSku?: string,
) {
  try {
    const settings = await seoService.loadSettings();

    const title = `${productName} | ${settings.general.site_name}`;
    const description =
      productDescription ||
      `${productName} tại ${settings.general.site_name}. ${settings.general.site_description}`;

    // Smart Open Graph image selection for products
    const ogImage = productImage ||
                   settings.social.product_og_image ||
                   settings.social.default_og_image;

    const fullImageUrl = ogImage?.startsWith('http')
      ? ogImage
      : `${settings.general.site_url}${ogImage}`;

    return {
      title,
      description,
      keywords: `${productName}, ${settings.general.site_keywords}`,
      openGraph: {
        title,
        description,
        images: [{ url: fullImageUrl }],
        type: "product",
        siteName: settings.general.site_name,
        ...(productPrice && {
          product: {
            price: {
              amount: productPrice,
              currency: 'VND'
            }
          }
        })
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [fullImageUrl],
        site: settings.social.twitter_site,
      },
    };
  } catch (error) {
    console.error("Error generating product metadata:", error);

    // Fallback metadata
    return {
      title: `${productName} | HACOM`,
      description: `${productName} tại HACOM. Chuyên cung cấp máy tính, laptop, gaming gear chính hãng.`,
      keywords: `${productName}, máy tính, laptop, gaming, HACOM`,
    };
  }
}
