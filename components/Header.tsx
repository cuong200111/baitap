import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Phone,
  MapPin,
  Heart,
  Bell,
  LogOut,
  Settings,
} from "lucide-react";
import { DynamicCategoryMegaMenu } from "./DynamicCategoryMegaMenu";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Domain } from "@/config";

export function Header() {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadCartCount();

    // Reload cart count when page becomes visible (after user adds items)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCartCount();
      }
    };

    // Listen for cart update events
    const handleCartUpdate = () => {
      loadCartCount();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("cartUpdated", handleCartUpdate);

    // Also reload every 30 seconds
    const interval = setInterval(loadCartCount, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("cartUpdated", handleCartUpdate);
      clearInterval(interval);
    };
  }, [user, isAuthenticated]);

  const loadCartCount = async () => {
    try {
      if (isAuthenticated && user?.id) {
        // Load cart count for authenticated users with retry logic
        let retries = 2;
        while (retries > 0) {
          try {
            const token = localStorage.getItem("token");
            const headers: HeadersInit = {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
            const response = await fetch(
              `${Domain}/api/cart?user_id=${user.id}`,
              {
                headers,
                signal: AbortSignal.timeout(10000), // 10 second timeout
              },
            );

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
              setCartCount(data.data.summary.itemCount || 0);
              return; // Success, exit retry loop
            } else {
              throw new Error(data.message || "Failed to load cart data");
            }
          } catch (error) {
            retries--;
            if (retries === 0) {
              throw error; // Final attempt failed
            }
            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      } else {
        // Load cart count for guest users from localStorage
        const guestCart = localStorage.getItem("guest_cart");
        if (guestCart) {
          try {
            const parsedCart = JSON.parse(guestCart);
            const totalItems = Object.values(parsedCart).reduce(
              (sum: number, qty: any) => sum + qty,
              0,
            );
            setCartCount(totalItems);
          } catch (parseError) {
            console.error("Error parsing guest cart:", parseError);
            localStorage.removeItem("guest_cart"); // Clean up corrupted data
            setCartCount(0);
          }
        } else {
          setCartCount(0);
        }
      }
    } catch (error) {
      console.error("Failed to load cart count:", error);
      // Don't show error to user for cart count, just set to 0
      setCartCount(0);
    }
  };

  return (
    <header className="w-full">
      {/* Top banner */}
      <div className="bg-red-600 text-white text-center py-2 text-sm">
        <div className="container mx-auto px-4">
          🔥 KHUYẾN MÃI HOT: Gi��m đến 50% cho tất cả s���n phẩm Gaming - Miễn
          phí giao hàng toàn quốc
        </div>
      </div>

      {/* Main header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          {/* Top header info */}
          <div className="flex items-center justify-between py-2 text-sm border-b">
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-1" />
                <span>Hotline: 1900.1903</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>Hệ thống 63 cửa hàng toàn quốc</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-600 text-sm">
                    Xin chào, {user.full_name}
                  </span>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Quản trị
                    </Link>
                  )}
                  <Link
                    href="/orders"
                    className="text-gray-600 hover:text-red-600"
                  >
                    Đơn hàng
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-red-600"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="text-gray-600 hover:text-red-600"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
              <Link
                href="/track-order"
                className="text-gray-600 hover:text-red-600"
              >
                Tra cứu đơn hàng
              </Link>
            </div>
          </div>

          {/* Main navigation */}
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <div className="font-bold text-xl text-gray-900">HACOM</div>
                <div className="text-xs text-gray-500">Siêu thị máy tính</div>
              </div>
            </Link>

            {/* Search bar */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm, thương hiệu..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <Button
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 bg-red-600 hover:bg-red-700"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-red-600"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-red-600"
              >
                <Heart className="h-5 w-5" />
              </Button>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-600 hover:text-red-600"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Thông tin cá nhân</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">Đơn hàng của tôi</Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Settings className="h-4 w-4 mr-2" />
                            Quản trị viên
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 hover:text-red-600"
                >
                  <Link href="/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Link href="/cart" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 hover:text-red-600"
                >
                  <ShoppingCart className="h-5 w-5" />
                </Button>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Category navigation */}
          <DynamicCategoryMegaMenu />
        </div>
      </div>
    </header>
  );
}
