"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import SeoHead from "@/components/SeoHead";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";

interface SeoContextData {
  seoSettings: any;
  updateSeoData: (data: any) => void;
  currentSeoData: any;
  isLoading: boolean;
}

const SeoContext = createContext<SeoContextData | null>(null);

export function useSeo() {
  const context = useContext(SeoContext);
  if (!context) {
    throw new Error("useSeo must be used within a SeoProvider");
  }
  return context;
}

interface SeoProviderProps {
  children: React.ReactNode;
}

export default function SeoProvider({ children }: SeoProviderProps) {
  const [seoSettings, setSeoSettings] = useState(null);
  const [currentSeoData, setCurrentSeoData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSeoSettings();
  }, []);

  const loadSeoSettings = async () => {
    try {
      // Only load settings on client side
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      // Try to fetch from backend server (port 4000)
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${backendUrl}/api/seo/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSeoSettings(result.data);
          return;
        }
      }

      // If backend call fails, throw error to use fallback
      throw new Error("Backend not available");
    } catch (error) {
      console.warn(
        "SEO settings not available from backend, using defaults:",
        error.message,
      );
      // Set default settings if API fails
      setSeoSettings({
        general: {
          site_name: "HACOM - Máy tính, Laptop, Gaming Gear",
          site_url: "https://hacom.vn",
          site_description:
            "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
          site_keywords:
            "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM",
          default_meta_title_pattern: "{title} | HACOM",
          product_meta_title_pattern: "{product_name} - {category} | HACOM",
          category_meta_title_pattern:
            "{category_name} - {description} | HACOM",
          auto_generate_meta_description: true,
          meta_description_length: 160,
        },
        social: {
          facebook_app_id: "",
          twitter_site: "@hacom_vn",
          default_og_image: "/og-image.jpg",
        },
        analytics: {
          google_analytics_id: "",
          google_tag_manager_id: "",
          enable_analytics: false,
        },
        schema: {
          organization_name: "HACOM",
          organization_logo: "/logo.png",
          organization_address: "Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội",
          organization_phone: "1900 1903",
          organization_email: "contact@hacom.vn",
          business_type: "ElectronicsStore",
          business_hours: "Mo-Su 08:00-22:00",
          latitude: 21.0285,
          longitude: 105.8542,
          enable_organization_schema: true,
          enable_breadcrumb_schema: true,
          enable_product_schema: true,
          enable_review_schema: true,
        },
        technical: {
          lazy_load_images: true,
          enable_sitemap: true,
        },
        performance: {
          optimize_images: true,
          enable_critical_css: true,
          defer_non_critical_js: true,
          preload_critical_resources: true,
          lazy_load_threshold: 200,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSeoData = (data: any) => {
    setCurrentSeoData(data);
  };

  const contextValue: SeoContextData = {
    seoSettings,
    updateSeoData,
    currentSeoData,
    isLoading,
  };

  return (
    <SeoContext.Provider value={contextValue}>
      <PerformanceOptimizer>
        <SeoHead data={currentSeoData} />
        {children}
      </PerformanceOptimizer>
    </SeoContext.Provider>
  );
}
