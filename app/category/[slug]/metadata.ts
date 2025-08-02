import { generateCategoryMetadata } from "@/lib/seo-service";
import { API_DOMAIN } from "@/lib/api-helpers";

interface CategoryPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: CategoryPageProps) {
  try {
    // Fetch category data
    const response = await fetch(`${API_DOMAIN}/api/categories/${params.slug}`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (!response.ok) {
      // Fallback for category not found
      return await generateCategoryMetadata(
        "Danh mục không tồn tại",
        "Danh mục bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
        `/category/${params.slug}`
      );
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      return await generateCategoryMetadata(
        "Danh mục không tồn tại",
        "Danh mục bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
        `/category/${params.slug}`
      );
    }

    const category = data.data;
    
    // Get category image if available
    const categoryImage = category.image || undefined;

    // Generate description if not available
    let description = category.description;
    if (!description) {
      description = `Khám phá bộ sưu tập ${category.name} tại HACOM. Sản phẩm chính hãng, giá tốt nhất, bảo hành chu đáo.`;
    }

    return await generateCategoryMetadata(
      category.name,
      description,
      `/category/${params.slug}`,
      categoryImage
    );

  } catch (error) {
    console.error("Error generating category metadata:", error);
    
    // Fallback metadata
    return await generateCategoryMetadata(
      "Danh mục sản phẩm HACOM",
      "Khám phá các danh mục sản phẩm chất lượng cao tại HACOM với giá tốt nhất.",
      `/category/${params.slug}`
    );
  }
}
