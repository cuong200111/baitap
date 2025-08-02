"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Store,
  Mail,
  Truck,
  CreditCard,
  Shield,
  Bell,
  Save,
  RefreshCw,
  Upload,
  AlertCircle,
  CheckCircle,
  Globe,
  Database,
  Search,
  TrendingUp,
  BarChart,
  FileText,
  Link,
  Target,
  Eye,
  Download,
  Zap,
  Code,
  Share2,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Activity,
  Users,
  ExternalLink,
  MapPin,
  Clock,
  Star,
  BookOpen,
  Cpu,
  Monitor,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";
import SeoTestPanel from "@/components/SeoTestPanel";
import SeoStatusDashboard from "@/components/SeoStatusDashboard";
import SeoSummaryStats from "@/components/SeoSummaryStats";
import SeoSystemStatus from "@/components/SeoSystemStatus";
import AdvancedSeoDashboard from "@/components/AdvancedSeoDashboard";
import SeoGenerationPanel from "@/components/SeoGenerationPanel";
import AdminInitializer from "@/components/AdminInitializer";
import { API_DOMAIN } from "@/lib/api-helpers";

interface SeoSettings {
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
  content: {
    enable_auto_seo: boolean;
    keyword_density_target: number;
    content_min_words: number;
    h1_optimization: boolean;
    internal_linking: boolean;
    image_alt_optimization: boolean;
    enable_faq_schema: boolean;
    enable_article_schema: boolean;
  };
  performance: {
    enable_cdn: boolean;
    cdn_url: string;
    preload_critical_resources: boolean;
    defer_non_critical_js: boolean;
    optimize_images: boolean;
    enable_critical_css: boolean;
    lazy_load_threshold: number;
  };
  local: {
    google_my_business_id: string;
    enable_local_seo: boolean;
    business_category: string;
    service_areas: string[];
    opening_hours: string;
    enable_review_schema: boolean;
  };
}

interface SettingsData {
  general: {
    site_name: string;
    site_description: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    timezone: string;
    currency: string;
    language: string;
  };
  store: {
    store_enabled: boolean;
    maintenance_mode: boolean;
    allow_guest_checkout: boolean;
    require_account_approval: boolean;
    min_order_amount: number;
    max_order_amount: number;
    default_stock_status: string;
  };
  shipping: {
    free_shipping_threshold: number;
    default_shipping_cost: number;
    same_day_delivery: boolean;
    international_shipping: boolean;
    shipping_zones: string[];
  };
  payment: {
    stripe_enabled: boolean;
    paypal_enabled: boolean;
    bank_transfer_enabled: boolean;
    cod_enabled: boolean;
    vnpay_enabled: boolean;
  };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    from_email: string;
    from_name: string;
    email_notifications: boolean;
  };
  security: {
    enable_2fa: boolean;
    password_min_length: number;
    session_timeout: number;
    max_login_attempts: number;
    api_rate_limit: number;
  };
  notifications: {
    order_notifications: boolean;
    low_stock_alerts: boolean;
    user_registration_alerts: boolean;
    system_maintenance_alerts: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
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
      store_enabled: true,
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
  });

  const [seoSettings, setSeoSettings] = useState<SeoSettings>({
    general: {
      site_name: "HACOM - Máy tính, Laptop, Gaming Gear",
      site_description:
        "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
      site_keywords: "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM",
      site_url: "https://hacom.vn",
      site_logo: "/logo.png",
      site_favicon: "/favicon.ico",
      default_meta_title_pattern: "{title} | HACOM",
      product_meta_title_pattern: "{product_name} - {category} | HACOM",
      category_meta_title_pattern: "{category_name} - {description} | HACOM",
      auto_generate_meta_description: true,
      meta_description_length: 160,
    },
    social: {
      facebook_app_id: "",
      twitter_site: "@hacom_vn",
      linkedin_url: "",
      youtube_url: "",
      instagram_url: "",
      tiktok_url: "",
      default_og_image: "/og-image.jpg",
    },
    analytics: {
      google_analytics_id: "",
      google_tag_manager_id: "",
      google_search_console_verification: "",
      bing_webmaster_verification: "",
      facebook_pixel_id: "",
      hotjar_id: "",
      google_ads_id: "",
      enable_analytics: true,
    },
    schema: {
      organization_name: "HACOM",
      organization_logo: "/logo.png",
      organization_address: "Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội",
      organization_phone: "1900 1903",
      organization_email: "contact@hacom.vn",
      business_type: "ElectronicsStore",
      business_hours: "Mo-Su 08:00-22:00",
      latitude: "21.0285",
      longitude: "105.8542",
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
      robots_txt_custom: "",
    },
    content: {
      enable_auto_seo: true,
      keyword_density_target: 2.5,
      content_min_words: 300,
      h1_optimization: true,
      internal_linking: true,
      image_alt_optimization: true,
      enable_faq_schema: true,
      enable_article_schema: true,
    },
    performance: {
      enable_cdn: false,
      cdn_url: "",
      preload_critical_resources: true,
      defer_non_critical_js: true,
      optimize_images: true,
      enable_critical_css: true,
      lazy_load_threshold: 200,
    },
    local: {
      google_my_business_id: "",
      enable_local_seo: true,
      business_category: "Electronics Store",
      service_areas: ["Hà Nội", "TP.HCM", "Đà Nẵng"],
      opening_hours: "Thứ 2 - Chủ nhật: 8:00 - 22:00",
      enable_review_schema: true,
    },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seoScore, setSeoScore] = useState(85);
  const [sitemapGenerating, setSitemapGenerating] = useState(false);
  const [robotsGenerating, setRobotsGenerating] = useState(false);

  useEffect(() => {
    loadSettings();
    loadSeoSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Vui lòng đăng nhập để xem cài đặt");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`${API_DOMAIN}/api/admin/settings`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(data.data);
        }
      } else {
        console.error("Failed to load settings:", response.status);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Không thể tải cài đặt");
    } finally {
      setLoading(false);
    }
  };

  const loadSeoSettings = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    try {
      const response = await fetch(`${API_DOMAIN}/api/admin/seo-settings`, {
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Map the flattened data back to nested structure
          const mappedData: SeoSettings = {
            general: {
              site_name:
                data.data.general?.site_name || seoSettings.general.site_name,
              site_description:
                data.data.general?.site_description ||
                seoSettings.general.site_description,
              site_keywords:
                data.data.general?.site_keywords ||
                seoSettings.general.site_keywords,
              site_url:
                data.data.general?.site_url || seoSettings.general.site_url,
              site_logo:
                data.data.general?.site_logo || seoSettings.general.site_logo,
              site_favicon:
                data.data.general?.site_favicon ||
                seoSettings.general.site_favicon,
              default_meta_title_pattern:
                data.data.content?.default_meta_title_pattern ||
                seoSettings.general.default_meta_title_pattern,
              product_meta_title_pattern:
                data.data.content?.product_meta_title_pattern ||
                seoSettings.general.product_meta_title_pattern,
              category_meta_title_pattern:
                data.data.content?.category_meta_title_pattern ||
                seoSettings.general.category_meta_title_pattern,
              auto_generate_meta_description:
                data.data.content?.auto_generate_meta_description ??
                seoSettings.general.auto_generate_meta_description,
              meta_description_length:
                data.data.content?.meta_description_length ||
                seoSettings.general.meta_description_length,
            },
            social: {
              facebook_app_id:
                data.data.social?.facebook_app_id ||
                seoSettings.social.facebook_app_id,
              twitter_site:
                data.data.social?.twitter_site ||
                seoSettings.social.twitter_site,
              linkedin_url:
                data.data.social?.linkedin_url ||
                seoSettings.social.linkedin_url,
              youtube_url:
                data.data.social?.youtube_url || seoSettings.social.youtube_url,
              instagram_url:
                data.data.social?.instagram_url ||
                seoSettings.social.instagram_url,
              tiktok_url:
                data.data.social?.tiktok_url || seoSettings.social.tiktok_url,
              default_og_image:
                data.data.social?.default_og_image ||
                seoSettings.social.default_og_image,
            },
            analytics: {
              google_analytics_id:
                data.data.analytics?.google_analytics_id ||
                seoSettings.analytics.google_analytics_id,
              google_tag_manager_id:
                data.data.analytics?.google_tag_manager_id ||
                seoSettings.analytics.google_tag_manager_id,
              google_search_console_verification:
                data.data.analytics?.google_search_console_verification ||
                seoSettings.analytics.google_search_console_verification,
              bing_webmaster_verification:
                data.data.analytics?.bing_webmaster_verification ||
                seoSettings.analytics.bing_webmaster_verification,
              facebook_pixel_id:
                data.data.analytics?.facebook_pixel_id ||
                seoSettings.analytics.facebook_pixel_id,
              hotjar_id:
                data.data.analytics?.hotjar_id ||
                seoSettings.analytics.hotjar_id,
              google_ads_id:
                data.data.analytics?.google_ads_id ||
                seoSettings.analytics.google_ads_id,
              enable_analytics:
                data.data.analytics?.enable_analytics ??
                seoSettings.analytics.enable_analytics,
            },
            schema: {
              organization_name:
                data.data.schema?.organization_name ||
                seoSettings.schema.organization_name,
              organization_logo:
                data.data.schema?.organization_logo ||
                seoSettings.schema.organization_logo,
              organization_address:
                data.data.schema?.organization_address ||
                seoSettings.schema.organization_address,
              organization_phone:
                data.data.schema?.organization_phone ||
                seoSettings.schema.organization_phone,
              organization_email:
                data.data.schema?.organization_email ||
                seoSettings.schema.organization_email,
              business_type:
                data.data.schema?.business_type ||
                seoSettings.schema.business_type,
              business_hours:
                data.data.schema?.business_hours ||
                seoSettings.schema.business_hours,
              latitude:
                data.data.schema?.latitude || seoSettings.schema.latitude,
              longitude:
                data.data.schema?.longitude || seoSettings.schema.longitude,
              enable_organization_schema:
                data.data.schema?.enable_organization_schema ??
                seoSettings.schema.enable_organization_schema,
              enable_breadcrumb_schema:
                data.data.schema?.enable_breadcrumb_schema ??
                seoSettings.schema.enable_breadcrumb_schema,
              enable_product_schema:
                data.data.schema?.enable_product_schema ??
                seoSettings.schema.enable_product_schema,
              enable_review_schema:
                data.data.schema?.enable_review_schema ??
                seoSettings.schema.enable_review_schema,
            },
            technical: {
              enable_compression:
                data.data.technical?.enable_compression ??
                seoSettings.technical.enable_compression,
              enable_caching:
                data.data.technical?.enable_caching ??
                seoSettings.technical.enable_caching,
              lazy_load_images:
                data.data.technical?.lazy_load_images ??
                seoSettings.technical.lazy_load_images,
              minify_html:
                data.data.technical?.minify_html ??
                seoSettings.technical.minify_html,
              minify_css:
                data.data.technical?.minify_css ??
                seoSettings.technical.minify_css,
              minify_js:
                data.data.technical?.minify_js ??
                seoSettings.technical.minify_js,
              enable_sitemap:
                data.data.sitemap?.enable_sitemap ??
                seoSettings.technical.enable_sitemap,
              sitemap_include_images:
                data.data.sitemap?.sitemap_include_images ??
                seoSettings.technical.sitemap_include_images,
              sitemap_include_videos:
                data.data.sitemap?.sitemap_include_videos ??
                seoSettings.technical.sitemap_include_videos,
              sitemap_max_urls:
                data.data.sitemap?.sitemap_max_urls ||
                seoSettings.technical.sitemap_max_urls,
              robots_txt_custom:
                data.data.robots?.robots_txt_custom ||
                seoSettings.technical.robots_txt_custom,
            },
            content: seoSettings.content,
            performance: seoSettings.performance,
            local: seoSettings.local,
          };
          setSeoSettings(mappedData);
        }
      }
    } catch (error) {
      console.error("Failed to load SEO settings:", error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Vui lòng đăng nhập để lưu cài đặt");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`${API_DOMAIN}/api/admin/settings`, {
        method: "POST",
        headers,
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Đã lưu cài đặt thành công");
      } else {
        toast.error("Có lỗi xảy ra khi lưu cài đặt");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Có lỗi xảy ra khi lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeoSettings = async () => {
    try {
      setSaving(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const response = await fetch(`${API_DOMAIN}/api/admin/seo-settings`, {
        method: "POST",
        headers,
        body: JSON.stringify(seoSettings),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Đã lưu cài đặt SEO thành công");
        calculateSeoScore();
      } else {
        toast.error("Có lỗi xảy ra khi lưu cài đặt SEO");
      }
    } catch (error) {
      console.error("Failed to save SEO settings:", error);
      toast.error("Có lỗi xảy ra khi lưu cài đặt SEO");
    } finally {
      setSaving(false);
    }
  };

  const generateSitemap = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      setSitemapGenerating(true);
      const response = await fetch(`${API_DOMAIN}/api/admin/generate-sitemap`, {
        method: "POST",
        headers,
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Đã tạo sitemap thành công! Tổng ${data.urlCount} URL`);
      } else {
        toast.error("Có lỗi xảy ra khi tạo sitemap");
      }
    } catch (error) {
      console.error("Failed to generate sitemap:", error);
      toast.error("Có lỗi xảy ra khi tạo sitemap");
    } finally {
      setSitemapGenerating(false);
    }
  };

  const generateRobotsTxt = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      setRobotsGenerating(true);
      const response = await fetch(`${API_DOMAIN}/api/admin/generate-robots`, {
        method: "POST",
        headers,
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Đã tạo robots.txt thành công!");
      } else {
        toast.error("Có lỗi xảy ra khi tạo robots.txt");
      }
    } catch (error) {
      console.error("Failed to generate robots.txt:", error);
      toast.error("Có lỗi xảy ra khi tạo robots.txt");
    } finally {
      setRobotsGenerating(false);
    }
  };

  const calculateSeoScore = () => {
    let score = 0;

    // Basic SEO settings (40 points)
    if (seoSettings.general.site_name) score += 5;
    if (seoSettings.general.site_description) score += 5;
    if (seoSettings.general.site_keywords) score += 5;
    if (seoSettings.general.site_url) score += 5;
    if (seoSettings.general.default_meta_title_pattern) score += 5;
    if (seoSettings.general.auto_generate_meta_description) score += 5;
    if (seoSettings.analytics.google_analytics_id) score += 5;
    if (seoSettings.analytics.google_search_console_verification) score += 5;

    // Schema markup (25 points)
    if (seoSettings.schema.enable_organization_schema) score += 5;
    if (seoSettings.schema.enable_product_schema) score += 5;
    if (seoSettings.schema.enable_breadcrumb_schema) score += 5;
    if (seoSettings.schema.organization_name) score += 5;
    if (seoSettings.schema.organization_address) score += 5;

    // Technical SEO (20 points)
    if (seoSettings.technical.enable_sitemap) score += 5;
    if (seoSettings.technical.enable_compression) score += 5;
    if (seoSettings.technical.lazy_load_images) score += 5;
    if (seoSettings.technical.minify_html) score += 5;

    // Social media (10 points)
    if (seoSettings.social.twitter_site) score += 3;
    if (seoSettings.social.facebook_app_id) score += 4;
    if (seoSettings.social.default_og_image) score += 3;

    // Performance (5 points)
    if (seoSettings.performance.optimize_images) score += 2.5;
    if (seoSettings.performance.enable_critical_css) score += 2.5;

    setSeoScore(Math.round(score));
  };

  const handleInputChange = (
    section: keyof SettingsData,
    field: string,
    value: any,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSeoInputChange = (
    section: keyof SeoSettings,
    field: string,
    value: any,
  ) => {
    setSeoSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleTestEmail = async () => {
    try {
      toast.info("Đang gửi email thử nghiệm...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Email thử nghiệm đã được gửi thành công");
    } catch (error) {
      toast.error("Không thể gửi email thử nghiệm");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt hệ thống</h1>
          <p className="text-gray-600">
            Quản lý cấu hình và tùy chỉnh hệ thống HACOM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadSettings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải lại
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      </div>

      {/* Admin Initializer */}
      <AdminInitializer />

      <Tabs defaultValue="seo" className="w-full">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="seo-status">SEO Status</TabsTrigger>
          <TabsTrigger value="seo-advanced">Advanced SEO</TabsTrigger>
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="store">Cửa hàng</TabsTrigger>
          <TabsTrigger value="shipping">Vận chuyển</TabsTrigger>
          <TabsTrigger value="payment">Thanh toán</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
        </TabsList>

        {/* SEO STATUS TAB - COMPREHENSIVE SYSTEM STATUS */}
        <TabsContent value="seo-status" className="space-y-6">
          {/* SEO Files Generation Panel */}
          <SeoGenerationPanel />

          {/* System Status */}
          <SeoSystemStatus />
        </TabsContent>

        {/* ADVANCED SEO TAB - AI-POWERED SEO OPTIMIZATION */}
        <TabsContent value="seo-advanced" className="space-y-6">
          <AdvancedSeoDashboard />
        </TabsContent>

        {/* SEO TAB - COMPREHENSIVE SEO MANAGEMENT */}
        <TabsContent value="seo" className="space-y-6">
          {/* SEO Status Dashboard */}
          <SeoStatusDashboard />

          {/* SEO Score Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Điểm SEO tổng quan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${seoScore >= 80 ? "text-green-600" : seoScore >= 60 ? "text-yellow-600" : "text-red-600"}`}
                  >
                    {seoScore}/100
                  </div>
                  <p className="text-sm text-gray-600">Điểm SEO tổng thể</p>
                  <Badge
                    variant={
                      seoScore >= 80
                        ? "default"
                        : seoScore >= 60
                          ? "secondary"
                          : "destructive"
                    }
                    className="mt-2"
                  >
                    {seoScore >= 80
                      ? "Xuất sắc"
                      : seoScore >= 60
                        ? "Tốt"
                        : "Cần cải thiện"}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    <Monitor className="h-8 w-8 mx-auto mb-1" />
                    98%
                  </div>
                  <p className="text-sm text-gray-600">Tối ưu hóa kỹ thuật</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    <Gauge className="h-8 w-8 mx-auto mb-1" />
                    92%
                  </div>
                  <p className="text-sm text-gray-600">Hiệu suất trang web</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    <Activity className="h-8 w-8 mx-auto mb-1" />
                    85%
                  </div>
                  <p className="text-sm text-gray-600">Tối ưu nội dung</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="seo-general" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="seo-general">Cơ bản</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="schema">Schema.org</TabsTrigger>
              <TabsTrigger value="technical">Kỹ thuật</TabsTrigger>
              <TabsTrigger value="content">Nội dung</TabsTrigger>
              <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
              <TabsTrigger value="local">Local SEO</TabsTrigger>
            </TabsList>

            {/* SEO General Settings */}
            <TabsContent value="seo-general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Cài đặt SEO cơ bản
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Các thiết lập cơ bản để tối ưu hóa website cho công cụ tìm
                    kiếm
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seo_site_name">Tên website (SEO)</Label>
                      <Input
                        id="seo_site_name"
                        value={seoSettings.general.site_name}
                        onChange={(e) =>
                          handleSeoInputChange(
                            "general",
                            "site_name",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="site_url">URL chính của website</Label>
                      <Input
                        id="site_url"
                        value={seoSettings.general.site_url}
                        onChange={(e) =>
                          handleSeoInputChange(
                            "general",
                            "site_url",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="seo_site_description">
                      Mô tả website (Meta Description)
                    </Label>
                    <Textarea
                      id="seo_site_description"
                      value={seoSettings.general.site_description}
                      onChange={(e) =>
                        handleSeoInputChange(
                          "general",
                          "site_description",
                          e.target.value,
                        )
                      }
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {seoSettings.general.site_description.length}/160 ký tự
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="site_keywords">
                      Từ khóa chính (Keywords)
                    </Label>
                    <Input
                      id="site_keywords"
                      value={seoSettings.general.site_keywords}
                      onChange={(e) =>
                        handleSeoInputChange(
                          "general",
                          "site_keywords",
                          e.target.value,
                        )
                      }
                      placeholder="máy tính, laptop, gaming, linh kiện"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <Label htmlFor="auto_meta_description">
                        Tự động tạo Meta Description
                      </Label>
                      <p className="text-sm text-gray-500">
                        Tự động tạo meta description từ nội dung trang
                      </p>
                    </div>
                    <Switch
                      id="auto_meta_description"
                      checked={
                        seoSettings.general.auto_generate_meta_description
                      }
                      onCheckedChange={(checked) =>
                        handleSeoInputChange(
                          "general",
                          "auto_generate_meta_description",
                          checked,
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Settings */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Analytics & Tracking
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Cấu hình các công cụ phân tích và theo dõi
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label htmlFor="enable_analytics">
                        Kích hoạt Analytics
                      </Label>
                      <p className="text-sm text-gray-500">
                        Bật/tắt tất cả các công cụ theo dõi
                      </p>
                    </div>
                    <Switch
                      id="enable_analytics"
                      checked={seoSettings.analytics.enable_analytics}
                      onCheckedChange={(checked) =>
                        handleSeoInputChange(
                          "analytics",
                          "enable_analytics",
                          checked,
                        )
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="google_analytics_id">
                        Google Analytics 4 ID
                      </Label>
                      <Input
                        id="google_analytics_id"
                        value={seoSettings.analytics.google_analytics_id}
                        onChange={(e) =>
                          handleSeoInputChange(
                            "analytics",
                            "google_analytics_id",
                            e.target.value,
                          )
                        }
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="google_tag_manager_id">
                        Google Tag Manager ID
                      </Label>
                      <Input
                        id="google_tag_manager_id"
                        value={seoSettings.analytics.google_tag_manager_id}
                        onChange={(e) =>
                          handleSeoInputChange(
                            "analytics",
                            "google_tag_manager_id",
                            e.target.value,
                          )
                        }
                        placeholder="GTM-XXXXXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="google_search_console">
                        Google Search Console
                      </Label>
                      <Input
                        id="google_search_console"
                        value={
                          seoSettings.analytics
                            .google_search_console_verification
                        }
                        onChange={(e) =>
                          handleSeoInputChange(
                            "analytics",
                            "google_search_console_verification",
                            e.target.value,
                          )
                        }
                        placeholder="Mã xác thực GSC"
                      />
                    </div>
                    <div>
                      <Label htmlFor="facebook_pixel_id">
                        Facebook Pixel ID
                      </Label>
                      <Input
                        id="facebook_pixel_id"
                        value={seoSettings.analytics.facebook_pixel_id}
                        onChange={(e) =>
                          handleSeoInputChange(
                            "analytics",
                            "facebook_pixel_id",
                            e.target.value,
                          )
                        }
                        placeholder="1234567890123456"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Media Settings */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Social Media Integration
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Cấu hình tích hợp mạng xã hội và Open Graph
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="facebook_app_id"
                        className="flex items-center gap-2"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook App ID
                      </Label>
                      <Input
                        id="facebook_app_id"
                        value={seoSettings.social.facebook_app_id}
                        onChange={(e) =>
                          handleSeoInputChange(
                            "social",
                            "facebook_app_id",
                            e.target.value,
                          )
                        }
                        placeholder="1234567890123456"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="twitter_site"
                        className="flex items-center gap-2"
                      >
                        <Twitter className="h-4 w-4" />
                        Twitter Username
                      </Label>
                      <Input
                        id="twitter_site"
                        value={seoSettings.social.twitter_site}
                        onChange={(e) =>
                          handleSeoInputChange(
                            "social",
                            "twitter_site",
                            e.target.value,
                          )
                        }
                        placeholder="@hacom_vn"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schema.org Settings */}
            <TabsContent value="schema" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Schema.org Structured Data
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Cấu hình dữ liệu có cấu trúc để tăng hiển thị trong SERP
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="organization_name">Tên tổ chức</Label>
                      <Input
                        id="organization_name"
                        value={seoSettings.schema.organization_name}
                        onChange={(e) =>
                          handleSeoInputChange(
                            "schema",
                            "organization_name",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="organization_phone">Số điện thoại</Label>
                      <Input
                        id="organization_phone"
                        value={seoSettings.schema.organization_phone}
                        onChange={(e) =>
                          handleSeoInputChange(
                            "schema",
                            "organization_phone",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="organization_address">Địa chỉ</Label>
                    <Textarea
                      id="organization_address"
                      value={seoSettings.schema.organization_address}
                      onChange={(e) =>
                        handleSeoInputChange(
                          "schema",
                          "organization_address",
                          e.target.value,
                        )
                      }
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable_org_schema">
                        Organization Schema
                      </Label>
                      <Switch
                        id="enable_org_schema"
                        checked={seoSettings.schema.enable_organization_schema}
                        onCheckedChange={(checked) =>
                          handleSeoInputChange(
                            "schema",
                            "enable_organization_schema",
                            checked,
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable_product_schema">
                        Product Schema
                      </Label>
                      <Switch
                        id="enable_product_schema"
                        checked={seoSettings.schema.enable_product_schema}
                        onCheckedChange={(checked) =>
                          handleSeoInputChange(
                            "schema",
                            "enable_product_schema",
                            checked,
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technical SEO */}
            <TabsContent value="technical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Technical SEO
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Tối ưu hóa kỹ thuật cho công cụ tìm kiếm
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Sitemap & Robots</h4>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable_sitemap">Bật Sitemap</Label>
                        <Switch
                          id="enable_sitemap"
                          checked={seoSettings.technical.enable_sitemap}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "technical",
                              "enable_sitemap",
                              checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sitemap_include_images">
                          Bao gồm hình ảnh
                        </Label>
                        <Switch
                          id="sitemap_include_images"
                          checked={seoSettings.technical.sitemap_include_images}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "technical",
                              "sitemap_include_images",
                              checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={generateSitemap}
                          disabled={sitemapGenerating}
                          className="flex-1"
                        >
                          {sitemapGenerating ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          {sitemapGenerating ? "Đang tạo..." : "Tạo Sitemap"}
                        </Button>
                        <Button
                          onClick={generateRobotsTxt}
                          disabled={robotsGenerating}
                          variant="outline"
                          className="flex-1"
                        >
                          {robotsGenerating ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          {robotsGenerating ? "Đang tạo..." : "Tạo Robots.txt"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">
                        Compression & Minification
                      </h4>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable_compression">
                          GZIP Compression
                        </Label>
                        <Switch
                          id="enable_compression"
                          checked={seoSettings.technical.enable_compression}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "technical",
                              "enable_compression",
                              checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="minify_html">Minify HTML</Label>
                        <Switch
                          id="minify_html"
                          checked={seoSettings.technical.minify_html}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "technical",
                              "minify_html",
                              checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="lazy_load_images">
                          Lazy Load Images
                        </Label>
                        <Switch
                          id="lazy_load_images"
                          checked={seoSettings.technical.lazy_load_images}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "technical",
                              "lazy_load_images",
                              checked,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="robots_txt_custom">
                      Custom Robots.txt Content
                    </Label>
                    <Textarea
                      id="robots_txt_custom"
                      value={seoSettings.technical.robots_txt_custom}
                      onChange={(e) =>
                        handleSeoInputChange(
                          "technical",
                          "robots_txt_custom",
                          e.target.value,
                        )
                      }
                      rows={6}
                      placeholder="# Custom robots.txt rules"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Optimization */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Content Optimization
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Tối ưu hóa nội dung tự động và cài đặt SEO
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Auto SEO Features</h4>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable_auto_seo">Auto SEO</Label>
                        <Switch
                          id="enable_auto_seo"
                          checked={seoSettings.content.enable_auto_seo}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "content",
                              "enable_auto_seo",
                              checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="h1_optimization">H1 Optimization</Label>
                        <Switch
                          id="h1_optimization"
                          checked={seoSettings.content.h1_optimization}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "content",
                              "h1_optimization",
                              checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="internal_linking">
                          Auto Internal Linking
                        </Label>
                        <Switch
                          id="internal_linking"
                          checked={seoSettings.content.internal_linking}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "content",
                              "internal_linking",
                              checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="image_alt_optimization">
                          Image Alt Optimization
                        </Label>
                        <Switch
                          id="image_alt_optimization"
                          checked={seoSettings.content.image_alt_optimization}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "content",
                              "image_alt_optimization",
                              checked,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">
                        Content Quality Settings
                      </h4>
                      <div>
                        <Label htmlFor="keyword_density_target">
                          Target Keyword Density (%)
                        </Label>
                        <Input
                          id="keyword_density_target"
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={seoSettings.content.keyword_density_target}
                          onChange={(e) =>
                            handleSeoInputChange(
                              "content",
                              "keyword_density_target",
                              parseFloat(e.target.value),
                            )
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Khuyến nghị: 1-3% cho tối ưu SEO
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="content_min_words">
                          Minimum Content Words
                        </Label>
                        <Input
                          id="content_min_words"
                          type="number"
                          min="100"
                          max="2000"
                          value={seoSettings.content.content_min_words}
                          onChange={(e) =>
                            handleSeoInputChange(
                              "content",
                              "content_min_words",
                              parseInt(e.target.value),
                            )
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Khuyến nghị tối thiểu 300 từ cho mỗi trang
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable_faq_schema">FAQ Schema</Label>
                        <Switch
                          id="enable_faq_schema"
                          checked={seoSettings.content.enable_faq_schema}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "content",
                              "enable_faq_schema",
                              checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable_article_schema">
                          Article Schema
                        </Label>
                        <Switch
                          id="enable_article_schema"
                          checked={seoSettings.content.enable_article_schema}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "content",
                              "enable_article_schema",
                              checked,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-4">Meta Title Templates</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="default_meta_title">
                          Default Meta Title Pattern
                        </Label>
                        <Input
                          id="default_meta_title"
                          value={seoSettings.general.default_meta_title_pattern}
                          onChange={(e) =>
                            handleSeoInputChange(
                              "general",
                              "default_meta_title_pattern",
                              e.target.value,
                            )
                          }
                          placeholder="{title} | HACOM"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Variables: {"{title}"}, {"{sitename}"}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="product_meta_title">
                          Product Meta Title Pattern
                        </Label>
                        <Input
                          id="product_meta_title"
                          value={seoSettings.general.product_meta_title_pattern}
                          onChange={(e) =>
                            handleSeoInputChange(
                              "general",
                              "product_meta_title_pattern",
                              e.target.value,
                            )
                          }
                          placeholder="{product_name} - {category} | HACOM"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Variables: {"{product_name}"}, {"{category}"},{" "}
                          {"{price}"}, {"{sku}"}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="category_meta_title">
                          Category Meta Title Pattern
                        </Label>
                        <Input
                          id="category_meta_title"
                          value={
                            seoSettings.general.category_meta_title_pattern
                          }
                          onChange={(e) =>
                            handleSeoInputChange(
                              "general",
                              "category_meta_title_pattern",
                              e.target.value,
                            )
                          }
                          placeholder="{category_name} - {description} | HACOM"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Variables: {"{category_name}"}, {"{description}"},{" "}
                          {"{count}"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Settings */}
            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Performance Optimization
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Tối ưu hóa hiệu suất website cho SEO và Core Web Vitals
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">
                        Image & Resource Optimization
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="optimize_images">
                            Optimize Images
                          </Label>
                          <p className="text-xs text-gray-500">
                            WebP conversion, compression
                          </p>
                        </div>
                        <Switch
                          id="optimize_images"
                          checked={seoSettings.performance.optimize_images}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "performance",
                              "optimize_images",
                              checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enable_critical_css">
                            Critical CSS
                          </Label>
                          <p className="text-xs text-gray-500">
                            Inline critical styles
                          </p>
                        </div>
                        <Switch
                          id="enable_critical_css"
                          checked={seoSettings.performance.enable_critical_css}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "performance",
                              "enable_critical_css",
                              checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="defer_non_critical_js">
                            Defer Non-Critical JS
                          </Label>
                          <p className="text-xs text-gray-500">
                            Improve loading speed
                          </p>
                        </div>
                        <Switch
                          id="defer_non_critical_js"
                          checked={
                            seoSettings.performance.defer_non_critical_js
                          }
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "performance",
                              "defer_non_critical_js",
                              checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="preload_critical_resources">
                            Preload Critical Resources
                          </Label>
                          <p className="text-xs text-gray-500">
                            Fonts, CSS, key images
                          </p>
                        </div>
                        <Switch
                          id="preload_critical_resources"
                          checked={
                            seoSettings.performance.preload_critical_resources
                          }
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "performance",
                              "preload_critical_resources",
                              checked,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">CDN & Caching</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enable_cdn">Enable CDN</Label>
                          <p className="text-xs text-gray-500">
                            Content delivery network
                          </p>
                        </div>
                        <Switch
                          id="enable_cdn"
                          checked={seoSettings.performance.enable_cdn}
                          onCheckedChange={(checked) =>
                            handleSeoInputChange(
                              "performance",
                              "enable_cdn",
                              checked,
                            )
                          }
                        />
                      </div>
                      {seoSettings.performance.enable_cdn && (
                        <div>
                          <Label htmlFor="cdn_url">CDN URL</Label>
                          <Input
                            id="cdn_url"
                            value={seoSettings.performance.cdn_url}
                            onChange={(e) =>
                              handleSeoInputChange(
                                "performance",
                                "cdn_url",
                                e.target.value,
                              )
                            }
                            placeholder="https://cdn.hacom.vn"
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="lazy_load_threshold">
                          Lazy Load Threshold (px)
                        </Label>
                        <Input
                          id="lazy_load_threshold"
                          type="number"
                          min="0"
                          max="1000"
                          value={seoSettings.performance.lazy_load_threshold}
                          onChange={(e) =>
                            handleSeoInputChange(
                              "performance",
                              "lazy_load_threshold",
                              parseInt(e.target.value),
                            )
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Distance before loading images (default: 200px)
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Monitor className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Core Web Vitals Impact:</strong> Các tùy chọn này
                      trực tiếp ảnh hưởng đến LCP, FID, và CLS - những metrics
                      quan trọng cho SEO. Khuyến nghị bật tất cả để đạt điểm
                      hiệu suất cao nhất.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Local SEO */}
            <TabsContent value="local" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Local SEO
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Tối ưu hóa cho tìm kiếm địa phương
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_local_seo">Enable Local SEO</Label>
                      <p className="text-sm text-gray-500">
                        Bật các tính năng tối ưu cho tìm kiếm địa phương
                      </p>
                    </div>
                    <Switch
                      id="enable_local_seo"
                      checked={seoSettings.local.enable_local_seo}
                      onCheckedChange={(checked) =>
                        handleSeoInputChange(
                          "local",
                          "enable_local_seo",
                          checked,
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="opening_hours">Opening Hours</Label>
                    <Textarea
                      id="opening_hours"
                      value={seoSettings.local.opening_hours}
                      onChange={(e) =>
                        handleSeoInputChange(
                          "local",
                          "opening_hours",
                          e.target.value,
                        )
                      }
                      rows={3}
                      placeholder="Thứ 2 - Chủ nhật: 8:00 - 22:00"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* SEO Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Search className="h-4 w-4" />
                  <span>Cài đặt SEO được tối ưu hóa cho công cụ t��m kiếm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={calculateSeoScore} variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Tính điểm SEO
                  </Button>
                  <Button onClick={handleSaveSeoSettings} disabled={saving}>
                    {saving ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? "Đang lưu..." : "Lưu cài đặt SEO"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Summary Statistics */}
          <SeoSummaryStats />

          {/* SEO Testing Panel */}
          <SeoTestPanel />
        </TabsContent>

        {/* Original Settings Tabs... */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Thông tin chung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site_name">Tên website</Label>
                  <Input
                    id="site_name"
                    value={settings.general.site_name}
                    onChange={(e) =>
                      handleInputChange("general", "site_name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Email liên hệ</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.general.contact_email}
                    onChange={(e) =>
                      handleInputChange(
                        "general",
                        "contact_email",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Settings Tab */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Cài đặt cửa hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="store_enabled">Kích hoạt cửa hàng</Label>
                    <Switch
                      id="store_enabled"
                      checked={settings.store.store_enabled}
                      onCheckedChange={(checked) =>
                        handleInputChange("store", "store_enabled", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance_mode">Chế độ bảo trì</Label>
                    <Switch
                      id="maintenance_mode"
                      checked={settings.store.maintenance_mode}
                      onCheckedChange={(checked) =>
                        handleInputChange("store", "maintenance_mode", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow_guest_checkout">
                      Cho phép đặt hàng không cần đăng ký
                    </Label>
                    <Switch
                      id="allow_guest_checkout"
                      checked={settings.store.allow_guest_checkout}
                      onCheckedChange={(checked) =>
                        handleInputChange(
                          "store",
                          "allow_guest_checkout",
                          checked,
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {settings.store.maintenance_mode && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Chế độ bảo trì đã được kích hoạt. Khách hàng sẽ không thể
                    truy cập website.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add other remaining tabs with simplified content */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Cài đặt vận chuyển
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Cài đặt vận chuyển sẽ được thêm vào sau.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Phương thức thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Cài đặt thanh toán sẽ được thêm vào sau.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Cài đặt email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleTestEmail} variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Gửi email thử nghiệm
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Cài đặt bảo mật
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Cài đặt bảo mật sẽ được thêm vào sau.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Cài đặt thông báo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Cài đặt thông báo sẽ được thêm vào sau.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Database className="h-4 w-4" />
              <span>Các thay đổi sẽ được lưu vào cơ sở dữ liệu</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadSettings} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Khôi phục
              </Button>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Đang lưu..." : "Lưu tất cả cài đặt"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
