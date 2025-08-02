"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  ChevronRight,
  Laptop,
  Monitor,
  Gamepad2,
  Cpu,
  Smartphone,
  Headphones,
  Mouse,
  Keyboard,
} from "lucide-react";
import { Domain } from "@/config";

interface DbCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  subcategories: {
    id: number;
    name: string;
    slug: string;
    children: {
      id: number;
      name: string;
      slug: string;
    }[];
  }[];
}

export function SimpleDbCategoryMenu() {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [activeMainCategory, setActiveMainCategory] = useState<number | null>(
    null,
  );
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  // Get the currently displayed category (either active or first)
  const getDisplayedCategory = () => {
    if (activeMainCategory) {
      return (
        categories.find((cat) => cat.id === activeMainCategory) || categories[0]
      );
    }
    return categories[0];
  };

  const getIconForCategory = (slug: string): string => {
    const iconMap: Record<string, string> = {
      laptop: "laptop",
      pc: "monitor",
      gaming: "gamepad2",
      cpu: "cpu",
      smartphone: "smartphone",
      headphones: "headphones",
      mouse: "mouse",
      keyboard: "keyboard",
    };
    return iconMap[slug] || "monitor";
  };

  const loadCategories = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort("Request timeout");
      }, 15000); // 15 seconds timeout

      const response = await fetch(`${Domain}/api/categories?mega_menu=true`, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
        cache: "no-store", // Prevent caching issues
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          `Categories API error: ${response.status} ${response.statusText}`,
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Categories API response:", data);

      // Handle both array response and object response
      let categoriesData = [];
      if (Array.isArray(data)) {
        categoriesData = data;
      } else if (data.success && data.data) {
        categoriesData = data.data;
      } else if (data.data) {
        categoriesData = data.data;
      } else {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format");
      }

      // Transform the data to match expected format
      const transformedCategories = categoriesData.map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        icon: getIconForCategory(category.slug),
        subcategories: (category.children || []).map((child: any) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          children: (child.children || []).map((grandchild: any) => ({
            id: grandchild.id,
            name: grandchild.name,
            slug: grandchild.slug,
          })),
        })),
      }));

      setCategories(transformedCategories);
    } catch (error: any) {
      if (error.name === "AbortError" || error.message === "Request timeout") {
        console.log("Categories request was aborted or timed out");
        // Still set fallback categories even on timeout
      } else {
        console.error("Error loading categories:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }

      // Always set fallback categories to prevent empty menu
      console.log("Setting fallback categories due to error");
      setCategories([
        {
          id: 1,
          name: "Laptop",
          slug: "laptop",
          description: "Máy tính xách tay",
          icon: "laptop",
          subcategories: [],
        },
        {
          id: 2,
          name: "PC Desktop",
          slug: "pc-desktop",
          description: "Máy tính để bàn",
          icon: "monitor",
          subcategories: [],
        },
        {
          id: 3,
          name: "Gaming Gear",
          slug: "gaming-gear",
          description: "Phụ kiện gaming",
          icon: "gamepad2",
          subcategories: [],
        },
        {
          id: 4,
          name: "Màn hình",
          slug: "man-hinh",
          description: "Màn hình máy tính",
          icon: "monitor",
          subcategories: [],
        },
        {
          id: 5,
          name: "Điện thoại",
          slug: "dien-thoai",
          description: "Smartphone",
          icon: "smartphone",
          subcategories: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case "laptop":
        return <Laptop className="w-4 h-4" />;
      case "monitor":
        return <Monitor className="w-4 h-4" />;
      case "cpu":
        return <Cpu className="w-4 h-4" />;
      case "gamepad2":
        return <Gamepad2 className="w-4 h-4" />;
      case "smartphone":
        return <Smartphone className="w-4 h-4" />;
      case "headphones":
        return <Headphones className="w-4 h-4" />;
      case "mouse":
        return <Mouse className="w-4 h-4" />;
      case "keyboard":
        return <Keyboard className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="relative bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-3">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center py-3">
          {/* Categories Dropdown Button */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredCategory(1)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <button
              className={`
                flex items-center space-x-2 px-6 py-3 text-sm font-medium
                transition-all duration-200 rounded-lg border
                ${
                  hoveredCategory
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                }
              `}
            >
              <Menu className="w-4 h-4" />
              <span>Danh mục sản phẩm</span>
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${hoveredCategory ? "rotate-90" : ""}`}
              />
            </button>

            {/* Mega Menu Dropdown */}
            {hoveredCategory && categories.length > 0 && (
              <div
                className="absolute top-full left-0 w-[900px] bg-white shadow-2xl border border-gray-200 z-50 mt-1 rounded-lg"
                onMouseEnter={() => setHoveredCategory(hoveredCategory)}
                onMouseLeave={() => {
                  setHoveredCategory(null);
                  setActiveMainCategory(null);
                }}
              >
                <div className="flex">
                  {/* Left Categories Area */}
                  <div className="w-64 bg-gray-50 border-r border-gray-200">
                    {categories.map((category) => {
                      const isActive = activeMainCategory === category.id;
                      const isDefault =
                        !activeMainCategory &&
                        category.id === categories[0]?.id;
                      return (
                        <div
                          key={category.id}
                          onMouseEnter={() =>
                            setActiveMainCategory(category.id)
                          }
                          className={`
                            flex items-center space-x-3 px-4 py-3 text-sm border-b border-gray-200
                            transition-all group cursor-pointer
                            ${
                              isActive || isDefault
                                ? "bg-red-100 border-red-200"
                                : "hover:bg-red-50"
                            }
                          `}
                        >
                          <Link
                            href={`/category/${category.slug}`}
                            className="flex items-center space-x-3 w-full"
                          >
                            <div
                              className={`
                              ${
                                isActive || isDefault
                                  ? "text-red-700"
                                  : "text-red-600 group-hover:text-red-700"
                              }
                            `}
                            >
                              {getIconComponent(category.icon)}
                            </div>
                            <span
                              className={`
                              font-medium
                              ${
                                isActive || isDefault
                                  ? "text-red-700"
                                  : "text-gray-700 group-hover:text-red-600"
                              }
                            `}
                            >
                              {category.name}
                            </span>
                            <ChevronRight
                              className={`
                              w-4 h-4 ml-auto
                              ${
                                isActive || isDefault
                                  ? "text-red-700"
                                  : "text-gray-400 group-hover:text-red-600"
                              }
                            `}
                            />
                          </Link>
                        </div>
                      );
                    })}
                  </div>

                  {/* Center Content Area */}
                  <div className="flex-1 p-6">
                    <div className="grid grid-cols-3 gap-6">
                      {/* Show currently displayed category's subcategories */}
                      {getDisplayedCategory()?.subcategories.length > 0 ? (
                        getDisplayedCategory()?.subcategories.map((subcat) => (
                          <div key={subcat.id} className="space-y-2">
                            <h4 className="text-red-600 font-bold text-sm mb-3 border-b border-red-200 pb-1">
                              {subcat.name}
                            </h4>
                            <ul className="space-y-1">
                              {subcat.children.map((item) => (
                                <li key={item.id}>
                                  <Link
                                    href={`/category/${item.slug}`}
                                    className="text-gray-700 text-xs hover:text-red-600 transition-colors block py-1 hover:bg-red-50 px-2 rounded"
                                  >
                                    {item.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-8">
                          <p className="text-gray-500 text-sm">
                            Danh mục này hiện chưa có sản phẩm con
                          </p>
                          <Link
                            href={`/category/${getDisplayedCategory()?.slug}`}
                            className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Xem tất cả sản phẩm
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Category Info Area */}
                  <div className="w-64 bg-gray-50 border-l border-gray-200 p-4">
                    {getDisplayedCategory() && (
                      <>
                        {/* Category Image & Description */}
                        <div className="mb-4">
                          <div className="aspect-video bg-white rounded border border-gray-200 overflow-hidden mb-3">
                            <img
                              src={
                                getDisplayedCategory().image ||
                                "/placeholder.svg"
                              }
                              alt={getDisplayedCategory().name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h4 className="text-gray-800 font-semibold text-sm mb-2">
                            {getDisplayedCategory().name}
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {getDisplayedCategory().description}
                          </p>
                        </div>

                        {/* Category Stats */}
                        <div className="space-y-3">
                          <div className="p-3 bg-red-50 rounded border border-red-200">
                            <div className="text-xs text-red-700 font-medium mb-1">
                              📊 Thống Kê
                            </div>
                            <div className="space-y-1 text-xs text-red-600">
                              <div>
                                {getDisplayedCategory().subcategories.length}{" "}
                                danh mục con
                              </div>
                              <div>
                                {getDisplayedCategory().subcategories.reduce(
                                  (acc, sub) => acc + sub.children.length,
                                  0,
                                )}{" "}
                                sản phẩm loại
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="text-xs text-blue-700 font-medium mb-1">
                              ⭐ Nổi Bật
                            </div>
                            <div className="space-y-1">
                              {getDisplayedCategory()
                                .subcategories.slice(0, 2)
                                .map((subcat) => (
                                  <Link
                                    key={subcat.id}
                                    href={`/category/${subcat.slug}`}
                                    className="block text-xs text-blue-600 hover:underline"
                                  >
                                    {subcat.name}
                                  </Link>
                                ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
