import { generatePageMetadata } from "@/lib/seo-service";

export async function generateMetadata() {
  return await generatePageMetadata(
    "Thông tin cá nhân",
    "Quản lý thông tin tài khoản, cập nhật thông tin cá nhân và địa chỉ của bạn tại HACOM",
    "/profile"
  );
}
