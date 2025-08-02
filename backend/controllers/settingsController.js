import { executeQuery } from "../database/connection.js";

export const settingsController = {
  // Get all site settings
  async getSettings(req, res) {
    try {
      const settings = await executeQuery(`
        SELECT setting_key, setting_value, setting_type 
        FROM site_settings 
        ORDER BY setting_key
      `);

      // Organize settings by category
      const organizedSettings = {
        general: {},
        store: {},
        shipping: {},
        payment: {},
        email: {},
        security: {},
        notifications: {},
      };

      if (Array.isArray(settings)) {
        settings.forEach((setting) => {
          let key = setting.setting_key;
          let value = setting.setting_value;
          let category = "general";

          // Determine category from key prefix
          if (key.startsWith("store_") || key.startsWith("shop_")) {
            category = "store";
          } else if (
            key.startsWith("shipping_") ||
            key.startsWith("delivery_")
          ) {
            category = "shipping";
          } else if (key.startsWith("payment_") || key.startsWith("pay_")) {
            category = "payment";
          } else if (
            key.startsWith("email_") ||
            key.startsWith("smtp_") ||
            key.startsWith("mail_")
          ) {
            category = "email";
          } else if (key.startsWith("security_") || key.startsWith("auth_")) {
            category = "security";
          } else if (
            key.startsWith("notification_") ||
            key.startsWith("alert_")
          ) {
            category = "notifications";
          }

          // Convert string values back to appropriate types
          if (setting.setting_type === "boolean") {
            value = value === "1" || value === "true";
          } else if (setting.setting_type === "number") {
            value = parseFloat(value) || 0;
          } else if (setting.setting_type === "json") {
            try {
              value = JSON.parse(value);
            } catch (e) {
              value = {};
            }
          }

          // Remove category prefix from key
          const cleanKey = key.replace(
            /^(store_|shop_|shipping_|delivery_|payment_|pay_|email_|smtp_|mail_|security_|auth_|notification_|alert_)/,
            "",
          );

          organizedSettings[category][cleanKey] = value;
        });
      }

      // Add default values for missing settings
      const defaultSettings = {
        general: {
          site_name: "HACOM E-commerce",
          site_description:
            "Chuyên cung cấp laptop, PC gaming và linh kiện máy tính",
          contact_email: "info@hacom.vn",
          contact_phone: "1900.1903",
          address: "123 Đường ABC, Quận 1, TP.HCM",
          timezone: "Asia/Ho_Chi_Minh",
          currency: "VND",
          language: "vi",
        },
        store: {
          enabled: true,
          maintenance_mode: false,
          allow_guest_checkout: true,
          require_account_approval: false,
          min_order_amount: 100000,
          max_order_amount: 100000000,
          default_stock_status: "in_stock",
        },
        shipping: {
          free_shipping_threshold: 500000,
          default_shipping_cost: 30000,
          same_day_delivery: true,
          international_shipping: false,
          shipping_zones: ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng"],
        },
        payment: {
          stripe_enabled: false,
          paypal_enabled: false,
          bank_transfer_enabled: true,
          cod_enabled: true,
          vnpay_enabled: true,
        },
        email: {
          smtp_host: "smtp.gmail.com",
          smtp_port: 587,
          smtp_username: "",
          smtp_password: "",
          from_email: "noreply@hacom.vn",
          from_name: "HACOM Store",
          email_notifications: true,
        },
        security: {
          enable_2fa: false,
          password_min_length: 6,
          session_timeout: 30,
          max_login_attempts: 5,
          api_rate_limit: 100,
        },
        notifications: {
          order_notifications: true,
          low_stock_alerts: true,
          user_registration_alerts: true,
          system_maintenance_alerts: true,
        },
      };

      // Merge defaults with database settings
      Object.keys(defaultSettings).forEach((category) => {
        organizedSettings[category] = {
          ...defaultSettings[category],
          ...organizedSettings[category],
        };
      });

      res.json({
        success: true,
        data: organizedSettings,
      });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get settings",
      });
    }
  },

  // Save site settings
  async saveSettings(req, res) {
    try {
      const body = req.body;

      // Flatten the nested settings object
      const flatSettings = [];

      Object.keys(body).forEach((category) => {
        if (body[category] && typeof body[category] === "object") {
          Object.keys(body[category]).forEach((key) => {
            let value = body[category][key];
            let setting_type = "string";

            // Add category prefix to key
            const fullKey = `${category}_${key}`;

            // Determine setting type and convert value
            if (typeof value === "boolean") {
              setting_type = "boolean";
              value = value ? "1" : "0";
            } else if (typeof value === "number") {
              setting_type = "number";
              value = value.toString();
            } else if (
              Array.isArray(value) ||
              (typeof value === "object" && value !== null)
            ) {
              setting_type = "json";
              value = JSON.stringify(value);
            } else if (value === null || value === undefined) {
              value = "";
            }

            flatSettings.push({
              key: fullKey,
              value: value,
              type: setting_type,
            });
          });
        }
      });

      // Update or insert settings
      for (const setting of flatSettings) {
        await executeQuery(
          `INSERT INTO site_settings (setting_key, setting_value, setting_type, updated_at)
           VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             setting_value = VALUES(setting_value),
             setting_type = VALUES(setting_type),
             updated_at = NOW()`,
          [setting.key, setting.value, setting.type],
        );
      }

      res.json({
        success: true,
        message: "Settings saved successfully",
        saved_count: flatSettings.length,
      });
    } catch (error) {
      console.error("Save settings error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save settings",
        error: error.message,
      });
    }
  },

  // Get specific setting by key
  async getSetting(req, res) {
    try {
      const { key } = req.params;

      const setting = await executeQuery(
        `SELECT setting_value, setting_type FROM site_settings WHERE setting_key = ?`,
        [key],
      );

      if (setting.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Setting not found",
        });
      }

      let value = setting[0].setting_value;

      // Convert value based on type
      if (setting[0].setting_type === "boolean") {
        value = value === "1" || value === "true";
      } else if (setting[0].setting_type === "number") {
        value = parseFloat(value) || 0;
      } else if (setting[0].setting_type === "json") {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = {};
        }
      }

      res.json({
        success: true,
        data: {
          key: key,
          value: value,
          type: setting[0].setting_type,
        },
      });
    } catch (error) {
      console.error("Get setting error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get setting",
      });
    }
  },

  // Update specific setting
  async updateSetting(req, res) {
    try {
      const { key } = req.params;
      const { value } = req.body;

      let setting_type = "string";
      let setting_value = value;

      // Determine type and convert value
      if (typeof value === "boolean") {
        setting_type = "boolean";
        setting_value = value ? "1" : "0";
      } else if (typeof value === "number") {
        setting_type = "number";
        setting_value = value.toString();
      } else if (
        Array.isArray(value) ||
        (typeof value === "object" && value !== null)
      ) {
        setting_type = "json";
        setting_value = JSON.stringify(value);
      }

      await executeQuery(
        `INSERT INTO site_settings (setting_key, setting_value, setting_type, updated_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           setting_value = VALUES(setting_value),
           setting_type = VALUES(setting_type),
           updated_at = NOW()`,
        [key, setting_value, setting_type],
      );

      res.json({
        success: true,
        message: "Setting updated successfully",
      });
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update setting",
      });
    }
  },
};
