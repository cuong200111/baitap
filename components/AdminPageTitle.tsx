"use client";

import { useAdminSiteName } from "@/contexts/AdminSeoContext";

interface AdminPageTitleProps {
  title?: string;
  showSiteName?: boolean;
  separator?: string;
  className?: string;
}

export function AdminPageTitle({
  title,
  showSiteName = true,
  separator = " | ",
  className = "",
}: AdminPageTitleProps) {
  const siteName = useAdminSiteName();

  const displayTitle = title
    ? showSiteName
      ? `${title}${separator}${siteName}`
      : title
    : siteName;

  return (
    <h1 className={`text-2xl font-bold text-gray-900 ${className}`}>
      {displayTitle}
    </h1>
  );
}
