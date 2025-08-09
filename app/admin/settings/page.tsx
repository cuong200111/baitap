"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Settings,
  Globe,
  BarChart3,
  Share2,
  Zap,
  FileText,
  MapPin,
  CheckCircle,
  AlertCircle,
  Info,
  Store,
  Mail,
  Truck,
  CreditCard,
  Shield,
  Bell,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import AdminInitializer from "@/components/AdminInitializer";
import { API_DOMAIN } from "@/lib/api-helpers";

interface SeoSettings {
  general: {
    site_name: string;
    site_url: string;
    site_description: string;
    site_keywords: string;
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
    default_og_image: string;
    linkedin_url: string;
    youtube_url: string;
    instagram_url: string;
    tiktok_url: string;
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
    latitude: number;
    longitude: number;
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

  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seoScore, setSeoScore] = useState(0);

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
    try {
      // Get authentication token
      const token = localStorage.getItem("token");
      const headers: any = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Try to fetch from backend server (port 4000)
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${backendUrl}/api/seo/settings`, {
        method: "GET",
        headers,
      });
      const result = await response.json();

      if (result.success) {
        setSeoSettings(result.data);
        calculateSeoScore(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error loading SEO settings:", error);
      toast.error("Không thể tải cài đặt SEO");
    }
  };

  const calculateSeoScore = (seoSettings: SeoSettings) => {
    let score = 0;
    let total = 0;

    // General settings (25 points)
    total += 25;
    if (seoSettings.general.site_name) score += 5;
    if (seoSettings.general.site_url) score += 5;
    if (seoSettings.general.site_description) score += 5;
    if (seoSettings.general.site_keywords) score += 5;
    if (seoSettings.general.auto_generate_meta_description) score += 5;

    // Analytics (20 points)
    total += 20;
    if (seoSettings.analytics.enable_analytics) score += 5;
    if (seoSettings.analytics.google_analytics_id) score += 5;
    if (seoSettings.analytics.google_tag_manager_id) score += 5;
    if (seoSettings.analytics.google_search_console_verification) score += 5;

    // Schema (20 points)
    total += 20;
    if (seoSettings.schema.enable_organization_schema) score += 5;
    if (seoSettings.schema.enable_product_schema) score += 5;
    if (seoSettings.schema.organization_name) score += 5;
    if (seoSettings.schema.organization_address) score += 5;

    // Technical (15 points)
    total += 15;
    if (seoSettings.technical.enable_sitemap) score += 5;
    if (seoSettings.technical.enable_compression) score += 5;
    if (seoSettings.technical.lazy_load_images) score += 5;

    // Performance (10 points)
    total += 10;
    if (seoSettings.performance.optimize_images) score += 5;
    if (seoSettings.performance.enable_critical_css) score += 5;

    // Content (10 points)
    total += 10;
    if (seoSettings.content.enable_auto_seo) score += 5;
    if (seoSettings.content.content_min_words >= 300) score += 5;

    setSeoScore(Math.round((score / total) * 100));
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

  const saveSeoSettings = async () => {
    if (!seoSettings) return;

    setSaving(true);
    try {
      // Get authentication token
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để lưu cài đặt");
        setSaving(false);
        return;
      }

      // Try to save to backend server (port 4000)
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${backendUrl}/api/admin/seo-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(seoSettings),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Đã lưu cài đặt SEO thành công");
        calculateSeoScore(seoSettings);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error saving SEO settings:", error);
      toast.error("Không thể lưu cài đặt SEO");
    } finally {
      setSaving(false);
    }
  };

  const updateSeoSetting = (
    category: keyof SeoSettings,
    key: string,
    value: any,
  ) => {
    if (!seoSettings) return;

    setSeoSettings((prev) => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value,
      },
    }));
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
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="store">Cửa hàng</TabsTrigger>
          <TabsTrigger value="shipping">Vận chuyển</TabsTrigger>
          <TabsTrigger value="payment">Thanh toán</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
        </TabsList>

        {/* COMPREHENSIVE SEO TAB - MOVED FROM /admin/seo */}
        <TabsContent value="seo" className="space-y-6">
          {!seoSettings ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Đang tải cài đặt SEO...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Cài đặt SEO</h2>
                  <p className="text-muted-foreground mt-2">
                    Quản lý tất cả các thiết lập SEO cho website
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Điểm SEO</p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-2xl font-bold ${
                          seoScore >= 80
                            ? "text-green-600"
                            : seoScore >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {seoScore}%
                      </div>
                      {seoScore >= 80 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={saveSeoSettings}
                    disabled={saving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Đang lưu..." : "Lưu cài đặt SEO"}
                  </Button>
                </div>
              </div>

              {/* SEO Score Alert */}
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {seoScore >= 80
                    ? "Tuyệt vời! Cài đặt SEO của bạn đã được tối ưu hóa tốt."
                    : seoScore >= 60
                      ? "Cài đặt SEO khá tốt, nhưng vẫn có thể cải thiện thêm."
                      : "Cài đặt SEO cần được cải thiện để đạt hiệu quả tối ưu."}
                </AlertDescription>
              </Alert>

              {/* SEO Settings Tabs */}
              <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-8">
                  <TabsTrigger value="general" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Cơ bản
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="social" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Social
                  </TabsTrigger>
                  <TabsTrigger value="schema" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Schema
                  </TabsTrigger>
                  <TabsTrigger value="technical" className="gap-2">
                    <Zap className="h-4 w-4" />
                    Kỹ thuật
                  </TabsTrigger>
                  <TabsTrigger value="content" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Nội dung
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="gap-2">
                    <Zap className="h-4 w-4" />
                    Hiệu suất
                  </TabsTrigger>
                  <TabsTrigger value="local" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Địa phương
                  </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cài đặt SEO cơ bản</CardTitle>
                      <CardDescription>
                        Các thiết lập cơ bản để tối ưu hóa website cho công cụ
                        tìm kiếm
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="site_name">Tên website (SEO)</Label>
                          <Input
                            id="site_name"
                            value={seoSettings.general.site_name}
                            onChange={(e) =>
                              updateSeoSetting(
                                "general",
                                "site_name",
                                e.target.value,
                              )
                            }
                            placeholder="ZoxVN- Máy tính, Laptop"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="site_url">
                            URL chính của website
                          </Label>
                          <Input
                            id="site_url"
                            value={seoSettings.general.site_url}
                            onChange={(e) =>
                              updateSeoSetting(
                                "general",
                                "site_url",
                                e.target.value,
                              )
                            }
                            placeholder="https://hacom.vns"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="site_description">
                          Mô tả website (Meta Description)
                        </Label>
                        <Textarea
                          id="site_description"
                          value={seoSettings.general.site_description}
                          onChange={(e) =>
                            updateSeoSetting(
                              "general",
                              "site_description",
                              e.target.value,
                            )
                          }
                          placeholder="HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính..."
                          rows={3}
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            {seoSettings.general.site_description.length}/160 ký
                            tự
                          </span>
                          <Badge
                            variant={
                              seoSettings.general.site_description.length <= 160
                                ? "default"
                                : "destructive"
                            }
                          >
                            {seoSettings.general.site_description.length <= 160
                              ? "Tốt"
                              : "Quá dài"}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="site_keywords">
                          Từ khóa chính (Keywords)
                        </Label>
                        <Input
                          id="site_keywords"
                          value={seoSettings.general.site_keywords}
                          onChange={(e) =>
                            updateSeoSetting(
                              "general",
                              "site_keywords",
                              e.target.value,
                            )
                          }
                          placeholder="máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto_meta"
                          checked={
                            seoSettings.general.auto_generate_meta_description
                          }
                          onCheckedChange={(checked) =>
                            updateSeoSetting(
                              "general",
                              "auto_generate_meta_description",
                              checked,
                            )
                          }
                        />
                        <Label htmlFor="auto_meta">
                          Tự động tạo Meta Description
                        </Label>
                        <Badge variant="secondary">Khuyến nghị</Badge>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold">
                          Meta Title Templates
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="default_title">
                              Default Meta Title Pattern
                            </Label>
                            <Input
                              id="default_title"
                              value={
                                seoSettings.general.default_meta_title_pattern
                              }
                              onChange={(e) =>
                                updateSeoSetting(
                                  "general",
                                  "default_meta_title_pattern",
                                  e.target.value,
                                )
                              }
                              placeholder="{title} | HACOM"
                            />
                            <p className="text-sm text-muted-foreground">
                              Variables: {"{title}"}, {"{sitename}"}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="product_title">
                              Product Meta Title Pattern
                            </Label>
                            <Input
                              id="product_title"
                              value={
                                seoSettings.general.product_meta_title_pattern
                              }
                              onChange={(e) =>
                                updateSeoSetting(
                                  "general",
                                  "product_meta_title_pattern",
                                  e.target.value,
                                )
                              }
                              placeholder="{product_name} - {category} | HACOM"
                            />
                            <p className="text-sm text-muted-foreground">
                              Variables: {"{product_name}"}, {"{category}"},{" "}
                              {"{price}"}, {"{sku}"}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category_title">
                              Category Meta Title Pattern
                            </Label>
                            <Input
                              id="category_title"
                              value={
                                seoSettings.general.category_meta_title_pattern
                              }
                              onChange={(e) =>
                                updateSeoSetting(
                                  "general",
                                  "category_meta_title_pattern",
                                  e.target.value,
                                )
                              }
                              placeholder="{category_name} - {description} | HACOM"
                            />
                            <p className="text-sm text-muted-foreground">
                              Variables: {"{category_name}"}, {"{description}"},{" "}
                              {"{count}"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Analytics Settings */}
                <TabsContent value="analytics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analytics & Tracking</CardTitle>
                      <CardDescription>
                        Cấu hình các công cụ phân tích và theo dõi
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center space-x-2 mb-6">
                        <Switch
                          id="enable_analytics"
                          checked={seoSettings.analytics.enable_analytics}
                          onCheckedChange={(checked) =>
                            updateSeoSetting(
                              "analytics",
                              "enable_analytics",
                              checked,
                            )
                          }
                        />
                        <Label htmlFor="enable_analytics">
                          Kích hoạt Analytics
                        </Label>
                        <Badge variant="secondary">
                          Bật/tắt tất cả các công cụ theo dõi
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="ga_id">Google Analytics 4 ID</Label>
                          <Input
                            id="ga_id"
                            value={seoSettings.analytics.google_analytics_id}
                            onChange={(e) =>
                              updateSeoSetting(
                                "analytics",
                                "google_analytics_id",
                                e.target.value,
                              )
                            }
                            placeholder="G-XXXXXXXXXX"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gtm_id">Google Tag Manager ID</Label>
                          <Input
                            id="gtm_id"
                            value={seoSettings.analytics.google_tag_manager_id}
                            onChange={(e) =>
                              updateSeoSetting(
                                "analytics",
                                "google_tag_manager_id",
                                e.target.value,
                              )
                            }
                            placeholder="GTM-XXXXXXX"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gsc_verification">
                            Google Search Console
                          </Label>
                          <Input
                            id="gsc_verification"
                            value={
                              seoSettings.analytics
                                .google_search_console_verification
                            }
                            onChange={(e) =>
                              updateSeoSetting(
                                "analytics",
                                "google_search_console_verification",
                                e.target.value,
                              )
                            }
                            placeholder="Mã xác thực GSC"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fb_pixel">Facebook Pixel ID</Label>
                          <Input
                            id="fb_pixel"
                            value={seoSettings.analytics.facebook_pixel_id}
                            onChange={(e) =>
                              updateSeoSetting(
                                "analytics",
                                "facebook_pixel_id",
                                e.target.value,
                              )
                            }
                            placeholder="1234567890123456"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bing_verification">
                            Bing Webmaster Verification
                          </Label>
                          <Input
                            id="bing_verification"
                            value={
                              seoSettings.analytics.bing_webmaster_verification
                            }
                            onChange={(e) =>
                              updateSeoSetting(
                                "analytics",
                                "bing_webmaster_verification",
                                e.target.value,
                              )
                            }
                            placeholder="Mã xác thực Bing"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hotjar_id">Hotjar ID</Label>
                          <Input
                            id="hotjar_id"
                            value={seoSettings.analytics.hotjar_id}
                            onChange={(e) =>
                              updateSeoSetting(
                                "analytics",
                                "hotjar_id",
                                e.target.value,
                              )
                            }
                            placeholder="Hotjar ID"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Social Media Settings */}
                <TabsContent value="social">
                  <Card>
                    <CardHeader>
                      <CardTitle>Social Media Integration</CardTitle>
                      <CardDescription>
                        Cấu hình tích hợp mạng xã hội và Open Graph
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fb_app_id">Facebook App ID</Label>
                          <Input
                            id="fb_app_id"
                            value={seoSettings.social.facebook_app_id}
                            onChange={(e) =>
                              updateSeoSetting(
                                "social",
                                "facebook_app_id",
                                e.target.value,
                              )
                            }
                            placeholder="facd"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="twitter_username">
                            Twitter Username
                          </Label>
                          <Input
                            id="twitter_username"
                            value={seoSettings.social.twitter_site}
                            onChange={(e) =>
                              updateSeoSetting(
                                "social",
                                "twitter_site",
                                e.target.value,
                              )
                            }
                            placeholder="@hacom_vn"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                          <Input
                            id="linkedin_url"
                            value={seoSettings.social.linkedin_url}
                            onChange={(e) =>
                              updateSeoSetting(
                                "social",
                                "linkedin_url",
                                e.target.value,
                              )
                            }
                            placeholder="https://linkedin.com/company/hacom"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtube_url">YouTube URL</Label>
                          <Input
                            id="youtube_url"
                            value={seoSettings.social.youtube_url}
                            onChange={(e) =>
                              updateSeoSetting(
                                "social",
                                "youtube_url",
                                e.target.value,
                              )
                            }
                            placeholder="https://youtube.com/c/hacom"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instagram_url">Instagram URL</Label>
                          <Input
                            id="instagram_url"
                            value={seoSettings.social.instagram_url}
                            onChange={(e) =>
                              updateSeoSetting(
                                "social",
                                "instagram_url",
                                e.target.value,
                              )
                            }
                            placeholder="https://instagram.com/hacom"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tiktok_url">TikTok URL</Label>
                          <Input
                            id="tiktok_url"
                            value={seoSettings.social.tiktok_url}
                            onChange={(e) =>
                              updateSeoSetting(
                                "social",
                                "tiktok_url",
                                e.target.value,
                              )
                            }
                            placeholder="https://tiktok.com/@hacom"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Schema.org Settings */}
                <TabsContent value="schema">
                  <Card>
                    <CardHeader>
                      <CardTitle>Schema.org Structured Data</CardTitle>
                      <CardDescription>
                        Cấu hình dữ liệu có cấu trúc để tăng hiển thị trong SERP
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="org_name">Tên tổ chức</Label>
                          <Input
                            id="org_name"
                            value={seoSettings.schema.organization_name}
                            onChange={(e) =>
                              updateSeoSetting(
                                "schema",
                                "organization_name",
                                e.target.value,
                              )
                            }
                            placeholder="HACOM"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="org_phone">Số điện thoại</Label>
                          <Input
                            id="org_phone"
                            value={seoSettings.schema.organization_phone}
                            onChange={(e) =>
                              updateSeoSetting(
                                "schema",
                                "organization_phone",
                                e.target.value,
                              )
                            }
                            placeholder="1900 19032"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="org_address">Địa chỉ</Label>
                        <Input
                          id="org_address"
                          value={seoSettings.schema.organization_address}
                          onChange={(e) =>
                            updateSeoSetting(
                              "schema",
                              "organization_address",
                              e.target.value,
                            )
                          }
                          placeholder="Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội2"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="0.0001"
                            value={seoSettings.schema.latitude}
                            onChange={(e) =>
                              updateSeoSetting(
                                "schema",
                                "latitude",
                                parseFloat(e.target.value),
                              )
                            }
                            placeholder="21.0285"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="0.0001"
                            value={seoSettings.schema.longitude}
                            onChange={(e) =>
                              updateSeoSetting(
                                "schema",
                                "longitude",
                                parseFloat(e.target.value),
                              )
                            }
                            placeholder="105.8542"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="org_schema"
                            checked={
                              seoSettings.schema.enable_organization_schema
                            }
                            onCheckedChange={(checked) =>
                              updateSeoSetting(
                                "schema",
                                "enable_organization_schema",
                                checked,
                              )
                            }
                          />
                          <Label htmlFor="org_schema">
                            Organization Schema
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="product_schema"
                            checked={seoSettings.schema.enable_product_schema}
                            onCheckedChange={(checked) =>
                              updateSeoSetting(
                                "schema",
                                "enable_product_schema",
                                checked,
                              )
                            }
                          />
                          <Label htmlFor="product_schema">Product Schema</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Technical SEO */}
                <TabsContent value="technical">
                  <Card>
                    <CardHeader>
                      <CardTitle>Technical SEO</CardTitle>
                      <CardDescription>
                        Tối ưu hóa kỹ thuật cho công cụ tìm kiếm
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold">
                          Sitemap & Robots
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="enable_sitemap"
                            checked={seoSettings.technical.enable_sitemap}
                            onCheckedChange={(checked) =>
                              updateSeoSetting(
                                "technical",
                                "enable_sitemap",
                                checked,
                              )
                            }
                          />
                          <Label htmlFor="enable_sitemap">Bật Sitemap</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="sitemap_images"
                            checked={
                              seoSettings.technical.sitemap_include_images
                            }
                            onCheckedChange={(checked) =>
                              updateSeoSetting(
                                "technical",
                                "sitemap_include_images",
                                checked,
                              )
                            }
                          />
                          <Label htmlFor="sitemap_images">
                            Bao gồm hình ảnh
                          </Label>
                        </div>
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Sitemap và Robots.txt sẽ được tạo tự động bởi
                            next-sitemap.
                          </AlertDescription>
                        </Alert>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold">
                          Compression & Minification
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="gzip_compression"
                              checked={seoSettings.technical.enable_compression}
                              onCheckedChange={(checked) =>
                                updateSeoSetting(
                                  "technical",
                                  "enable_compression",
                                  checked,
                                )
                              }
                            />
                            <Label htmlFor="gzip_compression">
                              GZIP Compression
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="minify_html"
                              checked={seoSettings.technical.minify_html}
                              onCheckedChange={(checked) =>
                                updateSeoSetting(
                                  "technical",
                                  "minify_html",
                                  checked,
                                )
                              }
                            />
                            <Label htmlFor="minify_html">Minify HTML</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="lazy_load"
                              checked={seoSettings.technical.lazy_load_images}
                              onCheckedChange={(checked) =>
                                updateSeoSetting(
                                  "technical",
                                  "lazy_load_images",
                                  checked,
                                )
                              }
                            />
                            <Label htmlFor="lazy_load">Lazy Load Images</Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="robots_custom">
                          Custom Robots.txt Content
                        </Label>
                        <Textarea
                          id="robots_custom"
                          value={seoSettings.technical.robots_txt_custom}
                          onChange={(e) =>
                            updateSeoSetting(
                              "technical",
                              "robots_txt_custom",
                              e.target.value,
                            )
                          }
                          placeholder="User-agent: *&#10;Disallow: /admin"
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Content Optimization */}
                <TabsContent value="content">
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Optimization</CardTitle>
                      <CardDescription>
                        Tối ưu hóa nội dung tự động và cài đặt SEO
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold">
                          Auto SEO Features
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="auto_seo"
                              checked={seoSettings.content.enable_auto_seo}
                              onCheckedChange={(checked) =>
                                updateSeoSetting(
                                  "content",
                                  "enable_auto_seo",
                                  checked,
                                )
                              }
                            />
                            <Label htmlFor="auto_seo">Auto SEO</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="h1_optimization"
                              checked={seoSettings.content.h1_optimization}
                              onCheckedChange={(checked) =>
                                updateSeoSetting(
                                  "content",
                                  "h1_optimization",
                                  checked,
                                )
                              }
                            />
                            <Label htmlFor="h1_optimization">
                              H1 Optimization
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="internal_linking"
                              checked={seoSettings.content.internal_linking}
                              onCheckedChange={(checked) =>
                                updateSeoSetting(
                                  "content",
                                  "internal_linking",
                                  checked,
                                )
                              }
                            />
                            <Label htmlFor="internal_linking">
                              Auto Internal Linking
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="image_alt"
                              checked={
                                seoSettings.content.image_alt_optimization
                              }
                              onCheckedChange={(checked) =>
                                updateSeoSetting(
                                  "content",
                                  "image_alt_optimization",
                                  checked,
                                )
                              }
                            />
                            <Label htmlFor="image_alt">
                              Image Alt Optimization
                            </Label>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold">
                          Content Quality Settings
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="keyword_density">
                              Target Keyword Density (%)
                            </Label>
                            <Input
                              id="keyword_density"
                              type="number"
                              step="0.1"
                              value={seoSettings.content.keyword_density_target}
                              onChange={(e) =>
                                updateSeoSetting(
                                  "content",
                                  "keyword_density_target",
                                  parseFloat(e.target.value),
                                )
                              }
                              placeholder="2.5"
                            />
                            <p className="text-sm text-muted-foreground">
                              Khuyến nghị: 1-3% cho tối ưu SEO
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="min_words">
                              Minimum Content Words
                            </Label>
                            <Input
                              id="min_words"
                              type="number"
                              value={seoSettings.content.content_min_words}
                              onChange={(e) =>
                                updateSeoSetting(
                                  "content",
                                  "content_min_words",
                                  parseInt(e.target.value),
                                )
                              }
                              placeholder="300"
                            />
                            <p className="text-sm text-muted-foreground">
                              Khuyến nghị tối thiểu 300 từ cho mỗi trang
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="faq_schema"
                            checked={seoSettings.content.enable_faq_schema}
                            onCheckedChange={(checked) =>
                              updateSeoSetting(
                                "content",
                                "enable_faq_schema",
                                checked,
                              )
                            }
                          />
                          <Label htmlFor="faq_schema">FAQ Schema</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="article_schema"
                            checked={seoSettings.content.enable_article_schema}
                            onCheckedChange={(checked) =>
                              updateSeoSetting(
                                "content",
                                "enable_article_schema",
                                checked,
                              )
                            }
                          />
                          <Label htmlFor="article_schema">Article Schema</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Performance Optimization */}
                <TabsContent value="performance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Optimization</CardTitle>
                      <CardDescription>
                        Tối ưu hóa hiệu suất website cho SEO và Core Web Vitals
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold">
                          Image & Resource Optimization
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="optimize_images"
                              checked={seoSettings.performance.optimize_images}
                              onCheckedChange={(checked) =>
                                updateSeoSetting(
                                  "performance",
                                  "optimize_images",
                                  checked,
                                )
                              }
                            />
                            <Label htmlFor="optimize_images">
                              Optimize Images
                            </Label>
                            <Badge variant="secondary">
                              WebP conversion, compression
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="critical_css"
                              checked={
                                seoSettings.performance.enable_critical_css
                              }
                              onCheckedChange={(checked) =>
                                updateSeoSetting(
                                  "performance",
                                  "enable_critical_css",
                                  checked,
                                )
                              }
                            />
                            <Label htmlFor="critical_css">Critical CSS</Label>
                            <Badge variant="secondary">
                              Inline critical styles
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="defer_js"
                              checked={
                                seoSettings.performance.defer_non_critical_js
                              }
                              onCheckedChange={(checked) =>
                                updateSeoSetting(
                                  "performance",
                                  "defer_non_critical_js",
                                  checked,
                                )
                              }
                            />
                            <Label htmlFor="defer_js">
                              Defer Non-Critical JS
                            </Label>
                            <Badge variant="secondary">
                              Improve loading speed
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="preload_resources"
                              checked={
                                seoSettings.performance
                                  .preload_critical_resources
                              }
                              onCheckedChange={(checked) =>
                                updateSeoSetting(
                                  "performance",
                                  "preload_critical_resources",
                                  checked,
                                )
                              }
                            />
                            <Label htmlFor="preload_resources">
                              Preload Critical Resources
                            </Label>
                            <Badge variant="secondary">
                              Fonts, CSS, key images
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold">CDN & Caching</h4>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="enable_cdn"
                            checked={seoSettings.performance.enable_cdn}
                            onCheckedChange={(checked) =>
                              updateSeoSetting(
                                "performance",
                                "enable_cdn",
                                checked,
                              )
                            }
                          />
                          <Label htmlFor="enable_cdn">Enable CDN</Label>
                          <Badge variant="secondary">
                            Content delivery network
                          </Badge>
                        </div>

                        {seoSettings.performance.enable_cdn && (
                          <div className="space-y-2">
                            <Label htmlFor="cdn_url">CDN URL</Label>
                            <Input
                              id="cdn_url"
                              value={seoSettings.performance.cdn_url}
                              onChange={(e) =>
                                updateSeoSetting(
                                  "performance",
                                  "cdn_url",
                                  e.target.value,
                                )
                              }
                              placeholder="https://cdn.example.com"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lazy_threshold">
                          Lazy Load Threshold (px)
                        </Label>
                        <Input
                          id="lazy_threshold"
                          type="number"
                          value={seoSettings.performance.lazy_load_threshold}
                          onChange={(e) =>
                            updateSeoSetting(
                              "performance",
                              "lazy_load_threshold",
                              parseInt(e.target.value),
                            )
                          }
                          placeholder="200"
                        />
                        <p className="text-sm text-muted-foreground">
                          Distance before loading images (default: 200px)
                        </p>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Core Web Vitals Impact:</strong> Các tùy chọn
                          này trực tiếp ảnh hưởng đến LCP, FID, và CLS - những
                          metrics quan trọng cho SEO. Khuyến nghị bật tất cả để
                          đạt điểm hiệu suất cao nhất.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Local SEO */}
                <TabsContent value="local">
                  <Card>
                    <CardHeader>
                      <CardTitle>Local SEO</CardTitle>
                      <CardDescription>
                        Tối ưu hóa cho tìm kiếm địa phương
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center space-x-2 mb-6">
                        <Switch
                          id="enable_local_seo"
                          checked={seoSettings.local.enable_local_seo}
                          onCheckedChange={(checked) =>
                            updateSeoSetting(
                              "local",
                              "enable_local_seo",
                              checked,
                            )
                          }
                        />
                        <Label htmlFor="enable_local_seo">
                          Enable Local SEO
                        </Label>
                        <Badge variant="secondary">
                          Bật các tính năng tối ưu cho tìm kiếm địa phương
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="business_category">
                            Business Category
                          </Label>
                          <Input
                            id="business_category"
                            value={seoSettings.local.business_category}
                            onChange={(e) =>
                              updateSeoSetting(
                                "local",
                                "business_category",
                                e.target.value,
                              )
                            }
                            placeholder="Electronics Store"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gmb_id">Google My Business ID</Label>
                          <Input
                            id="gmb_id"
                            value={seoSettings.local.google_my_business_id}
                            onChange={(e) =>
                              updateSeoSetting(
                                "local",
                                "google_my_business_id",
                                e.target.value,
                              )
                            }
                            placeholder="Google My Business ID"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="opening_hours">Opening Hours</Label>
                        <Input
                          id="opening_hours"
                          value={seoSettings.local.opening_hours}
                          onChange={(e) =>
                            updateSeoSetting(
                              "local",
                              "opening_hours",
                              e.target.value,
                            )
                          }
                          placeholder="Thứ 2 - Chủ nhật: 8:00 - 22:00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service_areas">Service Areas</Label>
                        <Input
                          id="service_areas"
                          value={
                            Array.isArray(seoSettings.local.service_areas)
                              ? seoSettings.local.service_areas.join(", ")
                              : seoSettings.local.service_areas
                          }
                          onChange={(e) =>
                            updateSeoSetting(
                              "local",
                              "service_areas",
                              e.target.value
                                .split(",")
                                .map((area) => area.trim()),
                            )
                          }
                          placeholder="Hà Nội, TP.HCM, Đà Nẵng"
                        />
                        <p className="text-sm text-muted-foreground">
                          Ngăn cách bằng dấu phẩy
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="review_schema"
                          checked={seoSettings.local.enable_review_schema}
                          onCheckedChange={(checked) =>
                            updateSeoSetting(
                              "local",
                              "enable_review_schema",
                              checked,
                            )
                          }
                        />
                        <Label htmlFor="review_schema">
                          Enable Review Schema
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cài đặt chung
              </CardTitle>
              <p className="text-sm text-gray-600">
                Các thiết lập cơ bản cho website
              </p>
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

              <div>
                <Label htmlFor="site_description">Mô tả website</Label>
                <Textarea
                  id="site_description"
                  value={settings.general.site_description}
                  onChange={(e) =>
                    handleInputChange(
                      "general",
                      "site_description",
                      e.target.value,
                    )
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_phone">Số điện thoại</Label>
                  <Input
                    id="contact_phone"
                    value={settings.general.contact_phone}
                    onChange={(e) =>
                      handleInputChange(
                        "general",
                        "contact_phone",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Múi giờ</Label>
                  <Input
                    id="timezone"
                    value={settings.general.timezone}
                    onChange={(e) =>
                      handleInputChange("general", "timezone", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Settings */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Cài đặt cửa hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="store_enabled">Kích hoạt cửa hàng</Label>
                  <p className="text-sm text-gray-500">
                    Bật/tắt chức năng mua hàng
                  </p>
                </div>
                <Switch
                  id="store_enabled"
                  checked={settings.store.store_enabled}
                  onCheckedChange={(checked) =>
                    handleInputChange("store", "store_enabled", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow_guest_checkout">
                    Cho phép thanh toán không cần đăng ký
                  </Label>
                  <p className="text-sm text-gray-500">
                    Khách hàng có thể mua hàng mà không cần tài khoản
                  </p>
                </div>
                <Switch
                  id="allow_guest_checkout"
                  checked={settings.store.allow_guest_checkout}
                  onCheckedChange={(checked) =>
                    handleInputChange("store", "allow_guest_checkout", checked)
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_order_amount">
                    Số tiền đơn hàng tối thiểu
                  </Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    value={settings.store.min_order_amount}
                    onChange={(e) =>
                      handleInputChange(
                        "store",
                        "min_order_amount",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="max_order_amount">
                    Số tiền đơn hàng tối đa
                  </Label>
                  <Input
                    id="max_order_amount"
                    type="number"
                    value={settings.store.max_order_amount}
                    onChange={(e) =>
                      handleInputChange(
                        "store",
                        "max_order_amount",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Vận chuyển
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="free_shipping_threshold">
                    Miễn phí vận chuyển từ
                  </Label>
                  <Input
                    id="free_shipping_threshold"
                    type="number"
                    value={settings.shipping.free_shipping_threshold}
                    onChange={(e) =>
                      handleInputChange(
                        "shipping",
                        "free_shipping_threshold",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="default_shipping_cost">
                    Phí vận chuyển mặc định
                  </Label>
                  <Input
                    id="default_shipping_cost"
                    type="number"
                    value={settings.shipping.default_shipping_cost}
                    onChange={(e) =>
                      handleInputChange(
                        "shipping",
                        "default_shipping_cost",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="same_day_delivery">Giao hàng trong ngày</Label>
                <Switch
                  id="same_day_delivery"
                  checked={settings.shipping.same_day_delivery}
                  onCheckedChange={(checked) =>
                    handleInputChange("shipping", "same_day_delivery", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="international_shipping">
                  Giao hàng quốc tế
                </Label>
                <Switch
                  id="international_shipping"
                  checked={settings.shipping.international_shipping}
                  onCheckedChange={(checked) =>
                    handleInputChange(
                      "shipping",
                      "international_shipping",
                      checked,
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Phương thức thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cod_enabled">
                    Thanh toán khi nhận hàng (COD)
                  </Label>
                  <Switch
                    id="cod_enabled"
                    checked={settings.payment.cod_enabled}
                    onCheckedChange={(checked) =>
                      handleInputChange("payment", "cod_enabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="bank_transfer_enabled">
                    Chuyển khoản ngân hàng
                  </Label>
                  <Switch
                    id="bank_transfer_enabled"
                    checked={settings.payment.bank_transfer_enabled}
                    onCheckedChange={(checked) =>
                      handleInputChange(
                        "payment",
                        "bank_transfer_enabled",
                        checked,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="vnpay_enabled">VNPay</Label>
                  <Switch
                    id="vnpay_enabled"
                    checked={settings.payment.vnpay_enabled}
                    onCheckedChange={(checked) =>
                      handleInputChange("payment", "vnpay_enabled", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Cài đặt Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={settings.email.smtp_host}
                    onChange={(e) =>
                      handleInputChange("email", "smtp_host", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.email.smtp_port}
                    onChange={(e) =>
                      handleInputChange(
                        "email",
                        "smtp_port",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from_email">Email gửi</Label>
                  <Input
                    id="from_email"
                    value={settings.email.from_email}
                    onChange={(e) =>
                      handleInputChange("email", "from_email", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="from_name">Tên người gửi</Label>
                  <Input
                    id="from_name"
                    value={settings.email.from_name}
                    onChange={(e) =>
                      handleInputChange("email", "from_name", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email_notifications">
                  Kích hoạt thông báo email
                </Label>
                <Switch
                  id="email_notifications"
                  checked={settings.email.email_notifications}
                  onCheckedChange={(checked) =>
                    handleInputChange("email", "email_notifications", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Bảo mật
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable_2fa">Xác thực 2 bước</Label>
                  <p className="text-sm text-gray-500">
                    Tăng cường bảo mật tài khoản
                  </p>
                </div>
                <Switch
                  id="enable_2fa"
                  checked={settings.security.enable_2fa}
                  onCheckedChange={(checked) =>
                    handleInputChange("security", "enable_2fa", checked)
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password_min_length">
                    Độ dài mật khẩu tối thiểu
                  </Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={settings.security.password_min_length}
                    onChange={(e) =>
                      handleInputChange(
                        "security",
                        "password_min_length",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="session_timeout">
                    Thời gian hết hạn phiên (phút)
                  </Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) =>
                      handleInputChange(
                        "security",
                        "session_timeout",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Thông báo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="order_notifications">
                    Thông báo đơn hàng
                  </Label>
                  <Switch
                    id="order_notifications"
                    checked={settings.notifications.order_notifications}
                    onCheckedChange={(checked) =>
                      handleInputChange(
                        "notifications",
                        "order_notifications",
                        checked,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="low_stock_alerts">Cảnh báo hết hàng</Label>
                  <Switch
                    id="low_stock_alerts"
                    checked={settings.notifications.low_stock_alerts}
                    onCheckedChange={(checked) =>
                      handleInputChange(
                        "notifications",
                        "low_stock_alerts",
                        checked,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="user_registration_alerts">
                    Thông báo đăng ký người dùng
                  </Label>
                  <Switch
                    id="user_registration_alerts"
                    checked={settings.notifications.user_registration_alerts}
                    onCheckedChange={(checked) =>
                      handleInputChange(
                        "notifications",
                        "user_registration_alerts",
                        checked,
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
