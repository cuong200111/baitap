"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import SeoHead from '@/components/SeoHead';
import PerformanceOptimizer from '@/components/PerformanceOptimizer';

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
    throw new Error('useSeo must be used within a SeoProvider');
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
      const response = await fetch('/api/seo/settings');
      const result = await response.json();
      
      if (result.success) {
        setSeoSettings(result.data);
      }
    } catch (error) {
      console.error('Error loading SEO settings:', error);
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
