"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface SubCategory {
  name: string;
  slug: string;
  products?: string[];
}

interface MegaMenuData {
  [key: string]: {
    subcategories: SubCategory[];
    brands: string[];
    featured: string[];
  };
}

export function SimpleCategoryNav() {
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Laptop", slug: "laptop" },
    { id: 2, name: "PC", slug: "pc" },
    { id: 3, name: "Gaming", slug: "gaming" },
    { id: 7, name: "Điện thoại thông minh", slug: "dien-thoai-thong-minh" },
    { id: 8, name: "Phụ kiện công nghệ", slug: "phu-kien-cong-nghe" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const megaMenuData: MegaMenuData = {
    laptop: {
      subcategories: [
        {
          name: "Laptop Gaming",
          slug: "laptop-gaming",
          products: ["ASUS ROG", "MSI Gaming", "Acer Predator"],
        },
        {
          name: "Laptop Văn Phòng",
          slug: "laptop-van-phong",
          products: ["Dell Inspiron", "HP Pavilion", "Lenovo IdeaPad"],
        },
        {
          name: "Laptop Đồ Họa",
          slug: "laptop-do-hoa",
          products: ["MacBook Pro", "Dell XPS", "HP ZBook"],
        },
        {
          name: "Laptop Mỏng Nhẹ",
          slug: "laptop-mong-nhe",
          products: ["MacBook Air", "Dell XPS 13", "HP Spectre"],
        },
      ],
      brands: ["ASUS", "Dell", "HP", "Lenovo", "MSI", "Acer", "Apple"],
      featured: ["Laptop Gaming RTX 4080", "MacBook Pro M3", "Dell XPS 15"],
    },
    pc: {
      subcategories: [
        {
          name: "PC Gaming",
          slug: "pc-gaming",
          products: ["PC RTX 4080", "PC RTX 4070", "PC AMD RX 7800"],
        },
        {
          name: "PC Văn Phòng",
          slug: "pc-van-phong",
          products: ["PC Office i5", "PC Office i3", "PC AMD Ryzen"],
        },
        {
          name: "Workstation",
          slug: "workstation",
          products: ["Dell Precision", "HP Z Series", "Lenovo ThinkStation"],
        },
        {
          name: "Mini PC",
          slug: "mini-pc",
          products: ["Intel NUC", "ASUS Mini PC", "HP Elite"],
        },
      ],
      brands: ["Intel", "AMD", "NVIDIA", "Dell", "HP", "ASUS"],
      featured: [
        "PC Gaming RTX 4080",
        "Workstation Threadripper",
        "Mini PC Intel",
      ],
    },
    gaming: {
      subcategories: [
        {
          name: "Chuột Gaming",
          slug: "chuot-gaming",
          products: ["Logitech G Pro", "Razer DeathAdder", "SteelSeries Rival"],
        },
        {
          name: "Bàn phím Gaming",
          slug: "ban-phim-gaming",
          products: ["Corsair K95", "Razer BlackWidow", "Logitech G915"],
        },
        {
          name: "Tai nghe Gaming",
          slug: "tai-nghe-gaming",
          products: ["SteelSeries Arctis", "HyperX Cloud", "Corsair HS80"],
        },
        {
          name: "Ghế Gaming",
          slug: "ghe-gaming",
          products: ["DXRacer", "Secretlab", "Corsair T3"],
        },
      ],
      brands: ["Logitech", "Razer", "Corsair", "SteelSeries", "HyperX"],
      featured: [
        "Combo Gaming RGB",
        "Setup Gaming Complete",
        "Chair Gaming Pro",
      ],
    },
    "dien-thoai-thong-minh": {
      subcategories: [
        {
          name: "iPhone",
          slug: "iphone",
          products: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15"],
        },
        {
          name: "Samsung Galaxy",
          slug: "samsung-galaxy",
          products: ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy A55"],
        },
        {
          name: "Xiaomi",
          slug: "xiaomi",
          products: ["Xiaomi 14", "Redmi Note 13", "Poco X6"],
        },
        {
          name: "OPPO",
          slug: "oppo",
          products: ["OPPO Find X7", "OPPO Reno 11", "OPPO A79"],
        },
      ],
      brands: ["Apple", "Samsung", "Xiaomi", "OPPO", "Vivo", "Realme"],
      featured: ["iPhone 15 Pro Max", "Galaxy S24 Ultra", "Xiaomi 14 Pro"],
    },
    "phu-kien-cong-nghe": {
      subcategories: [
        {
          name: "Cáp & Sạc",
          slug: "cap-sac",
          products: ["Cáp Type-C", "Sạc nhanh", "Cáp Lightning"],
        },
        {
          name: "Loa Bluetooth",
          slug: "loa-bluetooth",
          products: ["JBL Flip", "Sony XB", "Harman Kardon"],
        },
        {
          name: "Ốp lưng",
          slug: "op-lung",
          products: ["Ốp iPhone", "Ốp Samsung", "Ốp chống sốc"],
        },
        {
          name: "Kính cường lực",
          slug: "kinh-cuong-luc",
          products: ["Kính iPhone", "Kính Samsung", "Kính Xiaomi"],
        },
      ],
      brands: ["Belkin", "Anker", "JBL", "Sony", "UAG", "Nillkin"],
      featured: ["Sạc nhanh 67W", "Loa JBL Flip 6", "Ốp UAG iPhone 15"],
    },
  };

  useEffect(() => {
    // Static data, no need to load
    // loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log("SimpleCategoryNav: Loading categories...");

      // Timeout after 3 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 3000),
      );

      const fetchPromise = fetch("/api/categories").then((res) => res.json());

      const data = await Promise.race([fetchPromise, timeoutPromise]);

      console.log("SimpleCategoryNav: Response:", data);

      if (data.success && data.data && data.data.length > 0) {
        setCategories(data.data);
        console.log(
          "SimpleCategoryNav: Loaded",
          data.data.length,
          "categories",
        );
      } else {
        throw new Error("No categories found");
      }
    } catch (err) {
      console.error("SimpleCategoryNav: Error loading categories:", err);
      // Fallback to static data
      setCategories([
        { id: 1, name: "Laptop", slug: "laptop" },
        { id: 2, name: "PC", slug: "pc" },
        { id: 3, name: "Gaming", slug: "gaming" },
        { id: 7, name: "Điện thoại thông minh", slug: "dien-thoai-thong-minh" },
        { id: 8, name: "Phụ kiện công nghệ", slug: "phu-kien-cong-nghe" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-t py-3">
        <div className="container mx-auto px-4">
          <div className="text-gray-500">Đang tải danh mục...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-t py-3">
        <div className="container mx-auto px-4">
          <div className="text-red-500">Lỗi: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white border-t border-gray-200">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between">
          {/* Left side - Main categories */}
          <div className="flex items-center space-x-0">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="relative"
                onMouseEnter={() => setHoveredCategory(category.slug)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  href={`/category/${category.slug}`}
                  className={`
                    relative px-6 py-4 font-medium text-sm uppercase tracking-wide
                    transition-all duration-200 ease-in-out
                    hover:bg-red-50 hover:text-red-600
                    text-gray-700 border-r border-gray-100 last:border-r-0
                    ${index === 0 ? "border-l border-gray-100" : ""}
                    ${hoveredCategory === category.slug ? "bg-red-50 text-red-600" : ""}
                    group block
                  `}
                >
                  {category.name}
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-red-600 transition-all duration-300 ${hoveredCategory === category.slug ? "w-full" : "w-0 group-hover:w-full"}`}
                  ></div>
                </Link>
              </div>
            ))}
          </div>

          {/* Right side - Special offers */}
          <div className="flex items-center space-x-4">
            <Link
              href="/sale"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-bold hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
            >
              <span>🔥</span>
              <span>KHUYẾN MÃI</span>
            </Link>
            <Link
              href="/new-arrivals"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              <span>✨</span>
              <span>MỚI VỀ</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Mega Menu Dropdown */}
      {hoveredCategory && megaMenuData[hoveredCategory] && (
        <div
          className="absolute top-full left-0 w-full bg-white shadow-2xl border-t border-gray-200 z-50"
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-12 gap-8">
              {/* Subcategories - Left 8 columns */}
              <div className="col-span-8">
                <div className="grid grid-cols-2 gap-6">
                  {megaMenuData[hoveredCategory].subcategories.map(
                    (subcat, index) => (
                      <div key={index} className="space-y-3">
                        <Link
                          href={`/category/${subcat.slug}`}
                          className="text-red-600 font-semibold text-sm hover:text-red-700 block"
                        >
                          {subcat.name}
                        </Link>
                        <ul className="space-y-2">
                          {subcat.products?.map((product, idx) => (
                            <li key={idx}>
                              <Link
                                href={`/products?search=${product}`}
                                className="text-gray-600 text-sm hover:text-red-600 transition-colors"
                              >
                                {product}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Brands & Featured - Right 4 columns */}
              <div className="col-span-4 space-y-6">
                {/* Brands */}
                <div>
                  <h4 className="text-gray-800 font-semibold text-sm mb-3">
                    THƯƠNG HIỆU NỔI BẬT
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {megaMenuData[hoveredCategory].brands.map(
                      (brand, index) => (
                        <Link
                          key={index}
                          href={`/products?brand=${brand}`}
                          className="text-center p-2 border border-gray-200 rounded hover:border-red-300 hover:bg-red-50 transition-all text-xs text-gray-600"
                        >
                          {brand}
                        </Link>
                      ),
                    )}
                  </div>
                </div>

                {/* Featured Products */}
                <div>
                  <h4 className="text-gray-800 font-semibold text-sm mb-3">
                    SẢN PHẨM NỔI BẬT
                  </h4>
                  <div className="space-y-2">
                    {megaMenuData[hoveredCategory].featured.map(
                      (product, index) => (
                        <Link
                          key={index}
                          href={`/products?search=${product}`}
                          className="block p-3 bg-gradient-to-r from-red-50 to-red-100 rounded text-sm text-red-700 hover:from-red-100 hover:to-red-200 transition-all"
                        >
                          🔥 {product}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
