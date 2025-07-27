"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Category } from "../types";
import { categoriesApi } from "../config";

export function CategoryMegaMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = (categoryId: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveCategory(categoryId);
  };

  const handleMouseLeave = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Add delay to prevent menu from disappearing when moving mouse to dropdown
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 150);
  };

  const handleMenuMouseEnter = () => {
    // Clear timeout when entering menu area
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMenuMouseLeave = () => {
    // Immediately close when leaving menu area
    setActiveCategory(null);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="hidden md:flex items-center space-x-8 py-3 border-t">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-8 py-3 border-t">
        <Button
          variant="ghost"
          className="flex items-center space-x-1 text-gray-700 hover:text-red-600"
          onMouseEnter={() => handleMouseEnter("all")}
          onMouseLeave={handleMouseLeave}
        >
          <Menu className="h-4 w-4" />
          <span>Danh mục sản phẩm</span>
          <ChevronDown className="h-4 w-4" />
        </Button>

        <nav className="flex items-center space-x-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => handleMouseEnter(category.id.toString())}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={`/category/${category.slug}`}
                className="text-gray-700 hover:text-red-600 font-medium flex items-center space-x-1"
              >
                <span>{category.name}</span>
                {category.children && category.children.length > 0 && (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Link>
            </div>
          ))}
          <Link href="/sale" className="text-red-600 font-bold">
            🔥 SALE
          </Link>
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center py-3 border-t">
        <Button
          variant="ghost"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center space-x-1 text-gray-700"
        >
          <Menu className="h-4 w-4" />
          <span>Danh mục</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Mega Menu Dropdown */}
      {activeCategory && activeCategory !== "all" && (
        <div
          className="absolute top-full left-0 w-full z-50"
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <div className="bg-white shadow-lg border-t">
            <div className="container mx-auto px-4 py-8">
              {(() => {
                const category = categories.find(
                  (cat) => cat.id.toString() === activeCategory,
                );
                if (!category) return null;

                return (
                  <div className="grid grid-cols-4 gap-8">
                    {/* Categories */}
                    <div className="col-span-3">
                      <div className="grid grid-cols-3 gap-6">
                        {category.children?.map((subcategory) => (
                          <div key={subcategory.id}>
                            <Link
                              href={`/category/${subcategory.slug}`}
                              className="font-semibold text-gray-900 hover:text-red-600 block mb-3"
                            >
                              {subcategory.name}
                            </Link>
                            <ul className="space-y-2">
                              {subcategory.children?.map((item) => (
                                <li key={item.id}>
                                  <Link
                                    href={`/category/${item.slug}`}
                                    className="text-sm text-gray-600 hover:text-red-600"
                                  >
                                    {item.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Featured Products - TODO: Load from API */}
                    <div className="col-span-1">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Sản phẩm nổi bật
                      </h3>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                          Sản phẩm nổi bật sẽ được tải từ API
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* All Categories Mega Menu */}
      {activeCategory === "all" && (
        <div
          className="absolute top-full left-0 w-full z-50"
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <div className="bg-white shadow-lg border-t">
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-6 gap-6">
                {categories.map((category) => (
                  <div key={category.id}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="font-semibold text-gray-900 hover:text-red-600 block mb-3"
                    >
                      {category.name}
                    </Link>
                    <ul className="space-y-2">
                      {category.children?.slice(0, 4).map((subcategory) => (
                        <li key={subcategory.id}>
                          <Link
                            href={`/category/${subcategory.slug}`}
                            className="text-sm text-gray-600 hover:text-red-600"
                          >
                            {subcategory.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t z-50">
          <div className="p-4 space-y-4">
            {categories.map((category) => (
              <div key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="font-medium text-gray-900 hover:text-red-600 block py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
                {category.children && category.children.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {category.children.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        href={`/category/${subcategory.slug}`}
                        className="block text-sm text-gray-600 hover:text-red-600 py-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
