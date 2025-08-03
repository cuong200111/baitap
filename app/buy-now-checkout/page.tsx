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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  buyNowApi,
  buyNowUtils,
  BuyNowItem,
  BuyNowSummary,
} from "@/lib/buy-now-api";
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

export default function BuyNowCheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);
  const [summary, setSummary] = useState<BuyNowSummary>({
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
    loadBuyNowSession();
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

  const loadBuyNowSession = () => {
    try {
      setLoading(true);
      const buyNowSession = buyNowApi.getBuyNowSession();

      if (!buyNowSession) {
        toast.error("Phiên mua ngay đã hết hạn hoặc không tồn tại");
        router.push("/products");
        return;
      }

      setBuyNowItem(buyNowSession.item);
      setSummary(buyNowSession.summary);
    } catch (error) {
      console.error("Failed to load buy now session:", error);
      toast.error("Có lỗi xảy ra khi tải thông tin sản phẩm");
      router.push("/products");
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
    if (!validateForm() || !buyNowItem) return;

    try {
      setSubmitting(true);

      // Save customer info to localStorage if requested
      saveCustomerInfoToStorage();

      // Prepare order data
      const shippingAddress = `${customerInfo.address}, ${customerInfo.ward ? customerInfo.ward + ", " : ""}${customerInfo.district ? customerInfo.district + ", " : ""}${customerInfo.city}`;

      const orderData = {
        items: [
          {
            product_id: buyNowItem.product_id,
            quantity: buyNowItem.quantity,
            price: buyNowItem.final_price,
          },
        ],
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

        // Clear buy now session after successful order
        buyNowApi.clearBuyNowSession();

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

  if (!buyNowItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Phiên mua ngay không tồn tại
            </h2>
            <p className="text-gray-600 mb-4">
              Phiên mua ngay đã hết hạn hoặc không tồn tại
            </p>
            <Button onClick={() => router.push("/products")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Về trang sản phẩm
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
        <div className="flex items-center space-x-4 mb-8">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mua ngay</h1>
            <p className="text-gray-600">Thanh toán nhanh chóng</p>
          </div>
        </div>

        {/* Buy Now indicator */}
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <Package className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Bạn đang mua ngay sản phẩm &quot;{buyNowItem.product_name}&quot;.
            Sản phẩm này sẽ không được thêm vào giỏ hàng.
          </AlertDescription>
        </Alert>

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
            {/* Buy Now Item */}
            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm mua ngay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={
                        getMediaUrl(buyNowItem.images[0]) || "/placeholder.svg"
                      }
                      alt={buyNowItem.product_name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {buyNowItem.product_name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-1">
                      SKU: {buyNowItem.sku}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      Số lượng: {buyNowItem.quantity}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-red-600">
                        {formatPrice(buyNowItem.final_price)}
                      </span>
                      {buyNowItem.sale_price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(buyNowItem.price)}
                        </span>
                      )}
                    </div>
                  </div>
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
                  className="w-full mt-6 bg-orange-500 hover:bg-orange-600"
                >
                  {submitting ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Đặt hàng ngay
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
