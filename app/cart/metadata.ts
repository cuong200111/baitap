import { generatePageMetadata } from "@/lib/seo-service";

export async function generateMetadata() {
  return await generatePageMetadata(
    "Giỏ hàng",
    "Xem và quản lý sản phẩm trong giỏ hàng của bạn. Cập nhật số lượng, xóa sản phẩm và tiến hành thanh toán.",
    "/cart"
  );
}
