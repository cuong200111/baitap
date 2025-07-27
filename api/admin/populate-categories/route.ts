import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const dbPath = join(process.cwd(), "hacom_ecommerce.db");
    const db = new Database(dbPath);

    console.log("🔄 Starting comprehensive category data update...");

    // Clear existing categories first
    console.log("🗑️ Clearing existing categories...");
    db.exec("DELETE FROM categories");
    db.exec("DELETE FROM sqlite_sequence WHERE name='categories'");

    // Define comprehensive category data
    const allCategories = [
      // Main categories
      {
        id: 1,
        name: "Laptop, MacBook, Surface",
        slug: "laptop",
        description:
          "Laptop, MacBook và Surface từ các thương hiệu hàng đầu thế giới. Đa dạng từ gaming, văn phòng đến đồ họa chuyên nghiệp.",
        image:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop",
        icon: "laptop",
        parent_id: null,
        sort_order: 1,
        is_active: 1,
      },
      {
        id: 2,
        name: "PC Desktop & Workstation",
        slug: "pc-desktop",
        description:
          "Máy tính để bàn và workstation mạnh mẽ cho mọi nhu cầu từ gaming, làm việc đến render chuyên nghiệp.",
        image:
          "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=600&h=400&fit=crop",
        icon: "cpu",
        parent_id: null,
        sort_order: 2,
        is_active: 1,
      },
      {
        id: 3,
        name: "Gaming Gear & Phụ kiện",
        slug: "gaming-gear",
        description:
          "Phụ kiện gaming cao cấp: chuột, bàn phím, tai nghe, ghế gaming từ các thương hiệu nổi tiếng.",
        image:
          "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=600&h=400&fit=crop",
        icon: "gamepad",
        parent_id: null,
        sort_order: 3,
        is_active: 1,
      },
      {
        id: 4,
        name: "Màn hình & Thiết bị hiển thị",
        slug: "man-hinh",
        description:
          "Màn hình gaming, văn phòng, đồ họa với công nghệ tiên tiến: 4K, 144Hz, HDR, IPS, OLED.",
        image:
          "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=400&fit=crop",
        icon: "monitor",
        parent_id: null,
        sort_order: 4,
        is_active: 1,
      },
      {
        id: 5,
        name: "Điện thoại & Tablet",
        slug: "dien-thoai-tablet",
        description:
          "Smartphone và tablet từ Apple, Samsung, Xiaomi, OPPO với công nghệ mới nhất.",
        image:
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
        icon: "smartphone",
        parent_id: null,
        sort_order: 5,
        is_active: 1,
      },

      // Laptop subcategories
      {
        id: 10,
        name: "Laptop Theo Hãng",
        slug: "laptop-theo-hang",
        description: "Laptop chia theo từng thương hiệu nổi tiếng",
        image:
          "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=300&fit=crop",
        parent_id: 1,
        sort_order: 1,
        is_active: 1,
      },
      {
        id: 11,
        name: "Laptop Theo Nhu Cầu",
        slug: "laptop-theo-nhu-cau",
        description: "Laptop được phân loại theo công việc và nhu cầu sử dụng",
        image:
          "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop",
        parent_id: 1,
        sort_order: 2,
        is_active: 1,
      },
      {
        id: 12,
        name: "MacBook & iMac",
        slug: "macbook-imac",
        description: "Sản phẩm Apple chính hãng với chip M-series mới nhất",
        image:
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
        parent_id: 1,
        sort_order: 3,
        is_active: 1,
      },

      // Laptop brands
      {
        id: 20,
        name: "Laptop ASUS",
        slug: "laptop-asus",
        description: "Laptop ASUS ROG, TUF Gaming, ZenBook, VivoBook",
        image:
          "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=300&h=200&fit=crop",
        parent_id: 10,
        sort_order: 1,
        is_active: 1,
      },
      {
        id: 21,
        name: "Laptop MSI",
        slug: "laptop-msi",
        description: "Laptop MSI Gaming, Creator, Business",
        image:
          "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=300&h=200&fit=crop",
        parent_id: 10,
        sort_order: 2,
        is_active: 1,
      },
      {
        id: 22,
        name: "Laptop Dell",
        slug: "laptop-dell",
        description: "Dell XPS, Inspiron, Alienware, Latitude",
        image:
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&h=200&fit=crop",
        parent_id: 10,
        sort_order: 3,
        is_active: 1,
      },
      {
        id: 23,
        name: "Laptop HP",
        slug: "laptop-hp",
        description: "HP Pavilion, EliteBook, Omen Gaming",
        image:
          "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=300&h=200&fit=crop",
        parent_id: 10,
        sort_order: 4,
        is_active: 1,
      },
      {
        id: 24,
        name: "Laptop Lenovo",
        slug: "laptop-lenovo",
        description: "ThinkPad, IdeaPad, Legion Gaming",
        image:
          "https://images.unsplash.com/photo-1504707748692-419802cf939d?w=300&h=200&fit=crop",
        parent_id: 10,
        sort_order: 5,
        is_active: 1,
      },
      {
        id: 25,
        name: "Laptop Acer",
        slug: "laptop-acer",
        description: "Acer Predator, Aspire, Swift series",
        image:
          "https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=300&h=200&fit=crop",
        parent_id: 10,
        sort_order: 6,
        is_active: 1,
      },

      // Laptop by usage
      {
        id: 30,
        name: "Laptop Gaming",
        slug: "laptop-gaming",
        description: "Laptop gaming với card đồ họa mạnh, tản nhiệt tốt",
        image:
          "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&h=200&fit=crop",
        parent_id: 11,
        sort_order: 1,
        is_active: 1,
      },
      {
        id: 31,
        name: "Laptop Văn Phòng",
        slug: "laptop-van-phong",
        description: "Laptop nhẹ, pin lâu, phù hợp công việc văn phòng",
        image:
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=200&fit=crop",
        parent_id: 11,
        sort_order: 2,
        is_active: 1,
      },
      {
        id: 32,
        name: "Laptop Đồ Họa",
        slug: "laptop-do-hoa",
        description: "Laptop workstation cho design, render, video editing",
        image:
          "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=300&h=200&fit=crop",
        parent_id: 11,
        sort_order: 3,
        is_active: 1,
      },
      {
        id: 33,
        name: "Laptop Mỏng Nhẹ",
        slug: "laptop-mong-nhe",
        description: "Ultrabook siêu mỏng, thiết kế cao cấp",
        image:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=200&fit=crop",
        parent_id: 11,
        sort_order: 4,
        is_active: 1,
      },

      // PC Desktop subcategories
      {
        id: 40,
        name: "PC Gaming",
        slug: "pc-gaming",
        description: "PC gaming cấu hình cao với RTX 4080, 4090",
        image:
          "https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=400&h=300&fit=crop",
        parent_id: 2,
        sort_order: 1,
        is_active: 1,
      },
      {
        id: 41,
        name: "PC Văn Phòng",
        slug: "pc-van-phong",
        description: "PC văn phòng ổn định, tiết kiệm điện",
        image:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
        parent_id: 2,
        sort_order: 2,
        is_active: 1,
      },
      {
        id: 42,
        name: "Workstation",
        slug: "workstation",
        description: "Workstation chuyên nghiệp cho render, AI",
        image:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop",
        parent_id: 2,
        sort_order: 3,
        is_active: 1,
      },

      // Gaming Gear subcategories
      {
        id: 50,
        name: "Chuột Gaming",
        slug: "chuot-gaming",
        description: "Chuột gaming với sensor chính xác cao",
        image:
          "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300&fit=crop",
        parent_id: 3,
        sort_order: 1,
        is_active: 1,
      },
      {
        id: 51,
        name: "Bàn Phím Gaming",
        slug: "ban-phim-gaming",
        description: "Bàn phím cơ gaming với switch chuyên dụng",
        image:
          "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=300&fit=crop",
        parent_id: 3,
        sort_order: 2,
        is_active: 1,
      },
      {
        id: 52,
        name: "Tai Nghe Gaming",
        slug: "tai-nghe-gaming",
        description: "Tai nghe gaming 7.1 surround chất lượng cao",
        image:
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=300&fit=crop",
        parent_id: 3,
        sort_order: 3,
        is_active: 1,
      },
      {
        id: 53,
        name: "Ghế Gaming",
        slug: "ghe-gaming",
        description: "Ghế gaming ergonomic, chất liệu cao cấp",
        image:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
        parent_id: 3,
        sort_order: 4,
        is_active: 1,
      },

      // Monitor subcategories
      {
        id: 60,
        name: "Màn Hình Gaming",
        slug: "man-hinh-gaming",
        description: "Màn hình gaming 144Hz, 240Hz, G-Sync, FreeSync",
        image:
          "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop",
        parent_id: 4,
        sort_order: 1,
        is_active: 1,
      },
      {
        id: 61,
        name: "Màn Hình 4K",
        slug: "man-hinh-4k",
        description: "Màn hình 4K UHD cho đồ họa và giải trí",
        image:
          "https://images.unsplash.com/photo-1561736778-92e52a7769ef?w=400&h=300&fit=crop",
        parent_id: 4,
        sort_order: 2,
        is_active: 1,
      },
      {
        id: 62,
        name: "Màn Hình Cong",
        slug: "man-hinh-cong",
        description: "Màn hình cong siêu rộng cho trải nghiệm immersive",
        image:
          "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&h=300&fit=crop",
        parent_id: 4,
        sort_order: 3,
        is_active: 1,
      },

      // Phone subcategories
      {
        id: 70,
        name: "iPhone",
        slug: "iphone",
        description: "iPhone 15 series với chip A17 Pro mới nh��t",
        image:
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop",
        parent_id: 5,
        sort_order: 1,
        is_active: 1,
      },
      {
        id: 71,
        name: "Samsung Galaxy",
        slug: "samsung-galaxy",
        description: "Galaxy S24 Ultra, Note, A series",
        image:
          "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop",
        parent_id: 5,
        sort_order: 2,
        is_active: 1,
      },
      {
        id: 72,
        name: "Xiaomi",
        slug: "xiaomi",
        description: "Xiaomi 14, Redmi Note series với giá tốt",
        image:
          "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&h=300&fit=crop",
        parent_id: 5,
        sort_order: 3,
        is_active: 1,
      },
    ];

    // Insert all categories
    const insertStmt = db.prepare(`
      INSERT INTO categories (
        id, name, slug, description, image, icon, parent_id, sort_order, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    let insertedCount = 0;
    for (const category of allCategories) {
      try {
        insertStmt.run(
          category.id,
          category.name,
          category.slug,
          category.description,
          category.image || null,
          category.icon || null,
          category.parent_id,
          category.sort_order,
          category.is_active,
        );
        insertedCount++;
        console.log(`✅ Added: ${category.name}`);
      } catch (error) {
        console.error(`❌ Error adding ${category.name}:`, error);
      }
    }

    // Get summary
    const summary = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
        COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories
      FROM categories WHERE is_active = 1
    `,
      )
      .get();

    db.close();

    return NextResponse.json({
      success: true,
      message: "Categories populated successfully",
      data: {
        inserted: insertedCount,
        total: summary.total,
        main_categories: summary.main_categories,
        subcategories: summary.subcategories,
      },
    });
  } catch (error) {
    console.error("Error populating categories:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to populate categories",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
