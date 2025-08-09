"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  User,
  Phone,
  MapPin,
  LogOut,
  Settings,
  Package,
  CreditCard,
  UserCircle,
  Home,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { SimpleDbCategoryMenu } from "./SimpleDbCategoryMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminSiteName } from "@/contexts/AdminSeoContext";
import { CartPopup } from "./CartPopup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { formatPrice, getMediaUrl, Domain } from "@/config";

interface SearchResult {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price?: number;
  final_price: number;
  image?: string;
}

interface SearchSuggestion {
  type: string;
  text: string;
  slug: string;
}

export function EnhancedHeader() {
  const { user, logout, isAdmin, isAuthenticated, loading, initializing } =
    useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestion[]
  >([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Wait for auth to finish initializing before setting up cart functionality
    if (initializing || loading) return;

    if (isAuthenticated && user?.id) {
      loadCartCount();
    } else {
      setCartCount(0);
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user?.id) {
        loadCartCount();
      }
    };

    const handleCartUpdate = () => {
      if (isAuthenticated && user?.id) {
        loadCartCount();
      } else {
        setCartCount(0);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("cartUpdated", handleCartUpdate);

    let interval;
    if (isAuthenticated && user?.id) {
      interval = setInterval(loadCartCount, 30000);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("cartUpdated", handleCartUpdate);
      if (interval) clearInterval(interval);
    };
  }, [user, isAuthenticated, loading, initializing]);

  // Handle click outside search to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadCartCount = async () => {
    if (!isAuthenticated || !user?.id) {
      setCartCount(0);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${Domain}/api/cart?user_id=${user.id}`, {
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setCartCount(data.data.summary.itemCount || 0);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error("Failed to load cart count:", error);
      setCartCount(0);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
      setShowSearchResults(false);
    }
  };

  const performSearch = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearchSuggestions([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(
        `${Domain}/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=5`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.data.products || []);
          setSearchSuggestions(data.data.suggestions || []);
          setShowSearchResults(true);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 2) {
      performSearch(searchQuery);
    }
  };

  const handleResultClick = (productId: number) => {
    window.location.href = `/products/${productId}`;
    setShowSearchResults(false);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="w-full">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white text-center py-2 text-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-4">
            <span className="animate-pulse">🔥</span>
            <span className="font-medium">
              KHUYẾN MÃI HOT: Giảm đ��n 50% cho tất cả sản phẩm Gaming
            </span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">
              Miễn phí giao hàng toàn quốc
            </span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          {/* Top header info */}
          <div className="flex items-center justify-between py-2 text-sm border-b border-gray-100">
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-gray-600 hover:text-red-600 transition-colors">
                <Phone className="h-4 w-4 mr-1" />
                <span className="font-medium">Hotline: 1900.1903</span>
              </div>
              <div className="hidden md:flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>Hệ thống 63 cửa hàng toàn quốc</span>
              </div>
              <div className="hidden lg:flex items-center text-gray-600">
                <Home className="h-4 w-4 mr-1" />
                <span>Showroom HCM & Hà Nội</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-600 text-sm hidden md:inline">
                    Xin chào,{" "}
                    <span className="font-medium text-gray-800">
                      {user.full_name}
                    </span>
                  </span>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center space-x-1"
                    >
                      <Settings className="h-3 w-3" />
                      <span>Quản trị</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-red-600 font-medium text-sm"
                  >
                    Đăng nhập
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    href="/register"
                    className="text-gray-600 hover:text-red-600 font-medium text-sm"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
              <Link
                href="/track-order"
                className="text-gray-600 hover:text-red-600 text-sm font-medium hidden lg:inline"
              >
                Tra cứu đơn hàng
              </Link>
            </div>
          </div>

          {/* Main navigation */}
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <div>
                <div className="font-bold text-xl text-gray-900 tracking-tight">
                  {useSiteName()}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  Siêu thị công nghệ
                </div>
              </div>
            </Link>

            {/* Search bar with autocomplete */}
            <div className="flex-1 max-w-2xl mx-8" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchFocus}
                  placeholder="Tìm sản phẩm, thương hiệu mà bạn mong muốn..."
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  <Search className="h-4 w-4" />
                </Button>

                {/* Search Results Dropdown */}
                {showSearchResults &&
                  (searchResults.length > 0 ||
                    searchSuggestions.length > 0) && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-96 overflow-y-auto">
                      {/* Product Results */}
                      {searchResults.length > 0 && (
                        <div className="p-3 border-b border-gray-100">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Sản phẩm
                          </h4>
                          <div className="space-y-2">
                            {searchResults.map((product) => (
                              <div
                                key={product.id}
                                onClick={() => handleResultClick(product.id)}
                                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                              >
                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                  {product.image ? (
                                    <Image
                                      src={getMediaUrl(product.image)}
                                      alt={product.name}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                      <Package className="h-4 w-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {product.name}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-semibold text-red-600">
                                      {formatPrice(product.final_price)}
                                    </span>
                                    {product.sale_price && (
                                      <span className="text-xs text-gray-500 line-through">
                                        {formatPrice(product.price)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View All Results */}
                      {searchQuery.trim() && (
                        <div className="p-3">
                          <button
                            onClick={handleSearch}
                            className="w-full text-left text-sm text-red-600 hover:text-red-700 font-medium flex items-center justify-between"
                          >
                            <span>Xem tất cả kết quả cho "{searchQuery}"</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                {/* Loading indicator */}
                {searchLoading && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 p-4 text-center">
                    <div className="text-sm text-gray-500">
                      Đang tìm kiếm...
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right actions */}
            <div className="flex items-center space-x-3">
              {/* User Account */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl px-3 py-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.avatar || ""}
                          alt={user.full_name}
                        />
                        <AvatarFallback className="bg-red-100 text-red-700 text-sm font-medium">
                          {getUserInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-20">
                          {user.full_name.split(" ")[0]}
                        </div>
                        <div className="text-xs text-gray-500">Tài khoản</div>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.full_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <UserCircle className="h-4 w-4 mr-2" />
                        Thông tin cá nhân
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Đơn hàng của tôi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/billing" className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Thông tin thanh toán
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center">
                            <Settings className="h-4 w-4 mr-2" />
                            Quản trị viên
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="flex items-center space-x-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <Link href="/login">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">Đăng nhập</span>
                  </Link>
                </Button>
              )}

              {/* Shopping Cart */}
              <CartPopup cartCount={cartCount} />
            </div>
          </div>

          {/* Category navigation */}
          <SimpleDbCategoryMenu />
        </div>
      </div>
    </header>
  );
}
