import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Check if SEO tables exist and have data
    const checks = {
      seoTables: false,
      seoSettings: 0,
      defaultSettingsLoaded: false,
      sitemapGenerated: false,
      robotsGenerated: false,
    };

    // Check if SEO settings table exists and has data
    try {
      const settingsCount = await executeQuery(`
        SELECT COUNT(*) as count FROM seo_settings WHERE is_active = 1
      `);
      
      if (Array.isArray(settingsCount) && settingsCount.length > 0) {
        checks.seoTables = true;
        checks.seoSettings = settingsCount[0].count;
        checks.defaultSettingsLoaded = settingsCount[0].count > 10; // Should have at least 10+ default settings
      }
    } catch (error) {
      console.error("Error checking SEO settings:", error);
    }

    // Check if sitemap was generated recently
    try {
      const sitemapCheck = await executeQuery(`
        SELECT COUNT(*) as count FROM seo_analytics 
        WHERE url_path = 'sitemap_generation' 
        AND date = DATE('now')
      `);
      
      if (Array.isArray(sitemapCheck) && sitemapCheck.length > 0) {
        checks.sitemapGenerated = sitemapCheck[0].count > 0;
      }
    } catch (error) {
      console.error("Error checking sitemap status:", error);
    }

    // Check if robots.txt was generated recently
    try {
      const robotsCheck = await executeQuery(`
        SELECT COUNT(*) as count FROM seo_analytics 
        WHERE url_path = 'robots_generation' 
        AND date = DATE('now')
      `);
      
      if (Array.isArray(robotsCheck) && robotsCheck.length > 0) {
        checks.robotsGenerated = robotsCheck[0].count > 0;
      }
    } catch (error) {
      console.error("Error checking robots.txt status:", error);
    }

    // Calculate overall health score
    let healthScore = 0;
    if (checks.seoTables) healthScore += 25;
    if (checks.defaultSettingsLoaded) healthScore += 25;
    if (checks.seoSettings > 20) healthScore += 25; // Good amount of settings
    if (checks.sitemapGenerated) healthScore += 15;
    if (checks.robotsGenerated) healthScore += 10;

    // Get some key settings for display
    let keySettings = {};
    try {
      const settings = await executeQuery(`
        SELECT setting_key, setting_value FROM seo_settings 
        WHERE setting_key IN ('site_name', 'site_url', 'google_analytics_id', 'enable_sitemap') 
        AND is_active = 1
      `);
      
      if (Array.isArray(settings)) {
        settings.forEach((setting: any) => {
          keySettings[setting.setting_key] = setting.setting_value;
        });
      }
    } catch (error) {
      console.error("Error getting key settings:", error);
    }

    // Get recent analytics if available
    let recentActivity = [];
    try {
      const activity = await executeQuery(`
        SELECT url_path, date, page_views FROM seo_analytics 
        WHERE date >= DATE('now', '-7 days')
        ORDER BY date DESC 
        LIMIT 10
      `);
      
      if (Array.isArray(activity)) {
        recentActivity = activity;
      }
    } catch (error) {
      console.error("Error getting recent activity:", error);
    }

    return NextResponse.json({
      success: true,
      data: {
        healthScore,
        checks,
        keySettings,
        recentActivity,
        recommendations: generateRecommendations(checks, keySettings),
      },
    });
  } catch (error) {
    console.error("Failed to get SEO status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get SEO status" },
      { status: 500 }
    );
  }
}

function generateRecommendations(checks: any, keySettings: any): string[] {
  const recommendations = [];

  if (!checks.seoTables) {
    recommendations.push("SEO database tables cần được tạo");
  }

  if (!checks.defaultSettingsLoaded) {
    recommendations.push("Cần load default SEO settings");
  }

  if (!keySettings.site_name || keySettings.site_name === '') {
    recommendations.push("Cần thiết lập Site Name trong SEO settings");
  }

  if (!keySettings.site_url || keySettings.site_url === '') {
    recommendations.push("Cần thiết lập Site URL trong SEO settings");
  }

  if (!keySettings.google_analytics_id || keySettings.google_analytics_id === '') {
    recommendations.push("Khuyến nghị thiết lập Google Analytics ID");
  }

  if (!checks.sitemapGenerated) {
    recommendations.push("Nên tạo sitemap.xml để cải thiện indexing");
  }

  if (!checks.robotsGenerated) {
    recommendations.push("Nên tạo robots.txt để điều khiển crawling");
  }

  if (checks.seoSettings < 15) {
    recommendations.push("Cần thiết lập thêm SEO settings để tối ưu hóa");
  }

  if (recommendations.length === 0) {
    recommendations.push("Hệ thống SEO đang hoạt động tốt! 🎉");
  }

  return recommendations;
}
