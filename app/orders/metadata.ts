import { generatePageMetadata } from "@/lib/seo-service";

export async function generateMetadata() {
  return await generatePageMetadata(
    "Đơn hàng của tôi",
    "Theo dõi trạng thái và lịch sử đơn hàng của bạn. Xem chi tiết đơn hàng, tình trạng giao hàng và thông tin thanh toán.",
    "/orders"
  );
}
