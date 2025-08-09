"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export default function SeoAdminPage() {
  const [settings, setSettings] = useState<SeoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadSeoSettings();
  }, []);

  const loadSeoSettings = async () => {
    try {
      const response = await fetch('/api/seo/settings');
      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
        calculateSeoScore(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error loading SEO settings:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải cài đặt SEO",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const saveSeoSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/seo-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Thành công",
          description: "Đã lưu cài đặt SEO thành công",
        });
        calculateSeoScore(settings);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt SEO",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category: keyof SeoSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải cài đặt SEO...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Không thể tải cài đặt SEO. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt SEO</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý tất cả các thiết lập SEO cho website
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Điểm SEO</p>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${
                seoScore >= 80 ? 'text-green-600' : 
                seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {seoScore}%
              </div>
              {seoScore >= 80 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
          </div>
          <Button onClick={saveSeoSettings} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </Button>
        </div>
      </div>

      {/* SEO Score Alert */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          {seoScore >= 80 ? (
            "Tuyệt vời! Cài đặt SEO của bạn đã được tối ưu hóa tốt."
          ) : seoScore >= 60 ? (
            "Cài đặt SEO khá tốt, nhưng vẫn có thể cải thiện thêm."
          ) : (
            "Cài đặt SEO cần được cải thiện để đạt hiệu quả tối ưu."
          )}
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
                Các thiết lập cơ bản để tối ưu hóa website cho công cụ tìm kiếm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Tên website (SEO)</Label>
                  <Input
                    id="site_name"
                    value={settings.general.site_name}
                    onChange={(e) => updateSetting('general', 'site_name', e.target.value)}
                    placeholder="ZoxVN- Máy tính, Laptop"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_url">URL chính của website</Label>
                  <Input
                    id="site_url"
                    value={settings.general.site_url}
                    onChange={(e) => updateSetting('general', 'site_url', e.target.value)}
                    placeholder="https://hacom.vns"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_description">Mô tả website (Meta Description)</Label>
                <Textarea
                  id="site_description"
                  value={settings.general.site_description}
                  onChange={(e) => updateSetting('general', 'site_description', e.target.value)}
                  placeholder="HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính..."
                  rows={3}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{settings.general.site_description.length}/160 ký tự</span>
                  <Badge variant={settings.general.site_description.length <= 160 ? "default" : "destructive"}>
                    {settings.general.site_description.length <= 160 ? "Tốt" : "Quá dài"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_keywords">Từ khóa chính (Keywords)</Label>
                <Input
                  id="site_keywords"
                  value={settings.general.site_keywords}
                  onChange={(e) => updateSetting('general', 'site_keywords', e.target.value)}
                  placeholder="máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_meta"
                  checked={settings.general.auto_generate_meta_description}
                  onCheckedChange={(checked) => updateSetting('general', 'auto_generate_meta_description', checked)}
                />
                <Label htmlFor="auto_meta">Tự động tạo Meta Description</Label>
                <Badge variant="secondary">Khuyến nghị</Badge>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Meta Title Templates</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default_title">Default Meta Title Pattern</Label>
                    <Input
                      id="default_title"
                      value={settings.general.default_meta_title_pattern}
                      onChange={(e) => updateSetting('general', 'default_meta_title_pattern', e.target.value)}
                      placeholder="{title} | HACOM"
                    />
                    <p className="text-sm text-muted-foreground">Variables: {'{title}'}, {'{sitename}'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product_title">Product Meta Title Pattern</Label>
                    <Input
                      id="product_title"
                      value={settings.general.product_meta_title_pattern}
                      onChange={(e) => updateSetting('general', 'product_meta_title_pattern', e.target.value)}
                      placeholder="{product_name} - {category} | HACOM"
                    />
                    <p className="text-sm text-muted-foreground">Variables: {'{product_name}'}, {'{category}'}, {'{price}'}, {'{sku}'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category_title">Category Meta Title Pattern</Label>
                    <Input
                      id="category_title"
                      value={settings.general.category_meta_title_pattern}
                      onChange={(e) => updateSetting('general', 'category_meta_title_pattern', e.target.value)}
                      placeholder="{category_name} - {description} | HACOM"
                    />
                    <p className="text-sm text-muted-foreground">Variables: {'{category_name}'}, {'{description}'}, {'{count}'}</p>
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
                  checked={settings.analytics.enable_analytics}
                  onCheckedChange={(checked) => updateSetting('analytics', 'enable_analytics', checked)}
                />
                <Label htmlFor="enable_analytics">Kích hoạt Analytics</Label>
                <Badge variant="secondary">Bật/tắt tất cả các công cụ theo dõi</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ga_id">Google Analytics 4 ID</Label>
                  <Input
                    id="ga_id"
                    value={settings.analytics.google_analytics_id}
                    onChange={(e) => updateSetting('analytics', 'google_analytics_id', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gtm_id">Google Tag Manager ID</Label>
                  <Input
                    id="gtm_id"
                    value={settings.analytics.google_tag_manager_id}
                    onChange={(e) => updateSetting('analytics', 'google_tag_manager_id', e.target.value)}
                    placeholder="GTM-XXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gsc_verification">Google Search Console</Label>
                  <Input
                    id="gsc_verification"
                    value={settings.analytics.google_search_console_verification}
                    onChange={(e) => updateSetting('analytics', 'google_search_console_verification', e.target.value)}
                    placeholder="Mã xác thực GSC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb_pixel">Facebook Pixel ID</Label>
                  <Input
                    id="fb_pixel"
                    value={settings.analytics.facebook_pixel_id}
                    onChange={(e) => updateSetting('analytics', 'facebook_pixel_id', e.target.value)}
                    placeholder="1234567890123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bing_verification">Bing Webmaster Verification</Label>
                  <Input
                    id="bing_verification"
                    value={settings.analytics.bing_webmaster_verification}
                    onChange={(e) => updateSetting('analytics', 'bing_webmaster_verification', e.target.value)}
                    placeholder="Mã xác thực Bing"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotjar_id">Hotjar ID</Label>
                  <Input
                    id="hotjar_id"
                    value={settings.analytics.hotjar_id}
                    onChange={(e) => updateSetting('analytics', 'hotjar_id', e.target.value)}
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
                    value={settings.social.facebook_app_id}
                    onChange={(e) => updateSetting('social', 'facebook_app_id', e.target.value)}
                    placeholder="facd"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_username">Twitter Username</Label>
                  <Input
                    id="twitter_username"
                    value={settings.social.twitter_site}
                    onChange={(e) => updateSetting('social', 'twitter_site', e.target.value)}
                    placeholder="@hacom_vn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    value={settings.social.linkedin_url}
                    onChange={(e) => updateSetting('social', 'linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/company/hacom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube_url">YouTube URL</Label>
                  <Input
                    id="youtube_url"
                    value={settings.social.youtube_url}
                    onChange={(e) => updateSetting('social', 'youtube_url', e.target.value)}
                    placeholder="https://youtube.com/c/hacom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram URL</Label>
                  <Input
                    id="instagram_url"
                    value={settings.social.instagram_url}
                    onChange={(e) => updateSetting('social', 'instagram_url', e.target.value)}
                    placeholder="https://instagram.com/hacom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok_url">TikTok URL</Label>
                  <Input
                    id="tiktok_url"
                    value={settings.social.tiktok_url}
                    onChange={(e) => updateSetting('social', 'tiktok_url', e.target.value)}
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
                    value={settings.schema.organization_name}
                    onChange={(e) => updateSetting('schema', 'organization_name', e.target.value)}
                    placeholder="HACOM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org_phone">Số điện thoại</Label>
                  <Input
                    id="org_phone"
                    value={settings.schema.organization_phone}
                    onChange={(e) => updateSetting('schema', 'organization_phone', e.target.value)}
                    placeholder="1900 19032"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_address">Địa chỉ</Label>
                <Input
                  id="org_address"
                  value={settings.schema.organization_address}
                  onChange={(e) => updateSetting('schema', 'organization_address', e.target.value)}
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
                    value={settings.schema.latitude}
                    onChange={(e) => updateSetting('schema', 'latitude', parseFloat(e.target.value))}
                    placeholder="21.0285"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.0001"
                    value={settings.schema.longitude}
                    onChange={(e) => updateSetting('schema', 'longitude', parseFloat(e.target.value))}
                    placeholder="105.8542"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="org_schema"
                    checked={settings.schema.enable_organization_schema}
                    onCheckedChange={(checked) => updateSetting('schema', 'enable_organization_schema', checked)}
                  />
                  <Label htmlFor="org_schema">Organization Schema</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="product_schema"
                    checked={settings.schema.enable_product_schema}
                    onCheckedChange={(checked) => updateSetting('schema', 'enable_product_schema', checked)}
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
                <h4 className="text-lg font-semibold">Sitemap & Robots</h4>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_sitemap"
                    checked={settings.technical.enable_sitemap}
                    onCheckedChange={(checked) => updateSetting('technical', 'enable_sitemap', checked)}
                  />
                  <Label htmlFor="enable_sitemap">Bật Sitemap</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sitemap_images"
                    checked={settings.technical.sitemap_include_images}
                    onCheckedChange={(checked) => updateSetting('technical', 'sitemap_include_images', checked)}
                  />
                  <Label htmlFor="sitemap_images">Bao gồm hình ảnh</Label>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Sitemap và Robots.txt sẽ được tạo tự động bởi next-sitemap.
                  </AlertDescription>
                </Alert>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Compression & Minification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="gzip_compression"
                      checked={settings.technical.enable_compression}
                      onCheckedChange={(checked) => updateSetting('technical', 'enable_compression', checked)}
                    />
                    <Label htmlFor="gzip_compression">GZIP Compression</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="minify_html"
                      checked={settings.technical.minify_html}
                      onCheckedChange={(checked) => updateSetting('technical', 'minify_html', checked)}
                    />
                    <Label htmlFor="minify_html">Minify HTML</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="lazy_load"
                      checked={settings.technical.lazy_load_images}
                      onCheckedChange={(checked) => updateSetting('technical', 'lazy_load_images', checked)}
                    />
                    <Label htmlFor="lazy_load">Lazy Load Images</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="robots_custom">Custom Robots.txt Content</Label>
                <Textarea
                  id="robots_custom"
                  value={settings.technical.robots_txt_custom}
                  onChange={(e) => updateSetting('technical', 'robots_txt_custom', e.target.value)}
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
                <h4 className="text-lg font-semibold">Auto SEO Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_seo"
                      checked={settings.content.enable_auto_seo}
                      onCheckedChange={(checked) => updateSetting('content', 'enable_auto_seo', checked)}
                    />
                    <Label htmlFor="auto_seo">Auto SEO</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="h1_optimization"
                      checked={settings.content.h1_optimization}
                      onCheckedChange={(checked) => updateSetting('content', 'h1_optimization', checked)}
                    />
                    <Label htmlFor="h1_optimization">H1 Optimization</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="internal_linking"
                      checked={settings.content.internal_linking}
                      onCheckedChange={(checked) => updateSetting('content', 'internal_linking', checked)}
                    />
                    <Label htmlFor="internal_linking">Auto Internal Linking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="image_alt"
                      checked={settings.content.image_alt_optimization}
                      onCheckedChange={(checked) => updateSetting('content', 'image_alt_optimization', checked)}
                    />
                    <Label htmlFor="image_alt">Image Alt Optimization</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Content Quality Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="keyword_density">Target Keyword Density (%)</Label>
                    <Input
                      id="keyword_density"
                      type="number"
                      step="0.1"
                      value={settings.content.keyword_density_target}
                      onChange={(e) => updateSetting('content', 'keyword_density_target', parseFloat(e.target.value))}
                      placeholder="2.5"
                    />
                    <p className="text-sm text-muted-foreground">Khuyến nghị: 1-3% cho tối ưu SEO</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_words">Minimum Content Words</Label>
                    <Input
                      id="min_words"
                      type="number"
                      value={settings.content.content_min_words}
                      onChange={(e) => updateSetting('content', 'content_min_words', parseInt(e.target.value))}
                      placeholder="300"
                    />
                    <p className="text-sm text-muted-foreground">Khuyến nghị tối thiểu 300 từ cho mỗi trang</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="faq_schema"
                    checked={settings.content.enable_faq_schema}
                    onCheckedChange={(checked) => updateSetting('content', 'enable_faq_schema', checked)}
                  />
                  <Label htmlFor="faq_schema">FAQ Schema</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="article_schema"
                    checked={settings.content.enable_article_schema}
                    onCheckedChange={(checked) => updateSetting('content', 'enable_article_schema', checked)}
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
                <h4 className="text-lg font-semibold">Image & Resource Optimization</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="optimize_images"
                      checked={settings.performance.optimize_images}
                      onCheckedChange={(checked) => updateSetting('performance', 'optimize_images', checked)}
                    />
                    <Label htmlFor="optimize_images">Optimize Images</Label>
                    <Badge variant="secondary">WebP conversion, compression</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="critical_css"
                      checked={settings.performance.enable_critical_css}
                      onCheckedChange={(checked) => updateSetting('performance', 'enable_critical_css', checked)}
                    />
                    <Label htmlFor="critical_css">Critical CSS</Label>
                    <Badge variant="secondary">Inline critical styles</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="defer_js"
                      checked={settings.performance.defer_non_critical_js}
                      onCheckedChange={(checked) => updateSetting('performance', 'defer_non_critical_js', checked)}
                    />
                    <Label htmlFor="defer_js">Defer Non-Critical JS</Label>
                    <Badge variant="secondary">Improve loading speed</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="preload_resources"
                      checked={settings.performance.preload_critical_resources}
                      onCheckedChange={(checked) => updateSetting('performance', 'preload_critical_resources', checked)}
                    />
                    <Label htmlFor="preload_resources">Preload Critical Resources</Label>
                    <Badge variant="secondary">Fonts, CSS, key images</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">CDN & Caching</h4>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_cdn"
                    checked={settings.performance.enable_cdn}
                    onCheckedChange={(checked) => updateSetting('performance', 'enable_cdn', checked)}
                  />
                  <Label htmlFor="enable_cdn">Enable CDN</Label>
                  <Badge variant="secondary">Content delivery network</Badge>
                </div>
                
                {settings.performance.enable_cdn && (
                  <div className="space-y-2">
                    <Label htmlFor="cdn_url">CDN URL</Label>
                    <Input
                      id="cdn_url"
                      value={settings.performance.cdn_url}
                      onChange={(e) => updateSetting('performance', 'cdn_url', e.target.value)}
                      placeholder="https://cdn.example.com"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lazy_threshold">Lazy Load Threshold (px)</Label>
                <Input
                  id="lazy_threshold"
                  type="number"
                  value={settings.performance.lazy_load_threshold}
                  onChange={(e) => updateSetting('performance', 'lazy_load_threshold', parseInt(e.target.value))}
                  placeholder="200"
                />
                <p className="text-sm text-muted-foreground">Distance before loading images (default: 200px)</p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Core Web Vitals Impact:</strong> Các tùy chọn này trực tiếp ảnh hưởng đến LCP, FID, và CLS - những metrics quan trọng cho SEO. 
                  Khuyến nghị bật tất cả để đạt điểm hiệu suất cao nhất.
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
                  checked={settings.local.enable_local_seo}
                  onCheckedChange={(checked) => updateSetting('local', 'enable_local_seo', checked)}
                />
                <Label htmlFor="enable_local_seo">Enable Local SEO</Label>
                <Badge variant="secondary">Bật các tính n��ng tối ưu cho tìm kiếm địa phương</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="business_category">Business Category</Label>
                  <Input
                    id="business_category"
                    value={settings.local.business_category}
                    onChange={(e) => updateSetting('local', 'business_category', e.target.value)}
                    placeholder="Electronics Store"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gmb_id">Google My Business ID</Label>
                  <Input
                    id="gmb_id"
                    value={settings.local.google_my_business_id}
                    onChange={(e) => updateSetting('local', 'google_my_business_id', e.target.value)}
                    placeholder="Google My Business ID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening_hours">Opening Hours</Label>
                <Input
                  id="opening_hours"
                  value={settings.local.opening_hours}
                  onChange={(e) => updateSetting('local', 'opening_hours', e.target.value)}
                  placeholder="Thứ 2 - Chủ nhật: 8:00 - 22:00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_areas">Service Areas</Label>
                <Input
                  id="service_areas"
                  value={Array.isArray(settings.local.service_areas) ? settings.local.service_areas.join(', ') : settings.local.service_areas}
                  onChange={(e) => updateSetting('local', 'service_areas', e.target.value.split(',').map(area => area.trim()))}
                  placeholder="Hà Nội, TP.HCM, Đà Nẵng"
                />
                <p className="text-sm text-muted-foreground">Ngăn cách bằng dấu phẩy</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="review_schema"
                  checked={settings.local.enable_review_schema}
                  onCheckedChange={(checked) => updateSetting('local', 'enable_review_schema', checked)}
                />
                <Label htmlFor="review_schema">Enable Review Schema</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
