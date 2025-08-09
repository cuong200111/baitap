import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { seoService } from "@/lib/seo-service";
import SeoAnalytics from "@/components/SeoAnalytics";
import StructuredData from "@/components/StructuredData";
import ErrorBoundary from "@/components/ErrorBoundary";
import "@/lib/error-handler"; // Auto-setup global error handling

export async function generateMetadata(): Promise<Metadata> {
  let seoSettings;

  try {
    seoSettings = await seoService.loadSettings();
    console.log("✅ SEO settings loaded for metadata:", {
      site_name: seoSettings.general.site_name,
      description_length: seoSettings.general.site_description?.length || 0,
    });
  } catch (error) {
    console.error(
      "Failed to load SEO settings in metadata, using defaults:",
      error,
    );
    // Use default settings if API fails
    seoSettings = {
      general: {
        site_name: "HACOM - Máy tính, Laptop",
        site_url: "https://hacom.vn",
        site_description:
          "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
        site_keywords:
          "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM",
        site_favicon: "/favicon.ico",
      },
      social: {
        twitter_site: "@hacom_vn",
        default_og_image: "/og-image.jpg",
      },
      schema: {
        organization_name: "HACOM",
      },
    };
  }

  return {
    title: {
      default: seoSettings.general.site_name,
      template: `%s | ${seoSettings.general.site_name}`,
    },
    description: seoSettings.general.site_description,
    keywords: seoSettings.general.site_keywords,
    authors: [{ name: seoSettings.schema.organization_name }],
    creator: seoSettings.schema.organization_name,
    publisher: seoSettings.schema.organization_name,
    metadataBase: new URL(seoSettings.general.site_url),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      url: seoSettings.general.site_url,
      siteName: seoSettings.general.site_name,
      title: seoSettings.general.site_name,
      description: seoSettings.general.site_description,
      images: [
        {
          url: seoSettings.social.default_og_image,
          width: 1200,
          height: 630,
          alt: seoSettings.general.site_name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: seoSettings.social.twitter_site,
      creator: seoSettings.social.twitter_site,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "your-google-verification-code",
    },
    icons: {
      icon: seoSettings.general.site_favicon,
      shortcut: seoSettings.general.site_favicon,
      apple: seoSettings.general.site_favicon,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning={true}>
        <SeoAnalytics />
        <StructuredData type="organization" />
        <StructuredData type="website" />
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
