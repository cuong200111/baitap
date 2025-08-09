import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
// import SeoProvider from "@/components/providers/SeoProvider";
import { generateAdminMetadata } from "@/lib/admin-metadata";
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
      description:
        "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
      keywords: "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM",
    };
  }
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
        <ErrorBoundary>
          <SeoProvider>
            <Providers>{children}</Providers>
          </SeoProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
