import { generatePageMetadata } from "@/lib/seo-service";

export async function generateMetadata() {
  return await generatePageMetadata(
    "Đặt hàng thành công",
    "Cảm ơn bạn đã đặt hàng tại HACOM. Đơn hàng của bạn đã được ghi nhận và sẽ được xử lý trong thời gian sớm nhất.",
    "/thank-you"
  );
}

export default function ThankYouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
