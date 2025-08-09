import { generateProductMetadata } from "@/lib/seo-service";
import { Domain } from "@/config";

interface ProductPageProps {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    // Fetch product data
    const response = await fetch(`${Domain}/api/products/${params.id}`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      // Fallback for product not found
      return await generateProductMetadata(
        "Sản phẩm không tồn tại",
        "Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
        undefined,
        undefined,
        undefined,
      );
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return await generateProductMetadata(
        "Sản phẩm không tồn tại",
        "Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
        undefined,
        undefined,
        undefined,
      );
    }

    const product = data.data;

    // Get the main image from backend uploads
    let productImage = undefined;
    if (product.image) {
      // If product has main image, use it with Domain uploads path
      productImage = product.image.startsWith('http')
        ? product.image
        : `${Domain}/uploads/${product.image}`;
    } else if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      // If product has images array, use first image
      const firstImage = product.images[0];
      productImage = firstImage.startsWith('http')
        ? firstImage
        : `${Domain}/uploads/${firstImage}`;
    }

    return await generateProductMetadata(
      product.name,
      product.description ||
        product.short_description ||
        `Mua ${product.name} chính hãng tại HACOM với giá tốt nhất.`,
      productImage,
      product.price,
      product.sku,
    );
  } catch (error) {
    console.error("Error generating product metadata:", error);

    // Fallback metadata
    return await generateProductMetadata(
      "Sản phẩm HACOM",
      "Khám phá sản phẩm chất lượng cao tại HACOM với giá tốt nhất.",
      undefined,
      undefined,
      undefined,
    );
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
