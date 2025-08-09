"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSeoData, type AdminSeoSettings, type SeoMetadata } from '@/hooks/useSeoData';

interface AdminSeoContextType {
  settings: AdminSeoSettings | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  generateSeoMetadata: (options: {
    title?: string;
    description?: string;
    keywords?: string;
    path?: string;
    type?: 'page' | 'product' | 'category';
    image?: string;
    productData?: any;
    categoryData?: any;
  }) => SeoMetadata;
  getSiteName: () => string;
  getOrganizationName: () => string;
  getContactInfo: () => {
    phone: string;
    email: string;
    address: string;
  };
}

const AdminSeoContext = createContext<AdminSeoContextType | undefined>(undefined);

export function AdminSeoProvider({ children }: { children: React.ReactNode }) {
  const {
    settings,
    loading,
    error,
    reload,
    generateSeoMetadata,
    getSiteName,
    getOrganizationName,
    getContactInfo,
  } = useSeoData();

  return (
    <AdminSeoContext.Provider
      value={{
        settings,
        isLoading: loading,
        error,
        reload,
        generateSeoMetadata,
        getSiteName,
        getOrganizationName,
        getContactInfo,
      }}
    >
      {children}
    </AdminSeoContext.Provider>
  );
}

export function useAdminSeo() {
  const context = useContext(AdminSeoContext);
  if (context === undefined) {
    throw new Error('useAdminSeo must be used within an AdminSeoProvider');
  }
  return context;
}

// Convenient hooks for specific settings
export function useAdminSiteName() {
  const { getSiteName } = useAdminSeo();
  return getSiteName();
}

export function useAdminOrganizationName() {
  const { getOrganizationName } = useAdminSeo();
  return getOrganizationName();
}

export function useAdminContactInfo() {
  const { getContactInfo } = useAdminSeo();
  return getContactInfo();
}

export function useAdminSeoMetadata(options: {
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
  type?: 'page' | 'product' | 'category';
  image?: string;
  productData?: any;
  categoryData?: any;
}) {
  const { generateSeoMetadata } = useAdminSeo();
  return generateSeoMetadata(options);
}
