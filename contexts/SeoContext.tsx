"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { seoService, type SeoSettings } from '@/lib/seo-service';

interface SeoContextType {
  settings: SeoSettings | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const SeoContext = createContext<SeoContextType | undefined>(undefined);

export function SeoProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SeoSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const seoSettings = await seoService.loadSettings();
      setSettings(seoSettings);
    } catch (err) {
      console.error('Failed to load SEO settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load SEO settings');
      // Use fallback settings
      setSettings({
        general: {
          site_name: 'HACOM - Máy tính, Laptop',
          site_url: 'https://hacom.vn',
          site_description: 'HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.',
          site_keywords: 'máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM',
          site_logo: '/logo.png',
          site_favicon: '/favicon.ico',
          default_meta_title_pattern: '{title} | HACOM',
          auto_generate_meta_description: true,
          meta_description_length: 160,
        },
        social: {
          facebook_app_id: '',
          twitter_site: '@hacom_vn',
          default_og_image: '/og-image.jpg',
        },
        analytics: {
          google_analytics_id: '',
          google_tag_manager_id: '',
          google_search_console_verification: '',
          enable_analytics: true,
        },
        schema: {
          organization_name: 'HACOM',
          organization_logo: '/logo.png',
          organization_address: 'Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội',
          organization_phone: '1900 1903',
          organization_email: 'contact@hacom.vn',
          business_type: 'ElectronicsStore',
          enable_organization_schema: true,
          enable_product_schema: true,
        },
        technical: {
          enable_sitemap: true,
          enable_compression: true,
          enable_caching: true,
          lazy_load_images: true,
          sitemap_max_urls: 50000,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const reload = async () => {
    seoService.clearCache();
    await loadSettings();
  };

  return (
    <SeoContext.Provider value={{ settings, isLoading, error, reload }}>
      {children}
    </SeoContext.Provider>
  );
}

export function useSeo() {
  const context = useContext(SeoContext);
  if (context === undefined) {
    throw new Error('useSeo must be used within a SeoProvider');
  }
  return context;
}

// Convenient hooks for specific settings
export function useSiteName() {
  const { settings } = useSeo();
  return settings?.general?.site_name || 'HACOM - Máy tính, Laptop';
}

export function useOrganizationName() {
  const { settings } = useSeo();
  return settings?.schema?.organization_name || 'HACOM';
}

export function useContactInfo() {
  const { settings } = useSeo();
  return {
    phone: settings?.schema?.organization_phone || '1900 1903',
    email: settings?.schema?.organization_email || 'contact@hacom.vn',
    address: settings?.schema?.organization_address || 'Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội'
  };
}
