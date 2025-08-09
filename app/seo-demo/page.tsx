"use client";

import { useEffect } from 'react';
import { useSeo } from '@/components/providers/SeoProvider';
import { OptimizedImage } from '@/components/PerformanceOptimizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Globe, Zap, BarChart3 } from 'lucide-react';

export default function SeoDemo() {
  const { updateSeoData } = useSeo();

  useEffect(() => {
    // Update SEO data for this page
    updateSeoData({
      title: "SEO Demo - Hệ thống SEO hoàn chỉnh",
      description: "Trang demo giới thiệu hệ thống SEO tự động với analytics, schema.org, và tối ưu hóa hiệu suất. Tích hợp Google Analytics, Facebook Pixel và các công cụ SEO chuyên nghiệp.",
      keywords: "SEO demo, tối ưu hóa, analytics, schema.org, meta tags",
      pageType: "demo",
      ogType: "article",
      ogImage: "/images/seo-demo-og.jpg",
      breadcrumbs: [
        { name: "Trang chủ", url: "/" },
        { name: "SEO Demo", url: "/seo-demo" }
      ],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Hệ thống SEO hoàn chỉnh cho HACOM",
        "description": "Demo hệ thống SEO tự động với đầy đủ tính năng",
        "author": {
          "@type": "Organization",
          "name": "HACOM"
        },
        "publisher": {
          "@type": "Organization",
          "name": "HACOM",
          "logo": {
            "@type": "ImageObject",
            "url": "https://hacom.vn/logo.png"
          }
        },
        "datePublished": "2024-01-15T10:00:00+07:00",
        "dateModified": "2024-01-15T10:00:00+07:00",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "https://hacom.vn/seo-demo"
        }
      }
    });
  }, [updateSeoData]);

  const seoFeatures = [
    {
      icon: <Globe className="h-8 w-8 text-blue-600" />,
      title: "Meta Tags Tự Động",
      description: "Tự động tạo title, description, keywords và Open Graph tags",
      implemented: true
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      title: "Analytics Tích Hợp",
      description: "Google Analytics 4, GTM, Facebook Pixel, Hotjar",
      implemented: true
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-purple-600" />,
      title: "Schema.org Markup", 
      description: "Organization, Product, Breadcrumb, Review schemas",
      implemented: true
    },
    {
      icon: <Zap className="h-8 w-8 text-orange-600" />,
      title: "Performance Optimization",
      description: "Lazy loading, WebP images, critical CSS, defer JS",
      implemented: true
    }
  ];

  const technicalFeatures = [
    "Sitemap.xml tự động (main, products, categories, images, videos)",
    "Robots.txt động với custom rules",
    "Canonical URLs tự động",
    "Hreflang tags cho đa ngôn ngữ",
    "Core Web Vitals optimization",
    "Image optimization và lazy loading",
    "Critical CSS inlining",
    "Non-critical JS deferring",
    "Resource preloading",
    "SEO analytics và monitoring"
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Hệ thống SEO Hoàn chỉnh
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Demo hệ thống SEO tự động với đầy đủ tính năng theo yêu cầu của bạn. 
          Tích hợp analytics, schema.org, tối ưu hóa hiệu suất và quản lý SEO toàn diện.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {seoFeatures.map((feature, index) => (
          <Card key={index} className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-2">
                {feature.icon}
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {feature.description}
              </CardDescription>
              <Badge variant={feature.implemented ? "default" : "secondary"}>
                {feature.implemented ? "✅ Hoạt động" : "⏳ Đang phát triển"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SEO Categories Implemented */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Danh mục SEO đã triển khai (100% theo SQL)
          </CardTitle>
          <CardDescription>
            Tất cả 8 danh mục SEO từ bảng SQL của bạn đã được triển khai đầy đủ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "✅ General (Cơ bản)",
              "✅ Analytics (Phân tích)", 
              "✅ Social (Mạng xã hội)",
              "✅ Schema (Dữ liệu có cấu trúc)",
              "✅ Technical (Kỹ thuật)",
              "✅ Content (Nội dung)",
              "✅ Performance (Hiệu suất)",
              "✅ Local (Địa phương)"
            ].map((category, index) => (
              <Badge key={index} variant="default" className="justify-start">
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Features */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Tính năng kỹ thuật đã triển khai</CardTitle>
          <CardDescription>
            Các tính năng SEO kỹ thuật hoạt động tự động
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-2">
            {technicalFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Image with Optimization */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Optimized Image Component</CardTitle>
          <CardDescription>
            Hình ảnh được tối ưu tự động với WebP, lazy loading và responsive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Hình ảnh được tối ưu:</h4>
              <OptimizedImage
                src="/images/demo-product.jpg"
                alt="Demo sản phẩm laptop gaming HACOM"
                width={400}
                height={300}
                className="rounded-lg shadow-md"
                priority={false}
              />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Tính năng tối ưu:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Tự động chuyển đổi sang WebP
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Lazy loading thông minh
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Responsive images với srcSet
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Placeholder loading states
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Error handling và fallback
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live SEO Status */}
      <div className="mt-8 p-6 bg-green-50 rounded-lg border-l-4 border-green-500">
        <h3 className="font-semibold text-green-800 mb-2">
          🎉 Hệ thống SEO đang hoạt động!
        </h3>
        <p className="text-green-700">
          Trang này đang sử dụng hệ thống SEO hoàn chỉnh với meta tags, 
          schema.org markup, analytics tracking và performance optimization. 
          Kiểm tra View Source để xem các meta tags và structured data được tạo tự động.
        </p>
      </div>
    </div>
  );
}
