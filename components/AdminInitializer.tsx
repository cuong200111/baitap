"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Database,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { API_DOMAIN } from "@/lib/api-helpers";

interface InitStatus {
  seoSettings: boolean;
  siteSettings: boolean;
  initialized: boolean;
}

export default function AdminInitializer() {
  const [status, setStatus] = useState<InitStatus>({
    seoSettings: false,
    siteSettings: false,
    initialized: false,
  });
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    checkInitStatus();
  }, []);

  const checkInitStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Check SEO settings
      const seoResponse = await fetch(`${API_DOMAIN}/api/admin/seo-settings`, {
        headers,
      });

      // Check site settings
      const settingsResponse = await fetch(`${API_DOMAIN}/api/admin/settings`, {
        headers,
      });

      const seoData = seoResponse.ok ? await seoResponse.json() : null;
      const settingsData = settingsResponse.ok
        ? await settingsResponse.json()
        : null;

      const newStatus = {
        seoSettings:
          seoData?.success &&
          seoData?.data &&
          Object.keys(seoData.data).length > 0,
        siteSettings:
          settingsData?.success &&
          settingsData?.data &&
          Object.keys(settingsData.data).length > 0,
        initialized: false,
      };

      newStatus.initialized = newStatus.seoSettings && newStatus.siteSettings;
      setStatus(newStatus);
    } catch (error) {
      console.error("Failed to check init status:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSettings = async () => {
    try {
      setInitializing(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Vui lòng đăng nhập để khởi tạo cài đặt");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Initialize default settings
      const initResponse = await fetch(
        `${API_DOMAIN}/api/init/default-settings`,
        {
          method: "POST",
          headers,
        },
      );

      const initData = await initResponse.json();

      if (initData.success) {
        toast.success("Đã khởi tạo cài đặt mặc định thành công!");
        await checkInitStatus(); // Recheck status
      } else {
        toast.error("Có lỗi xảy ra khi khởi tạo cài đặt");
      }
    } catch (error) {
      console.error("Failed to initialize settings:", error);
      toast.error("Có lỗi xảy ra khi khởi tạo cài đặt");
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Đang kiểm tra trạng thái hệ thống...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status.initialized) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Hệ thống đã được khởi tạo!</strong> Tất cả cài đặt cơ bản đã
          sẵn sàng.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <Settings className="h-5 w-5" />
          Khởi tạo hệ thống admin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Hệ thống cần được khởi tạo với cài đặt mặc định để hoạt động đúng
            cách.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Cài đặt SEO</span>
            </div>
            <Badge variant={status.seoSettings ? "default" : "secondary"}>
              {status.seoSettings ? "Đã có" : "Chưa có"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Cài đặt hệ thống</span>
            </div>
            <Badge variant={status.siteSettings ? "default" : "secondary"}>
              {status.siteSettings ? "Đã có" : "Chưa có"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4">
          <Button
            onClick={initializeSettings}
            disabled={initializing}
            className="flex-1"
          >
            {initializing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang khởi tạo...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Khởi tạo cài đặt mặc định
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={checkInitStatus}
            disabled={loading}
          >
            Kiểm tra lại
          </Button>
        </div>

        <div className="text-xs text-gray-500 pt-2">
          Thao tác này sẽ tạo các cài đặt SEO và hệ thống mặc định cần thiết cho
          HACOM.
        </div>
      </CardContent>
    </Card>
  );
}
