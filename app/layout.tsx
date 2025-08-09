import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { seoService } from "@/lib/seo-service";
import SeoAnalytics from "@/components/SeoAnalytics";
import StructuredData from "@/components/StructuredData";

export async function generateMetadata(): Promise<Metadata> {
  const seoSettings = await seoService.loadSettings();

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
