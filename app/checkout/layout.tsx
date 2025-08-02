import { generatePageMetadata } from "@/lib/seo-service";

export async function generateMetadata() {
  return await generatePageMetadata(
    "Thanh toán",
    "Hoàn tất đơn hàng của bạn. Nhập thông tin giao hàng, chọn phương thức thanh toán và xác nhận đơn hàng.",
    "/checkout"
  );
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
