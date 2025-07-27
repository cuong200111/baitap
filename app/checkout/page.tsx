"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CreditCard,
  Truck,
  Shield,
  CheckCircle,
  AlertCircle,
  User,
  Save,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Domain, formatPrice, getMediaUrl } from "@/config";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  final_price: number;
  quantity: number;
  images: string[];
  total: number;
}

interface CartSummary {
  itemCount: number;
  subtotal: number;
  total: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  notes: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({
    itemCount: 0,
    subtotal: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    notes: "",
  });

  // Get user ID from auth context, null for guests
  const userId = user?.id || null;

  useEffect(() => {
    loadCart();
    loadCustomerInfo();
  }, [user]);

  const loadCustomerInfo = async () => {
    if (user) {
      // Load complete user profile from API to get address fields
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${Domain}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const profile = data.data;
            setCustomerInfo({
              name: profile.full_name || "",
              email: profile.email || "",
              phone: profile.phone || "",
              address: profile.address || "",
              city: profile.province_name || "",
              district: profile.district_name || "",
              ward: profile.ward_name || "",
              notes: "",
            });
            return;
          }
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }

      // Fallback to user object from context if API fails
      setCustomerInfo({
        name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.province_name || "",
        district: user.district_name || "",
        ward: user.ward_name || "",
        notes: "",
      });
    } else {
      // Load from localStorage for guest users
      const savedInfo = localStorage.getItem("guestCheckoutInfo");
      if (savedInfo) {
        try {
          const parsed = JSON.parse(savedInfo);
          setCustomerInfo(parsed);
          setSaveInfo(true); // Auto-check save info if data exists
        } catch (error) {
          console.error("Failed to parse saved checkout info:", error);
        }
      }
    }
  };

  const saveCustomerInfoToStorage = () => {
    if (!user && saveInfo) {
      localStorage.setItem("guestCheckoutInfo", JSON.stringify(customerInfo));
      toast.success("Đã lưu thông tin để sử dụng cho lần sau");
    }
  };

  const loadCart = async () => {
    try {
      setLoading(true);

      if (!userId) {
        // For guest users, check localStorage cart
        const guestCart = localStorage.getItem("guest_cart");
        if (!guestCart) {
          toast.error("Giỏ hàng trống");
          router.push("/cart");
          return;
        }

        try {
          const cartData = JSON.parse(guestCart);
          if (!cartData.items || cartData.items.length === 0) {
            toast.error("Giỏ hàng trống");
            router.push("/cart");
            return;
          }
          setCartItems(cartData.items);
          setSummary(cartData.summary);
        } catch (error) {
          toast.error("Lỗi giỏ hàng, vui lòng thử lại");
          router.push("/cart");
          return;
        }
      } else {
        // For authenticated users, use API
        const response = await fetch(`/api/cart?user_id=${userId}`);
        const data = await response.json();

        if (data.success) {
          setCartItems(data.data.items);
          setSummary(data.data.summary);

          // Redirect if cart is empty
          if (data.data.items.length === 0) {
            toast.error("Giỏ hàng trống");
            router.push("/cart");
            return;
          }
        } else {
          toast.error("Không thể tải giỏ hàng");
          router.push("/cart");
        }
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
      toast.error("Có lỗi xảy ra khi tải giỏ hàng");
      router.push("/cart");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const required = ["name", "email", "phone", "address", "city"];

    for (const field of required) {
      if (!customerInfo[field as keyof CustomerInfo].trim()) {
        toast.error(
          `Vui lòng nhập ${
            field === "name"
              ? "họ tên"
              : field === "email"
                ? "email"
                : field === "phone"
                  ? "số điện thoại"
                  : field === "address"
                    ? "địa chỉ"
                    : "thành phố"
          }`,
        );
        return false;
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast.error("Email không hợp lệ");
      return false;
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(customerInfo.phone.replace(/\s/g, ""))) {
      toast.error("Số điện thoại không hợp lệ");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Save guest info to localStorage if requested
      saveCustomerInfoToStorage();

      // Prepare order data
      const shippingAddress = `${customerInfo.address}, ${customerInfo.ward ? customerInfo.ward + ", " : ""}${customerInfo.district ? customerInfo.district + ", " : ""}${customerInfo.city}`;

      const orderData = {
        user_id: userId, // null for guest orders
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.final_price,
        })),
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        notes: customerInfo.notes,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đặt hàng thành công!");

        // Clear cart after successful order
        if (userId) {
          // Clear database cart for authenticated users
          try {
            await fetch("/api/cart", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: userId, clear_all: true }),
            });
          } catch (e) {
            console.log("Cart clear error:", e);
          }
        } else {
          // Clear guest cart from localStorage
          localStorage.removeItem("guest_cart");
        }

        // Trigger cart update in header
        window.dispatchEvent(new Event("cartUpdated"));

        // Redirect to thank you page with order details
        router.push(
          `/thank-you?order_id=${data.data.id}&order_number=${data.data.order_number}`,
        );
      } else {
        toast.error(data.message || "Đặt hàng thất bại");
      }
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error("Có lỗi xảy ra khi đặt hàng");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
            <div className="flex items-center gap-2 mt-2">
              {user ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <User className="h-4 w-4" />
                  <span>Đăng nhập với tài khoản: {user.email}</span>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Đặt hàng với tư cách khách</span>
                  <Link href="/login" className="text-red-600 hover:underline">
                    Đăng nhập
                  </Link>
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push("/cart")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại giỏ hàng
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Thông tin liên hệ
                  {user && (
                    <Link
                      href="/profile"
                      className="ml-auto text-sm text-red-600 hover:underline"
                    >
                      Cập nhật profile
                    </Link>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Họ và tên *</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Nguyễn Văn A"
                      disabled={!!user}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="0912345678"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="example@email.com"
                    disabled={!!user}
                  />
                </div>

                {/* Save info checkbox for guests */}
                {!user && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveInfo"
                      checked={saveInfo}
                      onCheckedChange={(checked) =>
                        setSaveInfo(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="saveInfo"
                      className="text-sm cursor-pointer"
                    >
                      <Save className="h-3 w-3 inline mr-1" />
                      Lưu thông tin để sử dụng cho lần sau
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  ��ịa chỉ giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Địa chỉ *</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="123 Đường ABC"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ward">Phường/Xã</Label>
                    <Input
                      id="ward"
                      value={customerInfo.ward}
                      onChange={(e) =>
                        handleInputChange("ward", e.target.value)
                      }
                      placeholder="Phường 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">Quận/Huyện</Label>
                    <Input
                      id="district"
                      value={customerInfo.district}
                      onChange={(e) =>
                        handleInputChange("district", e.target.value)
                      }
                      placeholder="Quận 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Tỉnh/Thành phố *</Label>
                    <Input
                      id="city"
                      value={customerInfo.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      placeholder="TP. Hồ Chí Minh"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Ghi chú đơn hàng</Label>
                  <Textarea
                    id="notes"
                    value={customerInfo.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Ghi chú thêm về đơn hàng (tùy chọn)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Phương thức thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Hiện tại chỉ hỗ trợ thanh toán khi nhận hàng (COD)
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Đ��n hàng của bạn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-3 border-b last:border-b-0"
                  >
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={getMediaUrl(item.images[0] || "")}
                        alt={item.product_name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {item.product_name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatPrice(item.final_price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      {formatPrice(item.total)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Order Total */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(summary.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span className="text-green-600">Miễn phí</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-red-600">
                      {formatPrice(summary.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
            >
              {submitting ? (
                "Đang xử lý..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Đặt hàng ({formatPrice(summary.total)})
                </>
              )}
            </Button>

            {/* Security Info */}
            <div className="text-xs text-gray-500 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>Thông tin của bạn được bảo mật</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Miễn phí đổi trả trong 7 ngày</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-3 w-3" />
                <span>Giao hàng nhanh toàn quốc</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
