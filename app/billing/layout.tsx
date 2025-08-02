import { generatePageMetadata } from "@/lib/seo-service";

export async function generateMetadata() {
  return await generatePageMetadata(
    "Thanh toán & Hóa đơn",
    "Quản lý thông tin thanh toán, xem lịch sử hóa đơn và cập nhật phương thức thanh toán của bạn.",
    "/billing",
  );
}

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
