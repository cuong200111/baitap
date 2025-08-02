import { generatePageMetadata } from "@/lib/seo-service";

export async function generateMetadata() {
  return await generatePageMetadata(
    "Đăng ký tài khoản",
    "Tạo tài khoản HACOM mới để trải nghiệm mua sắm tuyệt vời. Đăng ký ngay để nhận ưu đãi đặc biệt và theo dõi đơn hàng.",
    "/register",
  );
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
