import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const auditResults = {
      criticalIssues: [],
      warnings: [],
      recommendations: [],
      score: 0,
    };

    // Check meta titles and descriptions
    const seoSettings = await executeQuery(`
      SELECT setting_key, setting_value FROM seo_settings 
      WHERE is_active = 1
    `);

    const settings: any = {};
    if (Array.isArray(seoSettings)) {
      seoSettings.forEach((setting: any) => {
        settings[setting.setting_key] = setting.setting_value;
      });
    }

    let totalChecks = 0;
    let passedChecks = 0;

    // Critical SEO Elements
    totalChecks += 5;

    if (!settings.site_name || settings.site_name.trim() === '') {
      auditResults.criticalIssues.push({
        issue: "Missing Site Name",
        description: "Site name is required for SEO and branding",
        priority: "high",
        fix: "Add site name in SEO settings > General"
      });
    } else {
      passedChecks++;
      if (settings.site_name.length > 60) {
        auditResults.warnings.push({
          issue: "Site Name Too Long",
          description: "Site name should be under 60 characters for optimal display",
          priority: "medium"
        });
      }
    }

    if (!settings.site_description || settings.site_description.trim() === '') {
      auditResults.criticalIssues.push({
        issue: "Missing Site Description",
        description: "Meta description is crucial for search engine snippets",
        priority: "high",
        fix: "Add site description in SEO settings > General"
      });
    } else {
      passedChecks++;
      if (settings.site_description.length > 160) {
        auditResults.warnings.push({
          issue: "Meta Description Too Long",
          description: "Meta description should be under 160 characters",
          priority: "medium"
        });
      }
      if (settings.site_description.length < 120) {
        auditResults.recommendations.push({
          issue: "Short Meta Description",
          description: "Consider expanding meta description to 120-160 characters for better SERP display",
          priority: "low"
        });
      }
    }

    if (!settings.site_url || settings.site_url.trim() === '') {
      auditResults.criticalIssues.push({
        issue: "Missing Site URL",
        description: "Canonical URL is required for proper SEO",
        priority: "high",
        fix: "Add site URL in SEO settings > General"
      });
    } else {
      passedChecks++;
      if (!settings.site_url.startsWith('https://')) {
        auditResults.warnings.push({
          issue: "HTTP instead of HTTPS",
          description: "HTTPS is required for modern SEO and security",
          priority: "high"
        });
      }
    }

    if (!settings.site_keywords || settings.site_keywords.trim() === '') {
      auditResults.warnings.push({
        issue: "Missing Keywords",
        description: "Keywords help search engines understand your content",
        priority: "medium",
        fix: "Add relevant keywords in SEO settings > General"
      });
    } else {
      passedChecks++;
    }

    // Technical SEO
    totalChecks += 4;

    if (settings.enable_sitemap !== '1') {
      auditResults.warnings.push({
        issue: "Sitemap Disabled",
        description: "XML sitemap helps search engines discover your content",
        priority: "medium",
        fix: "Enable sitemap in SEO settings > Technical"
      });
    } else {
      passedChecks++;
    }

    if (settings.enable_compression !== '1') {
      auditResults.recommendations.push({
        issue: "GZIP Compression Disabled",
        description: "Enable compression to improve page load speeds",
        priority: "low",
        fix: "Enable compression in SEO settings > Technical"
      });
    } else {
      passedChecks++;
    }

    if (settings.lazy_load_images !== '1') {
      auditResults.recommendations.push({
        issue: "Lazy Loading Disabled",
        description: "Lazy loading improves Core Web Vitals scores",
        priority: "low",
        fix: "Enable lazy loading in SEO settings > Technical"
      });
    } else {
      passedChecks++;
    }

    if (settings.minify_html !== '1' || settings.minify_css !== '1') {
      auditResults.recommendations.push({
        issue: "Minification Disabled",
        description: "Minifying resources reduces file sizes and improves loading speed",
        priority: "low",
        fix: "Enable minification in SEO settings > Technical"
      });
    } else {
      passedChecks++;
    }

    // Analytics & Tracking
    totalChecks += 2;

    if (!settings.google_analytics_id || settings.google_analytics_id.trim() === '') {
      auditResults.recommendations.push({
        issue: "Missing Google Analytics",
        description: "Analytics tracking is important for measuring SEO performance",
        priority: "medium",
        fix: "Add Google Analytics ID in SEO settings > Analytics"
      });
    } else {
      passedChecks++;
    }

    if (!settings.google_search_console_verification || settings.google_search_console_verification.trim() === '') {
      auditResults.recommendations.push({
        issue: "Missing Search Console Verification",
        description: "Google Search Console provides valuable SEO insights",
        priority: "medium",
        fix: "Add Search Console verification in SEO settings > Analytics"
      });
    } else {
      passedChecks++;
    }

    // Schema.org Structured Data
    totalChecks += 3;

    if (settings.enable_organization_schema !== '1') {
      auditResults.warnings.push({
        issue: "Organization Schema Disabled",
        description: "Organization schema helps search engines understand your business",
        priority: "medium",
        fix: "Enable organization schema in SEO settings > Schema.org"
      });
    } else {
      passedChecks++;
    }

    if (settings.enable_product_schema !== '1') {
      auditResults.warnings.push({
        issue: "Product Schema Disabled",
        description: "Product schema enables rich snippets in search results",
        priority: "medium",
        fix: "Enable product schema in SEO settings > Schema.org"
      });
    } else {
      passedChecks++;
    }

    if (settings.enable_breadcrumb_schema !== '1') {
      auditResults.recommendations.push({
        issue: "Breadcrumb Schema Disabled",
        description: "Breadcrumb schema improves navigation display in search results",
        priority: "low",
        fix: "Enable breadcrumb schema in SEO settings > Schema.org"
      });
    } else {
      passedChecks++;
    }

    // Calculate overall score
    auditResults.score = Math.round((passedChecks / totalChecks) * 100);

    // Store audit results in database
    try {
      await executeQuery(`
        INSERT OR REPLACE INTO seo_audit_issues (url_path, issue_type, severity, issue_description, suggested_fix, is_resolved)
        VALUES ('site_audit', 'general_audit', 'info', ?, ?, 0)
      `, [
        `SEO Audit completed with score: ${auditResults.score}%`,
        `Critical: ${auditResults.criticalIssues.length}, Warnings: ${auditResults.warnings.length}, Recommendations: ${auditResults.recommendations.length}`
      ]);
    } catch (error) {
      console.error("Failed to store audit results:", error);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...auditResults,
        totalChecks,
        passedChecks,
        auditDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to perform SEO audit:", error);
    return NextResponse.json(
      { success: false, message: "Failed to perform SEO audit" },
      { status: 500 }
    );
  }
}
