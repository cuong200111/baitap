import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

interface HreflangEntry {
  url: string;
  language: string;
  region?: string;
  hreflang: string; // e.g., 'vi-VN', 'en-US', 'x-default'
}

interface InternationalSeoConfig {
  defaultLanguage: string;
  defaultRegion: string;
  supportedLanguages: string[];
  supportedRegions: string[];
  autoGenerateHreflang: boolean;
  useSubdomains: boolean;
  useSubdirectories: boolean;
  canonicalStrategy: 'language-region' | 'language-only' | 'region-only';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'config';

    switch (action) {
      case 'config':
        const config = await getInternationalConfig();
        return NextResponse.json({ success: true, data: config });

      case 'hreflang':
        const url = searchParams.get('url');
        const hreflangs = await generateHreflangs(url);
        return NextResponse.json({ success: true, data: hreflangs });

      case 'sitemap':
        const sitemaps = await generateInternationalSitemaps();
        return NextResponse.json({ success: true, data: sitemaps });

      case 'analysis':
        const analysis = await analyzeInternationalSeo();
        return NextResponse.json({ success: true, data: analysis });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("International SEO operation failed:", error);
    return NextResponse.json(
      { success: false, message: "International SEO operation failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'update_config':
        await updateInternationalConfig(data);
        break;

      case 'generate_hreflang':
        const hreflangs = await generateHreflangsForPage(data.url, data.languages);
        return NextResponse.json({ success: true, data: hreflangs });

      case 'validate_implementation':
        const validation = await validateHreflangImplementation();
        return NextResponse.json({ success: true, data: validation });

      case 'create_language_sitemaps':
        await createLanguageSpecificSitemaps(data.languages);
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "International SEO configuration updated successfully"
    });

  } catch (error) {
    console.error("International SEO update failed:", error);
    return NextResponse.json(
      { success: false, message: "International SEO update failed" },
      { status: 500 }
    );
  }
}

async function getInternationalConfig(): Promise<InternationalSeoConfig> {
  try {
    const settings = await executeQuery(`
      SELECT setting_key, setting_value FROM seo_settings 
      WHERE setting_key LIKE 'international_%' AND is_active = 1
    `);

    const config: InternationalSeoConfig = {
      defaultLanguage: 'vi',
      defaultRegion: 'VN',
      supportedLanguages: ['vi', 'en'],
      supportedRegions: ['VN', 'US'],
      autoGenerateHreflang: true,
      useSubdomains: false,
      useSubdirectories: true,
      canonicalStrategy: 'language-region'
    };

    if (Array.isArray(settings)) {
      settings.forEach((setting: any) => {
        const key = setting.setting_key.replace('international_', '');
        let value = setting.setting_value;

        if (key.includes('supported_') && typeof value === 'string') {
          value = value.split(',').map((v: string) => v.trim());
        } else if (key.includes('auto_') || key.includes('use_')) {
          value = value === '1' || value === 'true';
        }

        (config as any)[key] = value;
      });
    }

    return config;

  } catch (error) {
    console.error("Failed to get international config:", error);
    // Return default config
    return {
      defaultLanguage: 'vi',
      defaultRegion: 'VN', 
      supportedLanguages: ['vi', 'en'],
      supportedRegions: ['VN', 'US'],
      autoGenerateHreflang: true,
      useSubdomains: false,
      useSubdirectories: true,
      canonicalStrategy: 'language-region'
    };
  }
}

async function updateInternationalConfig(config: Partial<InternationalSeoConfig>): Promise<void> {
  try {
    for (const [key, value] of Object.entries(config)) {
      let finalValue = value;
      
      if (Array.isArray(value)) {
        finalValue = value.join(',');
      } else if (typeof value === 'boolean') {
        finalValue = value ? '1' : '0';
      }

      await executeQuery(`
        INSERT OR REPLACE INTO seo_settings (setting_key, setting_value, category, updated_at)
        VALUES (?, ?, 'international', CURRENT_TIMESTAMP)
      `, [`international_${key}`, finalValue]);
    }

  } catch (error) {
    console.error("Failed to update international config:", error);
    throw error;
  }
}

async function generateHreflangs(url?: string): Promise<HreflangEntry[]> {
  try {
    const config = await getInternationalConfig();
    const baseUrl = url || '/';
    
    const hreflangs: HreflangEntry[] = [];

    // Generate hreflang entries for each supported language/region combination
    for (const language of config.supportedLanguages) {
      for (const region of config.supportedRegions) {
        // Skip invalid combinations (e.g., Vietnamese for US)
        if (language === 'vi' && region !== 'VN') continue;
        if (language === 'en' && region === 'VN') continue;

        const hrefLang = `${language}-${region}`;
        let targetUrl = baseUrl;

        if (config.useSubdirectories) {
          targetUrl = `/${language}${baseUrl === '/' ? '' : baseUrl}`;
        } else if (config.useSubdomains) {
          targetUrl = `https://${language}.hacom.vn${baseUrl}`;
        }

        hreflangs.push({
          url: targetUrl,
          language,
          region,
          hreflang: hrefLang
        });
      }
    }

    // Add x-default for the default language
    hreflangs.push({
      url: baseUrl,
      language: config.defaultLanguage,
      region: config.defaultRegion,
      hreflang: 'x-default'
    });

    return hreflangs;

  } catch (error) {
    console.error("Failed to generate hreflangs:", error);
    return [];
  }
}

async function generateHreflangsForPage(url: string, languages: string[]): Promise<string> {
  try {
    const config = await getInternationalConfig();
    let hreflangHTML = '';

    for (const language of languages) {
      const region = language === 'vi' ? 'VN' : 'US';
      const hrefLang = `${language}-${region}`;
      
      let targetUrl = url;
      if (config.useSubdirectories && language !== config.defaultLanguage) {
        targetUrl = `/${language}${url}`;
      }

      hreflangHTML += `<link rel="alternate" hreflang="${hrefLang}" href="https://hacom.vn${targetUrl}" />\n`;
    }

    // Add x-default
    hreflangHTML += `<link rel="alternate" hreflang="x-default" href="https://hacom.vn${url}" />\n`;

    return hreflangHTML;

  } catch (error) {
    console.error("Failed to generate hreflang HTML:", error);
    return '';
  }
}

async function generateInternationalSitemaps(): Promise<any> {
  try {
    const config = await getInternationalConfig();
    const sitemaps: any = {};

    // Get all products and categories
    const products = await executeQuery(`
      SELECT id, slug, updated_at FROM products WHERE status = 'active'
    `);
    const categories = await executeQuery(`
      SELECT id, slug, updated_at FROM categories WHERE is_active = 1
    `);

    for (const language of config.supportedLanguages) {
      const urls: any[] = [];

      // Homepage
      const homepageUrl = config.useSubdirectories && language !== config.defaultLanguage 
        ? `https://hacom.vn/${language}/`
        : 'https://hacom.vn/';
      
      urls.push({
        url: homepageUrl,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '1.0',
        language
      });

      // Products
      if (Array.isArray(products)) {
        products.forEach((product: any) => {
          let productUrl = `/products/${product.id}`;
          if (config.useSubdirectories && language !== config.defaultLanguage) {
            productUrl = `/${language}${productUrl}`;
          }

          urls.push({
            url: `https://hacom.vn${productUrl}`,
            lastmod: product.updated_at ? product.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: '0.7',
            language
          });
        });
      }

      // Categories
      if (Array.isArray(categories)) {
        categories.forEach((category: any) => {
          let categoryUrl = `/category/${category.slug}`;
          if (config.useSubdirectories && language !== config.defaultLanguage) {
            categoryUrl = `/${language}${categoryUrl}`;
          }

          urls.push({
            url: `https://hacom.vn${categoryUrl}`,
            lastmod: category.updated_at ? category.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: '0.8',
            language
          });
        });
      }

      sitemaps[language] = {
        language,
        urlCount: urls.length,
        urls: urls.slice(0, 100), // Limit for demo
        lastGenerated: new Date().toISOString()
      };
    }

    return sitemaps;

  } catch (error) {
    console.error("Failed to generate international sitemaps:", error);
    return {};
  }
}

async function analyzeInternationalSeo(): Promise<any> {
  try {
    const config = await getInternationalConfig();
    
    const analysis = {
      configuration: {
        score: 0,
        issues: [] as string[],
        recommendations: [] as string[]
      },
      implementation: {
        hreflangPresent: false,
        correctImplementation: false,
        missingLanguages: [] as string[],
        duplicateHreflangs: false
      },
      contentLocalization: {
        score: 0,
        translatedPages: 0,
        totalPages: 0,
        missingTranslations: [] as string[]
      },
      technicalIssues: [] as string[],
      opportunities: [] as string[]
    };

    // Analyze configuration
    let configScore = 50; // Base score

    if (config.supportedLanguages.length > 1) {
      configScore += 20;
    } else {
      analysis.configuration.recommendations.push("Add support for multiple languages to expand international reach");
    }

    if (config.autoGenerateHreflang) {
      configScore += 15;
    } else {
      analysis.configuration.issues.push("Automatic hreflang generation is disabled");
    }

    if (config.useSubdirectories || config.useSubdomains) {
      configScore += 15;
    } else {
      analysis.configuration.issues.push("No clear URL structure for international content");
    }

    analysis.configuration.score = Math.min(100, configScore);

    // Analyze implementation (simulated)
    analysis.implementation.hreflangPresent = true; // Assume implemented
    analysis.implementation.correctImplementation = true;
    
    // Content localization analysis
    const productCount = await executeQuery(`SELECT COUNT(*) as count FROM products WHERE status = 'active'`);
    const totalProducts = Array.isArray(productCount) ? productCount[0]?.count || 0 : 0;
    
    analysis.contentLocalization.totalPages = totalProducts + 10; // Products + static pages
    analysis.contentLocalization.translatedPages = Math.floor(totalProducts * 0.6); // Assume 60% translated
    analysis.contentLocalization.score = Math.round((analysis.contentLocalization.translatedPages / analysis.contentLocalization.totalPages) * 100);

    if (analysis.contentLocalization.score < 80) {
      analysis.contentLocalization.missingTranslations.push("Product descriptions need translation");
      analysis.contentLocalization.missingTranslations.push("Category pages need localization");
    }

    // Technical opportunities
    analysis.opportunities.push("Implement structured data for multiple languages");
    analysis.opportunities.push("Add language-specific meta descriptions");
    analysis.opportunities.push("Configure Google Search Console for each language");
    analysis.opportunities.push("Implement language-specific internal linking");

    if (config.supportedLanguages.length === 1) {
      analysis.opportunities.push("Consider expanding to English for international customers");
    }

    return analysis;

  } catch (error) {
    console.error("Failed to analyze international SEO:", error);
    return null;
  }
}

async function validateHreflangImplementation(): Promise<any> {
  try {
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[],
      coverage: {
        totalPages: 0,
        pagesWithHreflang: 0,
        coverage: 0
      }
    };

    // Simulate validation results
    validation.coverage.totalPages = 150;
    validation.coverage.pagesWithHreflang = 120;
    validation.coverage.coverage = Math.round((validation.coverage.pagesWithHreflang / validation.coverage.totalPages) * 100);

    if (validation.coverage.coverage < 100) {
      validation.warnings.push(`${validation.coverage.totalPages - validation.coverage.pagesWithHreflang} pages missing hreflang tags`);
    }

    validation.suggestions.push("Add hreflang tags to all product pages");
    validation.suggestions.push("Ensure bidirectional hreflang relationships");
    validation.suggestions.push("Use x-default for the primary language version");

    return validation;

  } catch (error) {
    console.error("Failed to validate hreflang implementation:", error);
    return null;
  }
}

async function createLanguageSpecificSitemaps(languages: string[]): Promise<void> {
  try {
    // This would generate separate XML sitemaps for each language
    // Implementation would create files like sitemap-vi.xml, sitemap-en.xml, etc.
    
    for (const language of languages) {
      // Store generation record
      await executeQuery(`
        INSERT OR REPLACE INTO seo_analytics (url_path, date, page_views)
        VALUES (?, DATE('now'), 1)
      `, [`sitemap_${language}_generation`]);
    }

  } catch (error) {
    console.error("Failed to create language-specific sitemaps:", error);
    throw error;
  }
}
