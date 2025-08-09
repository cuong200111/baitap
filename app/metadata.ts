import { seoService } from "@/lib/seo-service";

export async function generateMetadata() {
  const seoData = await seoService.generatePageSeo({
    title: "HACOM - Máy tính, Laptop, Gaming Gear",
    description:
      "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
    path: "/",
    type: "page",
  });

  return {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords,
    openGraph: {
      title: seoData.ogTitle,
      description: seoData.ogDescription,
      images: [seoData.ogImage],
      url: seoData.ogUrl,
    },
    twitter: {
      title: seoData.twitterTitle,
      description: seoData.twitterDescription,
      images: [seoData.twitterImage],
    },
  };
}
