"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SeoAdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new SEO location in settings
    router.replace("/admin/settings?tab=seo");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Đang chuyển hướng đến cài đặt SEO...</p>
      </div>
    </div>
  );
}
