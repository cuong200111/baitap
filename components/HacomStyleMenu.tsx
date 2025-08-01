"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Laptop,
  Monitor,
  Gamepad2,
  Smartphone,
  Headphones,
  ChevronRight,
  Menu,
} from "lucide-react";
import { fetchWithRetry, getErrorMessage } from "@/lib/network";
import { API_DOMAIN } from "@/lib/api-helpers";

interface ApiCategory {
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

export function HacomStyleMenu() {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetchWithRetry(
        `${API_DOMAIN}/api/categories?mega_menu=true`,
        {},
        {
          retries: 3,
          timeout: 15000,
          retryDelay: 1000,
          onRetry: (attempt, error) => {
            console.log(
              `Retrying categories load (attempt ${attempt}):`,
              getErrorMessage(error),
            );
          },
        },
      );

      const data = await response.json();

      if (data.success && data.data) {
        console.log(
          "Categories loaded successfully:",
          data.data.length,
          "categories",
        );
        setCategories(data.data);
      } else {
        throw new Error(data.message || "Failed to load categories");
      }
    } catch (error) {
      console.error("Error loading categories:", getErrorMessage(error));
      // Categories will remain empty, component should handle gracefully
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "laptop":
        return <Laptop className="w-4 h-4" />;
      case "monitor":
        return <Monitor className="w-4 h-4" />;
      case "cpu":
        return <Monitor className="w-4 h-4" />;
      case "gamepad":
        return <Gamepad2 className="w-4 h-4" />;
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

  if (!categories || categories.length === 0) {
    return (
      <div className="relative bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-3">
            <button className="flex items-center space-x-2 px-6 py-3 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg">
              <Menu className="w-4 h-4" />
              <span>Danh mục sản phẩm</span>
              <ChevronRight className="w-4 h-4" />
            </button>
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
            {hoveredCategory && (
              <div
                className="absolute top-full left-0 w-[900px] bg-white shadow-2xl border border-gray-200 z-50 mt-1 rounded-lg"
                onMouseEnter={() => setHoveredCategory(hoveredCategory)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex">
                  {/* Left Categories Area */}
                  <div className="w-64 bg-gray-50 border-r border-gray-200">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className="flex items-center space-x-3 px-4 py-3 text-sm border-b border-gray-200 hover:bg-red-50 hover:text-red-600 transition-all group"
                      >
                        <div className="text-red-600 group-hover:text-red-700">
                          {getIconComponent(category.icon || "monitor")}
                        </div>
                        <span className="font-medium text-gray-700 group-hover:text-red-600">
                          {category.name}
                        </span>
                        <ChevronRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-red-600" />
                      </Link>
                    ))}
                  </div>

                  {/* Center Content Area */}
                  <div className="flex-1 p-6">
                    {categories.length > 0 && (
                      <div className="grid grid-cols-3 gap-6">
                        {/* Show first category's subcategories by default */}
                        {categories[0].subcategories.map((subcat, index) => (
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
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Category Info Area */}
                  <div className="w-64 bg-gray-50 border-l border-gray-200 p-4">
                    {categories.length > 0 && (
                      <>
                        {/* Category Image & Description */}
                        <div className="mb-4">
                          <div className="aspect-video bg-white rounded border border-gray-200 overflow-hidden mb-3">
                            <img
                              src={categories[0].image || "/placeholder.svg"}
                              alt={categories[0].name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h4 className="text-gray-800 font-semibold text-sm mb-2">
                            {categories[0].name}
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {categories[0].description}
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
                                {categories[0].subcategories.length} danh mục
                                con
                              </div>
                              <div>
                                {categories[0].subcategories.reduce(
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
                              {categories[0].subcategories
                                .slice(0, 2)
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

                          <div className="p-3 bg-green-50 rounded border border-green-200">
                            <div className="text-xs text-green-700 font-medium mb-1">
                              🎯 Phổ Biến
                            </div>
                            <div className="space-y-1">
                              {categories[0].subcategories[0]?.children
                                .slice(0, 3)
                                .map((item) => (
                                  <Link
                                    key={item.id}
                                    href={`/category/${item.slug}`}
                                    className="block text-xs text-green-600 hover:underline"
                                  >
                                    {item.name}
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
