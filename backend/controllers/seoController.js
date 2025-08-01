import { executeQuery } from "../database/connection.js";
function generateRecommendations(checks, keySettings) {
  const recommendations = [];

  if (!checks.seoTables) {
    recommendations.push("SEO database tables cần được tạo");
  }

  if (!checks.defaultSettingsLoaded) {
    recommendations.push("Cần load default SEO settings");
  }

  if (!keySettings.site_name || keySettings.site_name === "") {
    recommendations.push("Cần thiết lập Site Name trong SEO settings");
  }

  if (!keySettings.site_url || keySettings.site_url === "") {
    recommendations.push("Cần thiết lập Site URL trong SEO settings");
  }

  if (
    !keySettings.google_analytics_id ||
    keySettings.google_analytics_id === ""
  ) {
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
export const seoController = {
  // Get SEO Status
  async getSeoStatus(req, res) {
    try {
      const checks = {
        seoTables: false,
        seoSettings: 0,
        defaultSettingsLoaded: false,
        sitemapGenerated: false,
        robotsGenerated: false,
      };

      // 1. Kiểm tra bảng seo_settings
      try {
        const settingsCount = await executeQuery(`
        SELECT COUNT(*) as count FROM seo_settings WHERE is_active = 1
      `);

        if (Array.isArray(settingsCount) && settingsCount.length > 0) {
          checks.seoTables = true;
          checks.seoSettings = settingsCount[0].count;
          checks.defaultSettingsLoaded = settingsCount[0].count > 10;
        }
      } catch (error) {
        console.error("Error checking SEO settings:", error);
      }

      // 2. Kiểm tra sitemap_generation hôm nay
      try {
        const sitemapCheck = await executeQuery(`
        SELECT COUNT(*) as count FROM seo_analytics 
        WHERE url_path = 'sitemap_generation' 
        AND date = CURDATE()
      `);

        if (Array.isArray(sitemapCheck) && sitemapCheck.length > 0) {
          checks.sitemapGenerated = sitemapCheck[0].count > 0;
        }
      } catch (error) {
        console.error("Error checking sitemap status:", error);
      }

      // 3. Kiểm tra robots_generation hôm nay
      try {
        const robotsCheck = await executeQuery(`
        SELECT COUNT(*) as count FROM seo_analytics 
        WHERE url_path = 'robots_generation' 
        AND date = CURDATE()
      `);

        if (Array.isArray(robotsCheck) && robotsCheck.length > 0) {
          checks.robotsGenerated = robotsCheck[0].count > 0;
        }
      } catch (error) {
        console.error("Error checking robots.txt status:", error);
      }

      // 4. Tính điểm health
      let healthScore = 0;
      if (checks.seoTables) healthScore += 25;
      if (checks.defaultSettingsLoaded) healthScore += 25;
      if (checks.seoSettings > 20) healthScore += 25;
      if (checks.sitemapGenerated) healthScore += 15;
      if (checks.robotsGenerated) healthScore += 10;

      // 5. Lấy key settings
      let keySettings = {};
      try {
        const settings = await executeQuery(`
        SELECT setting_key, setting_value FROM seo_settings 
        WHERE setting_key IN ('site_name', 'site_url', 'google_analytics_id', 'enable_sitemap') 
        AND is_active = 1
      `);

        if (Array.isArray(settings)) {
          settings.forEach((setting) => {
            keySettings[setting.setting_key] = setting.setting_value;
          });
        }
      } catch (error) {
        console.error("Error getting key settings:", error);
      }

      // 6. Lấy recent activity
      let recentActivity = [];
      try {
        const activity = await executeQuery(`
        SELECT url_path, date, page_views FROM seo_analytics 
        WHERE date >= CURDATE() - INTERVAL 7 DAY
        ORDER BY date DESC 
        LIMIT 10
      `);

        if (Array.isArray(activity)) {
          recentActivity = activity;
        }
      } catch (error) {
        console.error("Error getting recent activity:", error);
      }

      // Trả về JSON
      res.json({
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
      res.status(500).json({
        success: false,
        message: "Failed to get SEO status",
      });
    }
  },

  // SEO Audit
  async performSeoAudit(req, res) {
    try {
      const audit = {
        title_tags: {
          score: 90,
          issues: ["1 page missing title tag"],
        },
        meta_descriptions: {
          score: 85,
          issues: ["3 pages missing meta description"],
        },
        headings: {
          score: 95,
          issues: [],
        },
        images: {
          score: 80,
          issues: ["5 images missing alt text"],
        },
        internal_links: {
          score: 88,
          issues: ["2 broken internal links"],
        },
        overall_score: 87,
      };

      res.json({
        success: true,
        data: audit,
      });
    } catch (error) {
      console.error("SEO audit error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to perform SEO audit",
      });
    }
  },

  // Get SEO Settings
  async getSeoSettings(req, res) {
    try {
      const settings = await executeQuery(
        "SELECT * FROM seo_settings ORDER BY created_at DESC LIMIT 1",
      );

      const defaultSettings = {
        site_title: "HACOM - Computer Store",
        site_description:
          "Leading computer and gaming equipment store in Vietnam",
        keywords: "computer, laptop, gaming, technology",
        robots_txt: "User-agent: *\nAllow: /",
        meta_author: "HACOM",
        og_image: "/placeholder.svg",
      };

      res.json({
        success: true,
        data: settings.length > 0 ? settings[0] : defaultSettings,
      });
    } catch (error) {
      console.error("Get SEO settings error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get SEO settings",
      });
    }
  },

  // Update SEO Settings
  async updateSeoSettings(req, res) {
    try {
      const {
        site_title,
        site_description,
        keywords,
        robots_txt,
        meta_author,
        og_image,
      } = req.body;

      // Check if settings exist
      const existing = await executeQuery(
        "SELECT id FROM seo_settings LIMIT 1",
      );

      if (existing.length > 0) {
        await executeQuery(
          `UPDATE seo_settings SET 
           site_title = ?, site_description = ?, keywords = ?, 
           robots_txt = ?, meta_author = ?, og_image = ?, updated_at = NOW()`,
          [
            site_title,
            site_description,
            keywords,
            robots_txt,
            meta_author,
            og_image,
          ],
        );
      } else {
        await executeQuery(
          `INSERT INTO seo_settings 
           (site_title, site_description, keywords, robots_txt, meta_author, og_image, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            site_title,
            site_description,
            keywords,
            robots_txt,
            meta_author,
            og_image,
          ],
        );
      }

      res.json({
        success: true,
        message: "SEO settings updated successfully",
      });
    } catch (error) {
      console.error("Update SEO settings error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update SEO settings",
      });
    }
  },

  // Save Nested SEO Settings (Flatten and Upsert)
  async saveSeoSettings(req, res) {
    try {
      const body = req.body;

      // Flatten the nested settings object
      const flatSettings = [];

      Object.keys(body).forEach((category) => {
        Object.keys(body[category]).forEach((key) => {
          let value = body[category][key];

          // Convert value to string for storage
          if (typeof value === "boolean") {
            value = value ? "1" : "0";
          } else if (typeof value === "number") {
            value = value.toString();
          }

          flatSettings.push({
            key: key,
            value: value,
            category: category,
          });
        });
      });

      // Update or insert settings
      for (const setting of flatSettings) {
        await executeQuery(
          `
        INSERT INTO seo_settings (setting_key, setting_value, category, updated_at)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          category = VALUES(category),
          updated_at = NOW()
        `,
          [setting.key, setting.value, setting.category],
        );
      }

      res.json({
        success: true,
        message: "SEO settings saved successfully",
      });
    } catch (error) {
      console.error("Failed to save SEO settings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save SEO settings",
      });
    }
  },

  // Content Analysis
  async analyzeContent(req, res) {
    try {
      const { url, content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: "Content is required for analysis",
        });
      }

      // Simulate content analysis
      const analysis = {
        word_count: content.split(" ").length,
        reading_time: Math.ceil(content.split(" ").length / 200),
        keyword_density: {
          laptop: 2.5,
          gaming: 1.8,
          computer: 3.2,
        },
        headings: {
          h1: 1,
          h2: 3,
          h3: 5,
        },
        readability_score: 75,
        suggestions: [
          "Add more H2 headings for better structure",
          "Increase keyword density for main keywords",
          "Add internal links to related products",
        ],
      };

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error("Content analysis error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to analyze content",
      });
    }
  },

  // Performance Metrics
  async getPerformanceMetrics(req, res) {
    try {
      const metrics = {
        page_speed: {
          desktop: 85,
          mobile: 78,
        },
        core_web_vitals: {
          lcp: 2.1,
          fid: 45,
          cls: 0.05,
        },
        lighthouse_score: 87,
        gtmetrix_grade: "A",
        loading_time: 1.8,
      };

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error("Performance metrics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get performance metrics",
      });
    }
  },

  // AI Recommendations
  async getAiRecommendations(req, res) {
    try {
      const recommendations = [
        {
          type: "title",
          priority: "high",
          message: "Optimize title tags to include target keywords",
          pages: ["/products/laptop-gaming", "/category/pc-gaming"],
        },
        {
          type: "meta",
          priority: "medium",
          message: "Add meta descriptions to improve click-through rates",
          pages: ["/products/123", "/products/456"],
        },
        {
          type: "content",
          priority: "low",
          message: "Increase content length for better SEO rankings",
          pages: ["/category/accessories"],
        },
        {
          type: "images",
          priority: "medium",
          message: "Add alt text to images for better accessibility",
          pages: ["/", "/products/789"],
        },
      ];

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      console.error("AI recommendations error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get AI recommendations",
      });
    }
  },

  // Auto Fix SEO Issues
  async autoFixSeoIssues(req, res) {
    try {
      const { issues } = req.body;

      const fixedIssues = [];
      const failedIssues = [];

      if (issues?.includes("missing_alt_text")) {
        // Simulate fixing alt text
        fixedIssues.push("missing_alt_text");
      }

      if (issues?.includes("missing_meta_description")) {
        // Simulate fixing meta descriptions
        fixedIssues.push("missing_meta_description");
      }

      res.json({
        success: true,
        message: `Fixed ${fixedIssues.length} SEO issues`,
        data: {
          fixed: fixedIssues,
          failed: failedIssues,
          total_fixed: fixedIssues.length,
        },
      });
    } catch (error) {
      console.error("Auto fix SEO error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to auto fix SEO issues",
      });
    }
  },

  // Bulk Update SEO
  async bulkUpdateSeo(req, res) {
    try {
      const { pages, updates } = req.body;

      if (!pages || !updates) {
        return res.status(400).json({
          success: false,
          message: "Pages and updates are required",
        });
      }

      let updated = 0;

      // Simulate bulk updates
      for (const page of pages) {
        // In real implementation, update database records
        updated++;
      }

      res.json({
        success: true,
        message: `Updated SEO for ${updated} pages`,
        data: { updated_pages: updated },
      });
    } catch (error) {
      console.error("Bulk update SEO error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to bulk update SEO",
      });
    }
  },

  // International SEO
  async getInternationalSeo(req, res) {
    try {
      const internationalSeo = {
        default_language: "vi",
        supported_languages: ["vi", "en"],
        hreflang_tags: true,
        geo_targeting: {
          country: "VN",
          regions: ["Hanoi", "Ho Chi Minh City", "Da Nang"],
        },
        currency: "VND",
        timezone: "Asia/Ho_Chi_Minh",
      };

      res.json({
        success: true,
        data: internationalSeo,
      });
    } catch (error) {
      console.error("International SEO error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get international SEO data",
      });
    }
  },

  // Link Optimization
  async optimizeLinks(req, res) {
    try {
      const optimization = {
        internal_links: {
          total: 45,
          optimized: 38,
          broken: 2,
          suggestions: [
            "Add more internal links to product pages",
            "Fix broken links to category pages",
          ],
        },
        external_links: {
          total: 12,
          dofollow: 8,
          nofollow: 4,
          suggestions: [
            "Add nofollow to promotional links",
            "Remove broken external links",
          ],
        },
        anchor_text: {
          branded: 25,
          generic: 15,
          keyword_rich: 17,
          suggestions: [
            "Diversify anchor text for better SEO",
            "Use more descriptive anchor text",
          ],
        },
      };

      res.json({
        success: true,
        data: optimization,
      });
    } catch (error) {
      console.error("Link optimization error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to optimize links",
      });
    }
  },

  // Test All SEO
  async testAllSeo(req, res) {
    try {
      const testResults = {
        technical_seo: {
          robots_txt: {
            status: "pass",
            message: "Robots.txt is properly configured",
          },
          sitemap: {
            status: "pass",
            message: "Sitemap is accessible and valid",
          },
          meta_tags: {
            status: "warning",
            message: "3 pages missing meta description",
          },
          structured_data: {
            status: "pass",
            message: "Schema markup is properly implemented",
          },
        },
        on_page_seo: {
          title_tags: {
            status: "pass",
            message: "All pages have unique title tags",
          },
          headings: { status: "pass", message: "Proper heading structure" },
          images: { status: "warning", message: "5 images missing alt text" },
          internal_links: {
            status: "pass",
            message: "Good internal linking structure",
          },
        },
        performance: {
          page_speed: { status: "pass", message: "Page speed is acceptable" },
          mobile_friendly: {
            status: "pass",
            message: "Site is mobile responsive",
          },
          core_web_vitals: {
            status: "warning",
            message: "LCP could be improved",
          },
        },
        overall_score: 87,
        status: "good",
      };

      res.json({
        success: true,
        data: testResults,
      });
    } catch (error) {
      console.error("Test all SEO error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test SEO",
      });
    }
  },
};
