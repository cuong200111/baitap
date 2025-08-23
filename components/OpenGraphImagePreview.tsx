"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OpenGraphImagePreviewProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  className?: string;
}

const OpenGraphImagePreview: React.FC<OpenGraphImagePreviewProps> = ({
  title = "Tiêu đề trang web",
  description = "Mô tả trang web sẽ hiển thị khi chia sẻ trên mạng xã hội",
  imageUrl = "/placeholder.svg",
  siteName = "HACOM",
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-600">
          Xem trước khi chia sẻ trên mạng xã hội
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Image */}
          <div className="relative h-48 bg-gray-100">
            {!imageError && imageUrl ? (
              <img
                src={imageUrl}
                alt="Open Graph Preview"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-500 text-sm">Không có hình ảnh</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3 bg-white">
            <div className="text-xs text-gray-500 uppercase mb-1">
              {siteName}
            </div>
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
              {title}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenGraphImagePreview;
