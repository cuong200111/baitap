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
import { formatPrice, getMediaUrl } from "@/config";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cartApi, cartUtils, CartItem, CartSummary } from "@/lib/cart-api";
import { apiWrappers } from "@/lib/api-wrapper";
import { API_CONFIG } from "@/lib/config-client";

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
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({
    item_count: 0,
    subtotal: 0,
    shipping_fee: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const [saveInfo, setSaveInfo] = useState(false);
  const [addressLoadedFromProfile, setAddressLoadedFromProfile] =
    useState(false);

  useEffect(() => {
    loadCart();
    loadSavedCustomerInfo();
    if (isAuthenticated && user?.id) {
      loadUserAddress();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomerInfo((prev) => ({
        ...prev,
        name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
      // Load user address when user becomes available
      loadUserAddress();
    }
  }, [isAuthenticated, user]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const result = await cartApi.getCart();

      if (result.success && result.data?.items?.length > 0) {
        setCartItems(result.data.items);
        setSummary(result.data.summary);
      } else {
        toast.error("Giỏ hàng trống");
        router.push("/cart");
        return;
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
      toast.error("Có lỗi xảy ra khi tải giỏ hàng");
      router.push("/cart");
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCustomerInfo = () => {
    try {
      const saved = localStorage.getItem("customer_info");
      if (saved) {
        const parsedInfo = JSON.parse(saved);
        setCustomerInfo((prev) => ({
          ...prev,
          ...parsedInfo,
        }));
        setSaveInfo(true);
      }
    } catch (error) {
      console.error("Failed to load saved customer info:", error);
    }
  };

  const loadUserAddress = async () => {
    if (!isAuthenticated || !user?.id) {
      console.log("📍 No authenticated user, skipping address load");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("📍 No token found, skipping address load");
        return;
      }

      console.log("📍 Loading user address from API...");
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📍 Address API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📍 Address API data:", data);

        if (data.success && data.data?.length > 0) {
          // Get the default or first address
          const address = data.data[0];
          console.log("📍 Using address:", address);

          setCustomerInfo((prev) => ({
            ...prev,
            name: address.full_name || prev.name,
            phone: address.phone || prev.phone,
            address: address.address_line_1 || "",
            city: address.city || "",
            district: address.district || "",
            ward: address.ward || "",
          }));
          setAddressLoadedFromProfile(true);
          console.log("✅ Successfully loaded and applied user address");
          toast.success("Địa chỉ đã được tải từ hồ sơ của bạn");
        } else {
          console.log("📍 No addresses found for user");
        }
      } else {
        console.log(
          "📍 Address API request failed:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("❌ Failed to load user address:", error);
    }
  };

  const saveCustomerInfoToStorage = () => {
    if (saveInfo) {
      localStorage.setItem("customer_info", JSON.stringify(customerInfo));
    } else {
      localStorage.removeItem("customer_info");
    }
  };

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const required = ["name", "email", "phone", "address", "city"];

    for (const field of required) {
      if (!customerInfo[field as keyof CustomerInfo].trim()) {
        const fieldNames: Record<string, string> = {
          name: "họ tên",
          email: "email",
          phone: "số điện thoại",
          address: "địa chỉ",
          city: "tỉnh/thành phố",
        };
        toast.error(`Vui lòng nhập ${fieldNames[field]}`);
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

      // Save customer info to localStorage if requested
      saveCustomerInfoToStorage();

      // Prepare order data
      const shippingAddress = `${customerInfo.address}, ${customerInfo.ward ? customerInfo.ward + ", " : ""}${customerInfo.district ? customerInfo.district + ", " : ""}${customerInfo.city}`;

      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.final_price,
        })),
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        payment_method: "cod", // Cash on delivery
        notes: customerInfo.notes,
      };

      let result;
      if (isAuthenticated && user?.id) {
        // Authenticated user order
        result = await apiWrappers.orders.create(orderData);
      } else {
        // Guest order
        result = await apiWrappers.orders.createGuest(orderData);
      }

      if (result.success && result.data) {
        toast.success("Đặt hàng thành công!");

        // Clear cart after successful order
        await cartApi.clearCart();
        cartUtils.triggerCartUpdate();

        // Get order info
        const orderId = result.data.order?.id || result.data.id;
        const orderNumber = result.data.order_number;

        // Redirect to thank you page
        router.push(
          `/thank-you?order_id=${orderId}&order_number=${orderNumber}`,
        );
      } else {
        toast.error(result.message || "Đặt hàng thất bại");
      }
    } catch (error) {
      console.error("Order submission failed:", error);
      toast.error("Có lỗi xảy ra khi đặt hàng");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
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
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/cart">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại giỏ hàng
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
            <p className="text-gray-600">Hoàn tất đơn hàng của bạn</p>
          </div>
        </div>

        {/* Address loaded notification */}
        {addressLoadedFromProfile && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Địa chỉ đã được tự động điền từ thông tin trong hồ sơ của bạn. Bạn
              có thể chỉnh sửa nếu cần.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Thông tin khách hàng
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
                      placeholder="Nhập họ và tên"
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
                      placeholder="Nhập số điện thoại"
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
                    placeholder="Nhập địa chỉ email"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Địa chỉ *</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="Số nhà, tên đường"
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
                      placeholder="Nhập phường/xã"
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
                      placeholder="Nhập quận/huyện"
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
                      placeholder="Nhập tỉnh/thành phố"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Ghi chú đơn hàng</Label>
                  <Textarea
                    id="notes"
                    value={customerInfo.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Ghi chú về đơn hàng (tùy chọn)"
                    rows={3}
                  />
                </div>

                {!isAuthenticated && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="save-info"
                      checked={saveInfo}
                      onCheckedChange={(checked) =>
                        setSaveInfo(checked as boolean)
                      }
                    />
                    <Label htmlFor="save-info" className="text-sm">
                      Lưu thông tin cho lần mua hàng tiếp theo
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Phương thức thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Truck className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-green-800">
                        Thanh toán khi nhận hàng (COD)
                      </h3>
                      <p className="text-sm text-green-600">
                        Bạn chỉ thanh toán khi nhận được hàng
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>��ơn hàng của bạn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex space-x-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={
                            getMediaUrl(item.images[0]) || "/placeholder.svg"
                          }
                          alt={item.product_name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Số lượng: {item.quantity}
                        </p>
                        <p className="text-sm font-medium text-red-600">
                          {formatPrice(item.total_price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Total */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span>{formatPrice(summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Tổng cộng</span>
                      <span className="text-red-600">
                        {formatPrice(summary.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full mt-6 bg-red-600 hover:bg-red-700"
                >
                  {submitting ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Đặt hàng
                    </>
                  )}
                </Button>

                {/* Security Icons */}
                <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Bảo mật
                  </div>
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 mr-1" />
                    Giao hàng nhanh
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
