import { seoService } from "@/lib/seo-service";

export async function generateMetadata() {
  const seoData = await seoService.generatePageSeo({
    title: "Đăng nhập",
    description: "Đăng nhập vào tài khoản HACOM của bạn để mua sắm, theo dõi đơn hàng và quản lý thông tin cá nhân.",
    path: "/login",
    type: "page"
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

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
