"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, getMediaUrl } from "@/config";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cartApi, cartUtils, CartItem, CartSummary } from "@/lib/cart-api";

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({
    item_count: 0,
    subtotal: 0,
    shipping_fee: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const result = await cartApi.getCart();

      if (result.success && result.data) {
        setCartItems(result.data.items);
        setSummary(result.data.summary);

        // Show notification if items were removed due to insufficient stock
        if (result.removed_items && result.removed_items.length > 0) {
          const removedNames = result.removed_items.map(item => item.product_name).join(", ");
          toast.warning(`Đã tự động xóa khỏi giỏ hàng: ${removedNames} (không đủ số lượng trong kho)`);
        }
      } else {
        setCartItems([]);
        setSummary({
          item_count: 0,
          subtotal: 0,
          shipping_fee: 0,
          total: 0,
        });
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
      toast.error("Có lỗi xảy ra khi tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setUpdating(cartItemId);
      const result = await cartApi.updateQuantity(cartItemId, newQuantity);

      if (result.success) {
        await loadCart();
        cartUtils.triggerCartUpdate();
        toast.success("Cập nhật giỏ hàng thành công");
      } else {
        toast.error(result.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Failed to update cart:", error);
      toast.error("Có lỗi xảy ra khi cập nhật giỏ hàng");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      const result = await cartApi.removeItem(cartItemId);

      if (result.success) {
        await loadCart();
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

  const clearCart = async () => {
    try {
      const result = await cartApi.clearCart();

      if (result.success) {
        await loadCart();
        cartUtils.triggerCartUpdate();
        toast.success("Đã xóa tất cả sản phẩm khỏi giỏ hàng");
      } else {
        toast.error(result.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
      toast.error("Có lỗi xảy ra khi xóa giỏ hàng");
    }
  };

  const handleQuantityChange = (cartItemId: number, delta: number) => {
    const item = cartItems.find((item) => item.id === cartItemId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity >= 1 && newQuantity <= item.stock_quantity) {
      updateQuantity(cartItemId, newQuantity);
    }
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg">
                  <div className="flex space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/products">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tiếp tục mua hàng
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
              <p className="text-gray-600">
                {summary.item_count} sản phẩm trong giỏ hàng
              </p>
            </div>
          </div>
          {cartItems.length > 0 && (
            <Button variant="outline" onClick={clearCart}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa tất cả
            </Button>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart */
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Giỏ hàng trống
              </h2>
              <p className="text-gray-600 mb-6">
                Hãy thêm một số sản phẩm để bắt đầu mua sắm
              </p>
              <Link href="/products">
                <Button>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Bắt đầu mua hàng
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      {/* Product Image */}
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={
                            getMediaUrl(item.images[0]) || "/placeholder.svg"
                          }
                          alt={item.product_name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              <Link
                                href={`/products/${item.product_id}`}
                                className="hover:text-blue-600"
                              >
                                {item.product_name}
                              </Link>
                            </h3>
                            <p className="text-sm text-gray-500">
                              SKU: {item.sku}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              {item.sale_price && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(item.price)}
                                </span>
                              )}
                              <span className="text-lg font-semibold text-red-600">
                                {formatPrice(item.final_price)}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              Số lượng:
                            </span>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(item.id, -1)
                                }
                                disabled={
                                  item.quantity <= 1 || updating === item.id
                                }
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">
                                {updating === item.id ? "..." : item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, 1)}
                                disabled={
                                  item.quantity >= item.stock_quantity ||
                                  updating === item.id
                                }
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-xs text-gray-500">
                              (Còn {item.stock_quantity} sản phẩm)
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-semibold text-gray-900">
                              {formatPrice(item.total_price)}
                            </span>
                          </div>
                        </div>

                        {/* Stock Warning */}
                        {item.stock_quantity <= 5 && (
                          <Alert className="mt-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Chỉ còn {item.stock_quantity} sản phẩm trong kho
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Tóm tắt đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span>{formatPrice(summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Tổng cộng</span>
                      <span className="text-red-600">
                        {formatPrice(summary.total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={proceedToCheckout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Tiến hành thanh toán
                  </Button>

                  <div className="text-center">
                    <Link href="/products">
                      <Button variant="outline" className="w-full">
                        Tiếp tục mua hàng
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
