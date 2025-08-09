import { generateAdminMetadata } from "@/lib/admin-metadata";

export async function generateMetadata() {
  return await generateAdminMetadata({
    title: "Demo Admin SEO Settings",
    description:
      "Trang demo hiển thị các SEO settings được lấy từ admin panel và cách sử dụng trong ứng dụng.",
    keywords: "SEO, admin settings, demo, metadata",
    path: "/demo-seo",
    type: "page",
  });
}
