import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Get all SEO settings
    const settings = await executeQuery(`
      SELECT setting_key, setting_value, setting_type, category, description
      FROM seo_settings 
      WHERE is_active = 1
      ORDER BY category, setting_key
    `);

    // Group settings by category
    const groupedSettings: any = {};

    if (Array.isArray(settings)) {
      settings.forEach((setting: any) => {
        if (!groupedSettings[setting.category]) {
          groupedSettings[setting.category] = {};
        }

        // Convert value based on type
        let value = setting.setting_value;
        if (setting.setting_type === "boolean") {
          value =
            setting.setting_value === "1" || setting.setting_value === "true";
        } else if (setting.setting_type === "number") {
          value = parseFloat(setting.setting_value) || 0;
        }

        groupedSettings[setting.category][setting.setting_key] = value;
      });
    }

    return NextResponse.json({
      success: true,
      data: groupedSettings,
    });
  } catch (error) {
    console.error("Failed to get SEO settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get SEO settings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Flatten the nested settings object
    const flatSettings: any[] = [];

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
        INSERT OR REPLACE INTO seo_settings (setting_key, setting_value, category, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `,
        [setting.key, setting.value, setting.category],
      );
    }

    return NextResponse.json({
      success: true,
      message: "SEO settings saved successfully",
    });
  } catch (error) {
    console.error("Failed to save SEO settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save SEO settings" },
      { status: 500 },
    );
  }
}
