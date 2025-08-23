"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Share2 } from "lucide-react";

interface OpenGraphImagePreviewProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  url?: string;
}

export default function OpenGraphImagePreview({
  title = "Page Title",
  description = "Page description goes here...",
  imageUrl = "/placeholder.svg",
  siteName = "Website",
  url = "https://example.com",
}: OpenGraphImagePreviewProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          <CardTitle className="text-sm">Social Media Preview</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Facebook/LinkedIn Style Preview */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="aspect-[1.91/1] bg-gray-100 relative overflow-hidden">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            )}
          </div>
          <div className="p-3 space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Globe className="w-3 h-3" />
              <span>{new URL(url).hostname}</span>
            </div>
            <h3 className="font-semibold text-sm line-clamp-2 text-gray-900">
              {title}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
          </div>
        </div>

        {/* Twitter Style Preview */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Globe className="w-3 h-3" />
              <span>{siteName}</span>
            </div>
            <h3 className="font-semibold text-sm line-clamp-1 text-gray-900">
              {title}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
          </div>
          {imageUrl && (
            <div className="aspect-[2/1] bg-gray-100 relative overflow-hidden">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            Facebook
          </Badge>
          <Badge variant="outline" className="text-xs">
            Twitter
          </Badge>
          <Badge variant="outline" className="text-xs">
            LinkedIn
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
