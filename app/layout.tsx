import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { generateAdminMetadata } from "@/lib/admin-metadata";
import SeoAnalytics from "@/components/SeoAnalytics";
import StructuredData from "@/components/StructuredData";
import ErrorBoundary from "@/components/ErrorBoundary";
import DevErrorSuppressor from "@/components/DevErrorSuppressor";
import "@/lib/error-handler"; // Auto-setup global error handling

export async function generateMetadata(): Promise<Metadata> {
  try {
    console.log("🔍 Loading admin SEO settings for root layout metadata...");
    const metadata = await generateAdminMetadata({
      title: undefined, // Use default site name
      description: undefined, // Use default site description
      path: "/",
      type: "page",
    });

    console.log("✅ Admin SEO metadata generated:", {
      title: metadata.title,
      description: metadata.description?.substring(0, 50) + "...",
    });

    return metadata;
  } catch (error) {
    console.error("Failed to generate admin metadata, using fallback:", error);

    // Fallback metadata
    return {
      title: {
        default: "HACOM - Máy tính, Laptop, Gaming Gear",
        template: "%s | HACOM",
      },
      description: "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
      keywords: "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM",
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
        <DevErrorSuppressor />
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
