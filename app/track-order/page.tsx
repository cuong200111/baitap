"use client";

export const dynamic = 'force-dynamic';

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Info,
} from "lucide-react";
import Image from "next/image";
import { formatPrice, getMediaUrl } from "@/config";
import { toast } from "sonner";

interface OrderTrackingInfo {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  tracking_history: TrackingEvent[];
  estimated_delivery?: string;
  tracking_number?: string;
}

interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  price: number;
  total: number;
  images: string[];
}

interface TrackingEvent {
  id: number;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
  is_current: boolean;
}

function TrackOrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderNumber = searchParams.get("order_number") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [email, setEmail] = useState("");
  const [orderInfo, setOrderInfo] = useState<OrderTrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrackOrder = async () => {
    if (!orderNumber.trim()) {
      toast.error("Vui lòng nhập mã đơn hàng");
      return;
    }

    if (!email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Mock API call - replace with real API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock response
      if (orderNumber.toLowerCase().includes("ord-")) {
        const mockOrder: OrderTrackingInfo = {
          id: 1,
          order_number: orderNumber,
          status: "shipped",
          total_amount: 25900000,
          shipping_address: "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
          customer_name: "Nguyễn Văn A",
          customer_email: email,
          customer_phone: "0912345678",
          notes: "Giao hàng trong giờ hành chính",
          created_at: "2024-01-15T10:30:00Z",
          updated_at: "2024-01-17T14:20:00Z",
          estimated_delivery: "2024-01-19T18:00:00Z",
          tracking_number: "VN123456789",
          items: [
            {
              id: 1,
              product_name: "Laptop Gaming ASUS ROG Strix G15",
              product_sku: "ASUS-ROG-G15-001",
              quantity: 1,
              price: 25900000,
              total: 25900000,
              images: ["/uploads/placeholder.svg"],
            },
          ],
          tracking_history: [
            {
              id: 1,
              status: "pending",
              description: "Đơn hàng đã được tạo và đang chờ xử lý",
              location: "Hệ thống HACOM",
              timestamp: "2024-01-15T10:30:00Z",
              is_current: false,
            },
            {
              id: 2,
              status: "confirmed",
              description: "Đơn hàng đã được xác nhận và đang chuẩn bị hàng",
              location: "Kho HACOM TP.HCM",
              timestamp: "2024-01-15T14:15:00Z",
              is_current: false,
            },
            {
              id: 3,
              status: "processing",
              description: "Đang đóng gói và chuẩn bị giao hàng",
              location: "Kho HACOM TP.HCM",
              timestamp: "2024-01-16T09:20:00Z",
              is_current: false,
            },
            {
              id: 4,
              status: "shipped",
              description: "Đơn hàng đã được giao cho đơn vị vận chuyển",
              location: "Trung tâm phân phối TP.HCM",
              timestamp: "2024-01-17T14:20:00Z",
              is_current: true,
            },
          ],
        };
        setOrderInfo(mockOrder);
      } else {
        setError("Không tìm thấy đơn hàng với thông tin đã nhập");
      }
    } catch (error) {
      console.error("Failed to track order:", error);
      setError("Có lỗi xảy ra khi tra cứu đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      pending: {
        label: "Chờ xử lý",
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      },
      confirmed: {
        label: "Đã xác nhận",
        icon: CheckCircle,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      },
      processing: {
        label: "Đang chuẩn bị",
        icon: Package,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      },
      shipped: {
        label: "Đã gửi hàng",
        icon: Truck,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
      },
      delivered: {
        label: "Đã giao hàng",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      },
      cancelled: {
        label: "Đã hủy",
        icon: AlertCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      },
    };

    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tra cứu đơn hàng
            </h1>
            <p className="text-gray-600">
              Nhập thông tin để kiểm tra trạng thái đơn hàng của bạn
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Thông tin tra cứu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="order_number">Mã đơn hàng *</Label>
                <Input
                  id="order_number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="ORD-1234567890-ABCDEF"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email đặt hàng *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="mt-1"
                />
              </div>
            </div>

            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleTrackOrder}
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {loading ? "Đang tra cứu..." : "Tra cứu đơn hàng"}
            </Button>

            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Mã đơn hàng và email phải chính xác như thông tin khi đặt hàng.
                Kiểm tra email xác nhận đơn hàng nếu bạn không nhớ mã.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Order Information */}
        {orderInfo && (
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Trạng thái đơn hàng</CardTitle>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={getStatusInfo(orderInfo.status).color}
                    >
                      {getStatusInfo(orderInfo.status).label}
                    </Badge>
                    {orderInfo.tracking_number && (
                      <p className="text-sm text-gray-500 mt-1">
                        Mã vận đơn: {orderInfo.tracking_number}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Thông tin đơn hàng</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Mã đơn hàng:</span>
                        <span className="font-medium">
                          {orderInfo.order_number}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ngày đặt:</span>
                        <span>
                          {new Date(orderInfo.created_at).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tổng tiền:</span>
                        <span className="font-bold text-red-600">
                          {formatPrice(orderInfo.total_amount)}
                        </span>
                      </div>
                      {orderInfo.estimated_delivery && (
                        <div className="flex justify-between">
                          <span>Dự kiến giao:</span>
                          <span className="text-green-600 font-medium">
                            {new Date(
                              orderInfo.estimated_delivery,
                            ).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Thông tin giao hàng</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{orderInfo.shipping_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{orderInfo.customer_phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{orderInfo.customer_email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử vận chuyển</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderInfo.tracking_history.map((event, index) => {
                    const statusInfo = getStatusInfo(event.status);
                    const StatusIcon = statusInfo.icon;
                    const isLast =
                      index === orderInfo.tracking_history.length - 1;

                    return (
                      <div key={event.id} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center border-2
                              ${event.is_current ? statusInfo.bgColor + " " + statusInfo.borderColor : "bg-gray-100 border-gray-200"}
                            `}
                          >
                            <StatusIcon
                              className={`h-4 w-4 ${event.is_current ? statusInfo.color : "text-gray-400"}`}
                            />
                          </div>
                          {!isLast && (
                            <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`font-medium ${event.is_current ? statusInfo.color : "text-gray-600"}`}
                            >
                              {event.description}
                            </span>
                            {event.is_current && (
                              <Badge variant="secondary" className="text-xs">
                                Hiện tại
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(event.timestamp).toLocaleString(
                                "vi-VN",
                              )}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm đã đặt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderInfo.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
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
                        <h4 className="font-medium line-clamp-2">
                          {item.product_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          SKU: {item.product_sku}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm">
                            Số lượng: {item.quantity}
                          </span>
                          <span className="text-sm font-medium text-red-600">
                            {formatPrice(item.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Support Contact */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Có thắc mắc về đơn hàng? Liên hệ hotline{" "}
                <strong>1900.1903</strong> hoặc email{" "}
                <strong>support@hacom.vn</strong> để được hỗ trợ.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    }>
      <TrackOrderPageContent />
    </Suspense>
  );
}
