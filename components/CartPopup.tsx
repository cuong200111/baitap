"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  Package,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, getMediaUrl } from "@/config";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cartApi, cartUtils } from "@/lib/cart-api";

interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  price: number;
  sale_price?: number;
  final_price: number;
  quantity: number;
  stock_quantity: number;
  images: string[];
  total: number;
}

interface CartSummary {
  itemCount: number;
  subtotal: number;
  total: number;
}

interface CartPopupProps {
  cartCount: number;
}

export function CartPopup({ cartCount }: CartPopupProps) {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({
    itemCount: 0,
    subtotal: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const result = await cartApi.getCart();

      if (result.success && result.data) {
        setCartItems(result.data.items);
        setSummary({
          itemCount: result.data.summary.item_count,
          subtotal: result.data.summary.subtotal,
          total: result.data.summary.total,
        });
      } else {
        setCartItems([]);
        setSummary({ itemCount: 0, subtotal: 0, total: 0 });
      }
    } catch (error) {
      console.error("Failed to load cart items:", error);
      setCartItems([]);
      setSummary({ itemCount: 0, subtotal: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId: number, newQuantity: number) => {
    if (!user?.id) return;

    try {
      setUpdating(cartId);

      const response = await fetch(`${Domain}/api/cart`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId, quantity: newQuantity }),
      });

      const data = await response.json();

      if (data.success) {
        await loadCartItems();
        window.dispatchEvent(new Event("cartUpdated"));
        toast.success("Cập nhật giỏ hàng thành công");
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Failed to update cart:", error);
      toast.error("Có lỗi xảy ra khi cập nh���t giỏ hàng");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      const result = await cartApi.removeItem(cartItemId);

      if (result.success) {
        await loadCartItems();
        cartUtils.triggerCartUpdate();
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
      } else {
        toast.error(result.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Có lỗi xảy ra khi xóa sản phẩm");
    }
  };

  const handleQuantityChange = (
    cartId: number,
    currentQuantity: number,
    delta: number,
  ) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity >= 0) {
      updateQuantity(cartId, newQuantity);
    }
  };

  // Load cart items when popup opens
  useEffect(() => {
    if (isOpen && isAuthenticated && user?.id) {
      loadCartItems();
    }
  }, [isOpen, isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="relative">
        <Button
          variant="outline"
          size="icon"
          className="text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-200 rounded-xl"
        >
          <ShoppingCart className="h-5 w-5" />
        </Button>
      </Link>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer">
          <Button
            variant="outline"
            size="icon"
            className="text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-200 rounded-xl"
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
          {cartCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500 hover:bg-red-600 flex items-center justify-center rounded-full">
              {cartCount > 99 ? "99+" : cartCount}
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Giỏ hàng ({cartCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Giỏ hàng trống</p>
                <Button asChild className="mt-3" size="sm">
                  <Link href="/products">Khám phá sản phẩm</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {cartItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={getMediaUrl(item.images[0] || "")}
                          alt={item.product_name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product_name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {formatPrice(item.final_price)} × {item.quantity}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-gray-200 rounded">
                            <button
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity, -1)
                              }
                              disabled={updating === item.id}
                              className="p-1 hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 text-xs">
                              {updating === item.id ? "..." : item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity, 1)
                              }
                              disabled={
                                updating === item.id ||
                                item.quantity >= item.stock_quantity
                              }
                              className="p-1 hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatPrice(item.total)}
                      </div>
                    </div>
                  ))}
                  {cartItems.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      và {cartItems.length - 5} sản phẩm khác...
                    </p>
                  )}
                </div>

                {/* Summary */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Tạm tính:</span>
                    <span>{formatPrice(summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Tổng cộng:</span>
                    <span className="text-red-600">
                      {formatPrice(summary.total)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button asChild className="w-full" size="sm">
                    <Link href="/cart">Xem giỏ hàng</Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="sm"
                  >
                    <Link href="/checkout">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Thanh toán
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
