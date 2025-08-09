import { generatePageMetadata } from "@/lib/seo-service";

export async function generateMetadata() {
  return await generatePageMetadata(
    "Đăng nhập",
    "Đăng nhập vào tài khoản HACOM của bạn để mua sắm, theo dõi đơn hàng và quản lý thông tin cá nhân.",
    "/login"
  );
}
