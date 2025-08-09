"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import { toast } from "sonner";

interface OpenGraphPreviewProps {
  seoSettings: any;
}

export default function OpenGraphImagePreview({ seoSettings }: OpenGraphPreviewProps) {
  const [testUrl, setTestUrl] = useState("");
  const [pageType, setPageType] = useState("home");

  const getOpenGraphImage = (type: string) => {
    const baseUrl = seoSettings?.general?.site_url || "https://yourdomain.com";
    
    switch (type) {
      case "home":
        return seoSettings?.social?.home_og_image || seoSettings?.social?.default_og_image;
      case "product":
        return seoSettings?.social?.product_og_image || seoSettings?.social?.default_og_image;
      case "category":
        return seoSettings?.social?.category_og_image || seoSettings?.social?.default_og_image;
      case "login":
        return seoSettings?.social?.login_og_image || seoSettings?.social?.default_og_image;
      case "register":
        return seoSettings?.social?.register_og_image || seoSettings?.social?.default_og_image;
      default:
        return seoSettings?.social?.default_og_image;
    }
  };

  const generateMetaTags = (type: string) => {
    const ogImage = getOpenGraphImage(type);
    const fullImageUrl = ogImage?.startsWith("http") 
      ? ogImage 
      : `${seoSettings?.general?.site_url || "https://yourdomain.com"}${ogImage}`;

    return `<!-- Open Graph Meta Tags -->
<meta property="og:title" content="${seoSettings?.general?.site_name || "Website Name"} - ${type.charAt(0).toUpperCase() + type.slice(1)}" />
<meta property="og:description" content="${seoSettings?.general?.site_description || "Website description"}" />
<meta property="og:image" content="${fullImageUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${seoSettings?.general?.site_url || "https://yourdomain.com"}" />
<meta property="og:site_name" content="${seoSettings?.general?.site_name || "Website Name"}" />

<!-- Twitter Card Meta Tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="${seoSettings?.social?.twitter_site || "@username"}" />
<meta name="twitter:title" content="${seoSettings?.general?.site_name || "Website Name"} - ${type.charAt(0).toUpperCase() + type.slice(1)}" />
<meta name="twitter:description" content="${seoSettings?.general?.site_description || "Website description"}" />
<meta name="twitter:image" content="${fullImageUrl}" />

<!-- Facebook App ID -->
${seoSettings?.social?.facebook_app_id ? `<meta property="fb:app_id" content="${seoSettings.social.facebook_app_id}" />` : ""}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Meta tags đã được sao chép vào clipboard!");
  };

  const validateImageUrl = (url: string) => {
    if (!url) return { valid: false, message: "Chưa có URL hình ảnh" };
    if (!url.includes(".")) return { valid: false, message: "URL không hợp lệ" };
    return { valid: true, message: "URL hợp lệ" };
  };

  const testOnSocialPlatforms = (imageUrl: string) => {
    const fullUrl = imageUrl?.startsWith("http") 
      ? imageUrl 
      : `${seoSettings?.general?.site_url || "https://yourdomain.com"}${imageUrl}`;

    const testUrls = {
      facebook: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(fullUrl)}`,
      twitter: `https://cards-dev.twitter.com/validator`,
      linkedin: `https://www.linkedin.com/post-inspector/`,
    };

    return testUrls;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Open Graph Image Preview & Testing
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Xem trước và kiểm tra hình ảnh Open Graph cho các loại trang khác nhau
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Page Type Selection */}
        <Tabs defaultValue="home" onValueChange={setPageType}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="home">Trang chủ</TabsTrigger>
            <TabsTrigger value="product">Sản phẩm</TabsTrigger>
            <TabsTrigger value="category">Danh mục</TabsTrigger>
            <TabsTrigger value="login">Đăng nhập</TabsTrigger>
            <TabsTrigger value="register">Đăng ký</TabsTrigger>
          </TabsList>

          {/* Preview for each page type */}
          {["home", "product", "category", "login", "register"].map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Hình ảnh Open Graph hiện tại</h4>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {getOpenGraphImage(type) ? (
                      <div className="space-y-2">
                        <img
                          src={getOpenGraphImage(type)?.startsWith("http") 
                            ? getOpenGraphImage(type) 
                            : `${seoSettings?.general?.site_url || ""}${getOpenGraphImage(type)}`}
                          alt={`Open Graph preview for ${type}`}
                          className="w-full max-w-sm mx-auto rounded border"
                          style={{ aspectRatio: "1.91/1" }}
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                        <div className="text-sm text-center">
                          <Badge variant={validateImageUrl(getOpenGraphImage(type)).valid ? "default" : "destructive"}>
                            {validateImageUrl(getOpenGraphImage(type)).message}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Chưa có hình ảnh cho loại trang này</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta Tags */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Meta Tags tương ứng</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateMetaTags(type))}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Sao chép
                    </Button>
                  </div>
                  <div className="bg-black text-green-400 p-4 rounded text-xs font-mono overflow-auto max-h-64">
                    <pre>{generateMetaTags(type)}</pre>
                  </div>
                </div>
              </div>

              {/* Social Media Testing */}
              <div className="space-y-4">
                <h4 className="font-semibold">Kiểm tra trên mạng xã hội</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(testOnSocialPlatforms(getOpenGraphImage(type))).map(([platform, url]) => (
                    <Button
                      key={platform}
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => window.open(url, "_blank")}
                    >
                      {platform === "facebook" && <Facebook className="h-4 w-4" />}
                      {platform === "twitter" && <Twitter className="h-4 w-4" />}
                      {platform === "linkedin" && <Linkedin className="h-4 w-4" />}
                      Kiểm tra trên {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Khuyến nghị tối ưu cho {type}:</strong><br />
                  • Kích thước: 1200x630px (tỷ lệ 1.91:1)<br />
                  • Định dạng: JPG hoặc PNG<br />
                  • Dung lượng: Dưới 8MB<br />
                  • Nội dung: Rõ ràng, dễ đọc ngay cả khi thu nhỏ<br />
                  {type === "product" && "• Hiển thị sản phẩm chính, tên thương hiệu rõ ràng"}
                  {type === "category" && "• Thể hiện đặc trưng của danh mục sản phẩm"}
                  {type === "home" && "• Thể hiện thương hiệu và giá trị cốt lõi"}
                </AlertDescription>
              </Alert>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
