import { generatePageMetadata } from "@/lib/seo-service";

export async function generateMetadata() {
  return await generatePageMetadata(
    "Tất cả sản phẩm",
    "Khám phá toàn bộ sản phẩm tại HACOM - máy tính, laptop, gaming gear, linh kiện với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
    "/products"
  );
}
