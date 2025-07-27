import { executeQuery } from "../database/connection.js";

// Utility functions for SEO operations
export async function checkSeoHealth() {
  const issues = [];
  const recommendations = [];
  let score = 0;
  const totalChecks = 10;

  try {
    // Check 1: Critical SEO settings
    const criticalSettings = await executeQuery(`
      SELECT setting_key, setting_value FROM seo_settings 
      WHERE setting_key IN ('site_name', 'site_url', 'site_description') 
      AND is_active = 1
    `);

    const settings = {};
    if (Array.isArray(criticalSettings)) {
      criticalSettings.forEach(s => {
        settings[s.setting_key] = s.setting_value;
      });
    }

    // Site name check
    if (settings.site_name && settings.site_name.trim()) {
      score++;
      if (settings.site_name.length > 60) {
        recommendations.push("Site name should be under 60 characters for better display");
      }
    } else {
      issues.push("Missing site name - critical for SEO");
    }

    // Site URL check
    if (settings.site_url && settings.site_url.trim()) {
      score++;
      if (!settings.site_url.startsWith('https://')) {
        recommendations.push("Use HTTPS for better SEO and security");
      }
    } else {
      issues.push("Missing site URL - required for canonical URLs");
    }

    // Site description check
    if (settings.site_description && settings.site_description.trim()) {
      score++;
      if (settings.site_description.length > 160) {
        recommendations.push("Meta description should be under 160 characters");
      } else if (settings.site_description.length < 120) {
        recommendations.push("Consider expanding meta description to 120-160 characters");
      }
    } else {
      issues.push("Missing site description - critical for search snippets");
    }

    // Check 2: Technical SEO settings
    const technicalSettings = await executeQuery(`
      SELECT COUNT(*) as count FROM seo_settings 
      WHERE category = 'technical' AND setting_value = '1' AND is_active = 1
    `);

    const techCount = Array.isArray(technicalSettings) ? technicalSettings[0]?.count || 0 : 0;
    if (techCount >= 3) {
      score++;
    } else {
      recommendations.push("Enable more technical SEO optimizations (compression, lazy loading, etc.)");
    }

    // Check 3: Analytics tracking
    const analyticsSettings = await executeQuery(`
      SELECT COUNT(*) as count FROM seo_settings 
      WHERE setting_key IN ('google_analytics_id', 'google_tag_manager_id') 
      AND setting_value != '' AND is_active = 1
    `);

    const analyticsCount = Array.isArray(analyticsSettings) ? analyticsSettings[0]?.count || 0 : 0;
    if (analyticsCount > 0) {
      score++;
    } else {
      recommendations.push("Setup Google Analytics for SEO performance tracking");
    }

    // Check 4: Schema.org structured data
    const schemaSettings = await executeQuery(`
      SELECT COUNT(*) as count FROM seo_settings 
      WHERE (setting_key LIKE '%schema%' OR setting_key LIKE 'organization_%') 
      AND is_active = 1
    `);

    const schemaCount = Array.isArray(schemaSettings) ? schemaSettings[0]?.count || 0 : 0;
    if (schemaCount >= 2) {
      score++;
    } else {
      recommendations.push("Configure Schema.org structured data for rich snippets");
    }

    // Check 5: Content for SEO
    const productCount = await executeQuery(`
      SELECT COUNT(*) as count FROM products WHERE status = 'active'
    `);
    const categoryCount = await executeQuery(`
      SELECT COUNT(*) as count FROM categories WHERE is_active = 1
    `);

    const products = Array.isArray(productCount) ? productCount[0]?.count || 0 : 0;
    const categories = Array.isArray(categoryCount) ? categoryCount[0]?.count || 0 : 0;

    if (products > 0 && categories > 0) {
      score += 2; // Worth 2 points as content is crucial
    } else {
      issues.push("Insufficient content for effective SEO optimization");
    }

    // Additional checks...
    score += 2; // Placeholder for remaining checks

  } catch (error) {
    console.error("Error checking SEO health:", error);
    issues.push("Failed to perform complete SEO health check");
  }

  // Calculate final score percentage
  const finalScore = Math.round((score / totalChecks) * 100);

  // Determine status
  let status;
  if (finalScore >= 90) {
    status = 'excellent';
  } else if (finalScore >= 75) {
    status = 'good';
  } else if (finalScore >= 50) {
    status = 'needs_improvement';
  } else {
    status = 'critical';
  }

  return {
    score: finalScore,
    issues,
    recommendations,
    status
  };
}

export async function generateMetaTags(pageType, entityId) {
  try {
    // Get meta patterns from settings
    const patterns = await executeQuery(`
      SELECT setting_key, setting_value FROM seo_settings 
      WHERE setting_key LIKE '%meta_%pattern%' AND is_active = 1
    `);

    const metaPatterns = {};
    if (Array.isArray(patterns)) {
      patterns.forEach(p => {
        metaPatterns[p.setting_key] = p.setting_value;
      });
    }

    // Get base site info
    const siteInfo = await executeQuery(`
      SELECT setting_key, setting_value FROM seo_settings 
      WHERE setting_key IN ('site_name', 'site_description', 'site_url') 
      AND is_active = 1
    `);

    const site = {};
    if (Array.isArray(siteInfo)) {
      siteInfo.forEach(s => {
        site[s.setting_key] = s.setting_value;
      });
    }

    let metaTags = {
      title: site.site_name || "ZOXVN",
      description: site.site_description || "",
      keywords: "",
      canonical: site.site_url || "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      twitterTitle: "",
      twitterDescription: "",
    };

    // Generate page-specific meta tags
    switch (pageType) {
      case 'product':
        if (entityId) {
          const product = await executeQuery(`
            SELECT name, short_description, images FROM products WHERE id = ?
          `, [entityId]);

          if (Array.isArray(product) && product.length > 0) {
            const p = product[0];
            metaTags.title = metaPatterns.product_meta_title_pattern
              ? metaPatterns.product_meta_title_pattern.replace('{product_name}', p.name).replace('{category}', 'Sản phẩm')
              : `${p.name} | ZOXVN`;
            metaTags.description = p.short_description || p.name;
            
            if (p.images) {
              try {
                const images = JSON.parse(p.images);
                if (Array.isArray(images) && images.length > 0) {
                  metaTags.ogImage = images[0];
                }
              } catch (e) {
                // Invalid JSON
              }
            }
          }
        }
        break;

      case 'category':
        if (entityId) {
          const category = await executeQuery(`
            SELECT name, description FROM categories WHERE id = ?
          `, [entityId]);

          if (Array.isArray(category) && category.length > 0) {
            const c = category[0];
            metaTags.title = metaPatterns.category_meta_title_pattern
              ? metaPatterns.category_meta_title_pattern.replace('{category_name}', c.name).replace('{description}', c.description || '')
              : `${c.name} | ZOXVN`;
            metaTags.description = c.description || `Khám phá ${c.name} tại ZOXVN`;
          }
        }
        break;

      case 'homepage':
        metaTags.title = site.site_name;
        metaTags.description = site.site_description;
        break;

      default:
        // Use default pattern
        if (metaPatterns.default_meta_title_pattern) {
          metaTags.title = metaPatterns.default_meta_title_pattern.replace('{title}', pageType);
        }
    }

    // Set Open Graph and Twitter Card data
    metaTags.ogTitle = metaTags.title;
    metaTags.ogDescription = metaTags.description;
    metaTags.twitterTitle = metaTags.title;
    metaTags.twitterDescription = metaTags.description;

    return metaTags;

  } catch (error) {
    console.error("Error generating meta tags:", error);
    return {
      title: "ZOXVN - Máy tính, Laptop, Gaming Gear",
      description: "ZOXVN - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất.",
      keywords: "",
      canonical: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      twitterTitle: "",
      twitterDescription: "",
    };
  }
}

export function generateSchemaOrg(type, data) {
  try {
    let schema = {
      "@context": "https://schema.org",
    };

    switch (type) {
      case 'Organization':
        schema["@type"] = "Organization";
        schema.name = data.name || "ZOXVN";
        schema.url = data.url || "https://zoxvn.com";
        schema.logo = data.logo || "/logo.png";
        if (data.address) schema.address = data.address;
        if (data.telephone) schema.telephone = data.telephone;
        if (data.email) schema.email = data.email;
        break;

      case 'Product':
        schema["@type"] = "Product";
        schema.name = data.name;
        schema.description = data.description;
        schema.sku = data.sku;
        if (data.price) {
          schema.offers = {
            "@type": "Offer",
            price: data.price,
            priceCurrency: "VND",
            availability: "https://schema.org/InStock"
          };
        }
        if (data.images) {
          schema.image = Array.isArray(data.images) ? data.images : [data.images];
        }
        if (data.rating) {
          schema.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: data.rating,
            reviewCount: data.reviewCount || 1
          };
        }
        break;

      case 'WebSite':
        schema["@type"] = "WebSite";
        schema.name = data.name || "ZOXVN";
        schema.url = data.url || "https://zoxvn.com";
        if (data.searchUrl) {
          schema.potentialAction = {
            "@type": "SearchAction",
            target: data.searchUrl + "{search_term_string}",
            "query-input": "required name=search_term_string"
          };
        }
        break;

      default:
        return "";
    }

    return JSON.stringify(schema);
  } catch (error) {
    console.error("Error generating Schema.org:", error);
    return "";
  }
}
