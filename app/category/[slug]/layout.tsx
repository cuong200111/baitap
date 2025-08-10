import { generateCategoryMetadata } from "@/lib/seo-service";
import { Domain } from "@/config";

interface CategoryPageProps {
  params: { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  try {
    // Fetch category data
    const response = await fetch(`${Domain}/api/categories/${params.slug}`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      // Fallback for category not found
      return await generateCategoryMetadata(
        "Danh mục không tồn tại",
        "Danh mục bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
        undefined,
      );
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return await generateCategoryMetadata(
        "Danh mục không tồn tại",
        "Danh mục bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
        undefined,
      );
    }

    const category = data.data;

    // Get category image from backend uploads
    let categoryImage = undefined;
    if (category.image) {
      // If category has image, use it with Domain uploads path
      categoryImage = category.image.startsWith("http")
        ? category.image
        : `${Domain}/uploads/${category.image}`;
    } else {
      // If category has no image, try to get first product image from this category
      try {
        const productsResponse = await fetch(`${Domain}/api/products?category=${params.slug}&limit=1`, {
          next: { revalidate: 300 }
        });

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          if (productsData.success && productsData.data && productsData.data.length > 0) {
            const firstProduct = productsData.data[0];
            if (firstProduct.image) {
              categoryImage = firstProduct.image.startsWith("http")
                ? firstProduct.image
                : `${Domain}/uploads/${firstProduct.image}`;
            } else if (firstProduct.images && Array.isArray(firstProduct.images) && firstProduct.images.length > 0) {
              const firstImage = firstProduct.images[0];
              categoryImage = firstImage.startsWith("http")
                ? firstImage
                : `${Domain}/uploads/${firstImage}`;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching category products for image:", error);
      }
    }

    // Generate description if not available
    let description = category.description;
    if (!description) {
      description = `Khám phá bộ sưu tập ${category.name} tại HACOM. Sản phẩm chính hãng, giá tốt nhất, bảo hành chu đáo.`;
    }

    return await generateCategoryMetadata(
      category.name,
      description,
      categoryImage,
    );
  } catch (error) {
    console.error("Error generating category metadata:", error);

    // Fallback metadata
    return await generateCategoryMetadata(
      "Danh mục sản phẩm HACOM",
      "Khám phá các danh mục sản phẩm chất lượng cao tại HACOM với giá tốt nhất.",
      undefined,
    );
  }
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
