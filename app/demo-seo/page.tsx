"use client";

import { AppLayout } from "@/components/AppLayout";
import { AdminPageTitle } from "@/components/AdminPageTitle";
import { useAdminSeo } from "@/contexts/AdminSeoContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemoSeoPage() {
  const { settings, loading, error, getSiteName, getOrganizationName, getContactInfo } = useAdminSeo();

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi tải SEO settings</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const siteName = getSiteName();
  const organizationName = getOrganizationName();
  const contactInfo = getContactInfo();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <AdminPageTitle title="Demo Admin SEO Settings" />
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Site Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin Site</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium text-gray-600">Site Name:</dt>
                  <dd className="text-gray-900">{siteName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Site URL:</dt>
                  <dd className="text-gray-900">{settings?.general?.site_url}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Description:</dt>
                  <dd className="text-gray-900 text-sm">{settings?.general?.site_description}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Keywords:</dt>
                  <dd className="text-gray-900 text-sm">{settings?.general?.site_keywords}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin Tổ chức</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium text-gray-600">Tên tổ chức:</dt>
                  <dd className="text-gray-900">{organizationName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Phone:</dt>
                  <dd className="text-gray-900">{contactInfo.phone}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Email:</dt>
                  <dd className="text-gray-900">{contactInfo.email}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Address:</dt>
                  <dd className="text-gray-900 text-sm">{contactInfo.address}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Business Type:</dt>
                  <dd className="text-gray-900">{settings?.schema?.business_type}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Social</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium text-gray-600">Google Analytics:</dt>
                  <dd className="text-gray-900 font-mono text-sm">
                    {settings?.analytics?.google_analytics_id || 'Chưa cấu hình'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">GTM ID:</dt>
                  <dd className="text-gray-900 font-mono text-sm">
                    {settings?.analytics?.google_tag_manager_id || 'Chưa cấu hình'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Twitter Site:</dt>
                  <dd className="text-gray-900">{settings?.social?.twitter_site}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Facebook App ID:</dt>
                  <dd className="text-gray-900 font-mono text-sm">
                    {settings?.social?.facebook_app_id || 'Chưa cấu hình'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Analytics Enabled:</dt>
                  <dd className="text-gray-900">
                    {settings?.analytics?.enable_analytics ? 'Bật' : 'Tắt'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Technical Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt Kỹ thuật</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium text-gray-600">Sitemap:</dt>
                  <dd className="text-gray-900">
                    {settings?.technical?.enable_sitemap ? 'Bật' : 'Tắt'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Compression:</dt>
                  <dd className="text-gray-900">
                    {settings?.technical?.enable_compression ? 'Bật' : 'Tắt'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Caching:</dt>
                  <dd className="text-gray-900">
                    {settings?.technical?.enable_caching ? 'Bật' : 'Tắt'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Lazy Load Images:</dt>
                  <dd className="text-gray-900">
                    {settings?.technical?.lazy_load_images ? 'Bật' : 'Tắt'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Max Sitemap URLs:</dt>
                  <dd className="text-gray-900">{settings?.technical?.sitemap_max_urls}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Schema Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Schema Markup</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium text-gray-600">Organization Schema:</dt>
                  <dd className="text-gray-900">
                    {settings?.schema?.enable_organization_schema ? 'Bật' : 'Tắt'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Product Schema:</dt>
                  <dd className="text-gray-900">
                    {settings?.schema?.enable_product_schema ? 'Bật' : 'Tắt'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Breadcrumb Schema:</dt>
                  <dd className="text-gray-900">
                    {settings?.schema?.enable_breadcrumb_schema ? 'Bật' : 'Tắt'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Review Schema:</dt>
                  <dd className="text-gray-900">
                    {settings?.schema?.enable_review_schema ? 'Bật' : 'Tắt'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Business Hours:</dt>
                  <dd className="text-gray-900">{settings?.schema?.business_hours}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Title Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Title Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium text-gray-600">Default Pattern:</dt>
                  <dd className="text-gray-900 font-mono text-sm">
                    {settings?.general?.default_meta_title_pattern}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Product Pattern:</dt>
                  <dd className="text-gray-900 font-mono text-sm">
                    {settings?.general?.product_meta_title_pattern}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Category Pattern:</dt>
                  <dd className="text-gray-900 font-mono text-sm">
                    {settings?.general?.category_meta_title_pattern}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Auto Meta Description:</dt>
                  <dd className="text-gray-900">
                    {settings?.general?.auto_generate_meta_description ? 'Bật' : 'Tắt'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Meta Description Length:</dt>
                  <dd className="text-gray-900">{settings?.general?.meta_description_length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📝 Hướng dẫn sử dụng</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Tất cả dữ liệu trên được lấy từ API <code className="bg-blue-200 px-1 rounded">/admin/seo-settings</code></li>
            <li>• Title và metadata được tự động generate theo pattern từ admin</li>
            <li>• Hook <code className="bg-blue-200 px-1 rounded">useAdminSeo()</code> cung cấp real-time data</li>
            <li>• Component <code className="bg-blue-200 px-1 rounded">AdminPageTitle</code> sử dụng site name từ admin</li>
            <li>• Contact info và organization data được sync từ database</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
