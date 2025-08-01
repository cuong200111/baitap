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
  Package,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, getMediaUrl } from "@/config";
import { toast } from "sonner";
import { apiWrappers } from "@/lib/api-wrapper";

interface GuestPurchase {
  product_id: number;
  product_name: string;
  sku: string;
  price: number;
  sale_price?: number;
  final_price: number;
  quantity: number;
  images: string[];
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

export default function GuestCheckoutPage() {
  const router = useRouter();
  const [guestPurchase, setGuestPurchase] = useState<GuestPurchase | null>(
    null,
  );
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

  useEffect(() => {
    loadGuestPurchase();
    loadSavedCustomerInfo();
  }, []);

  const loadGuestPurchase = async () => {
    try {
      // Try to load from session cart first
      const sessionId = localStorage.getItem("session_id");
      if (sessionId) {
        const cartResponse = await apiWrappers.cart.getAll({ session_id: sessionId });
        if (cartResponse.success && cartResponse.data?.items?.length > 0) {
          // Convert cart items to guest purchase format
          const cartItems = cartResponse.data.items;
          if (cartItems.length === 1) {
            // Single product purchase
            const item = cartItems[0];
            const guestPurchaseData: GuestPurchase = {
              product_id: item.product_id,
              product_name: item.product_name,
              sku: item.sku || '',
              price: item.price,
              sale_price: item.sale_price,
              final_price: item.final_price,
              quantity: item.quantity,
              images: item.images || [],
              total: item.total_price
            };
            setGuestPurchase(guestPurchaseData);
            setLoading(false);
            return;
          } else {
            // Multiple items - redirect to regular checkout
            toast.info("Có nhiều sản phẩm trong giỏ hàng, chuyển đến trang thanh toán thông thường");
            router.push("/checkout");
            return;
          }
        }
      }

      // Fallback to localStorage guest_purchase (legacy)
      const guestPurchaseData = localStorage.getItem("guest_purchase");
      if (guestPurchaseData) {
        setGuestPurchase(JSON.parse(guestPurchaseData));
      } else {
        toast.error("Không tìm thấy sản phẩm để thanh toán");
        router.push("/products");
      }
    } catch (error) {
      console.error("Failed to load guest purchase:", error);
      toast.error("Có lỗi xảy ra khi tải thông tin sản phẩm");
      router.push("/products");
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCustomerInfo = () => {
    try {
      const savedInfo = localStorage.getItem("guest_customer_info");
      if (savedInfo) {
        const parsedInfo = JSON.parse(savedInfo);
        setCustomerInfo(parsedInfo);
        setSaveInfo(true);
      }
    } catch (error) {
      console.error("Failed to load saved customer info:", error);
    }
  };

  const saveCustomerInfoToStorage = () => {
    if (saveInfo) {
      localStorage.setItem("guest_customer_info", JSON.stringify(customerInfo));
    } else {
      localStorage.removeItem("guest_customer_info");
    }
  };

  const validateForm = () => {
    if (!customerInfo.name.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return false;
    }

    if (!customerInfo.email.trim()) {
      toast.error("Vui lòng nhập email");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast.error("Email không hợp lệ");
      return false;
    }

    if (!customerInfo.phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return false;
    }

    const phoneRegex = /^[0-9\s\-\+\(\)]{8,15}$/;
    if (!phoneRegex.test(customerInfo.phone.replace(/\s/g, ""))) {
      toast.error("Số điện thoại không hợp lệ");
      return false;
    }

    if (!customerInfo.address.trim()) {
      toast.error("Vui lòng nhập địa chỉ");
      return false;
    }

    if (!customerInfo.city.trim()) {
      toast.error("Vui lòng nhập tỉnh/thành phố");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !guestPurchase) return;

    try {
      setSubmitting(true);

      // Save customer info to localStorage if requested
      saveCustomerInfoToStorage();

      // Prepare order data
      const shippingAddress = `${customerInfo.address}, ${customerInfo.ward ? customerInfo.ward + ", " : ""}${customerInfo.district ? customerInfo.district + ", " : ""}${customerInfo.city}`;

      const orderData = {
        items: [
          {
            product_id: guestPurchase.product_id,
            quantity: guestPurchase.quantity,
            price: guestPurchase.final_price,
          },
        ],
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        notes: customerInfo.notes,
      };

      console.log("Sending order data:", orderData);

      const data = await apiWrappers.orders.createGuest(orderData);
      console.log("Order response:", data);

      if (data.success && data.data && data.data.order) {
        toast.success("Đặt hàng thành công!");

        // Clear guest purchase data
        localStorage.removeItem("guest_purchase");

        // Redirect to thank you page using correct response structure
        const orderId = data.data.order.id;
        const orderNumber = data.data.order_number;

        console.log("Redirecting to thank-you with:", { orderId, orderNumber });

        router.push(
          `/thank-you?order_id=${orderId}&order_number=${orderNumber}`,
        );
      } else {
        console.error("Order creation failed:", data);
        toast.error(
          data.message || "Đặt hàng thất bại - phản hồi không hợp lệ",
        );
      }
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error("Có lỗi xảy ra khi ��ặt hàng");
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

  if (!guestPurchase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Không tìm thấy sản phẩm
            </h2>
            <p className="text-gray-600 mb-4">
              Vui lòng chọn sản phẩm để tiếp tục
            </p>
            <Button onClick={() => router.push("/products")}>
              Khám phá sản phẩm
            </Button>
          </CardContent>
        </Card>
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
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
              <span>Đặt hàng với tư cách khách</span>
              <Link href="/login" className="text-red-600 hover:underline">
                Đăng nhập để có trải nghiệm tốt hơn
              </Link>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Họ và tên *</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          name: e.target.value,
                        })
                      }
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          phone: e.target.value,
                        })
                      }
                      placeholder="0901234567"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        email: e.target.value,
                      })
                    }
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Địa chỉ cụ thể *</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        address: e.target.value,
                      })
                    }
                    placeholder="Số nhà, tên đường"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ward">Phường/Xã</Label>
                    <Input
                      id="ward"
                      value={customerInfo.ward}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          ward: e.target.value,
                        })
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
                        setCustomerInfo({
                          ...customerInfo,
                          district: e.target.value,
                        })
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
                        setCustomerInfo({
                          ...customerInfo,
                          city: e.target.value,
                        })
                      }
                      placeholder="TP. HCM"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Ghi chú đơn hàng</Label>
                  <Textarea
                    id="notes"
                    value={customerInfo.notes}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Ghi chú về đơn hàng (tùy chọn)"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="save-info"
                    checked={saveInfo}
                    onCheckedChange={(checked) =>
                      setSaveInfo(checked as boolean)
                    }
                  />
                  <Label htmlFor="save-info" className="text-sm">
                    Lưu thông tin này để lần mua hàng sau
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Product Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Sản phẩm đặt mua
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={getMediaUrl(guestPurchase.images[0] || "")}
                      alt={guestPurchase.product_name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {guestPurchase.product_name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      SKU: {guestPurchase.sku}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-red-600 font-semibold">
                        {formatPrice(guestPurchase.final_price)}
                      </span>
                      {guestPurchase.sale_price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(guestPurchase.price)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Số lượng: {guestPurchase.quantity}
                    </p>
                  </div>
                  <div className="text-lg font-semibold">
                    {formatPrice(guestPurchase.total)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Tóm tắt đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(guestPurchase.total)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span className="text-green-600">Miễn phí</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-red-600">
                      {formatPrice(guestPurchase.total)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  {submitting ? "Đang xử lý..." : "Đặt hàng"}
                </Button>

                {/* Security Info */}
                <div className="text-xs text-gray-500 space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span>Thanh toán an toàn SSL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-3 w-3" />
                    <span>Giao hàng toàn quốc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Hỗ trợ 24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
