"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowLeft,
  Home,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, getMediaUrl, Domain } from "@/config";
import { useAuth } from "@/contexts/AuthContext";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  price: number;
  quantity: number;
  images: string[];
  total: number;
}

interface Order {
  id: number;
  order_number: string;
  user_name?: string;
  user_email?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  billing_address?: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
}

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const orderId = searchParams.get("order_id");
  const orderNumber = searchParams.get("order_number");

  useEffect(() => {
    console.log("ThankYou page - orderId:", orderId, "orderNumber:", orderNumber);

    if (orderId || orderNumber) {
      loadOrderDetails();
    } else {
      setError("Không tìm thấy thông tin đơn hàng. Vui lòng kiểm tra URL hoặc liên hệ hỗ trợ.");
      setLoading(false);
    }
  }, [orderId, orderNumber]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const response = await fetch(`${Domain}/api/orders/${orderId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Phiên đăng nhập đã hết hạn");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Order data response:", data);

      if (data.success && data.data) {
        setOrder(data.data);
      } else {
        setError(data.message || "Không thể tải thông tin đơn hàng");
      }
    } catch (error: any) {
      console.error("Failed to load order:", error);
      setError(error.message || "Có lỗi xảy ra khi tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        label: "Chờ xử lý",
        variant: "default" as const,
        color: "bg-yellow-100 text-yellow-800",
      },
      confirmed: {
        label: "Đã xác nhận",
        variant: "secondary" as const,
        color: "bg-blue-100 text-blue-800",
      },
      processing: {
        label: "Đang xử lý",
        variant: "secondary" as const,
        color: "bg-purple-100 text-purple-800",
      },
      shipped: {
        label: "Đã giao hàng",
        variant: "secondary" as const,
        color: "bg-indigo-100 text-indigo-800",
      },
      delivered: {
        label: "Đã nhận hàng",
        variant: "secondary" as const,
        color: "bg-green-100 text-green-800",
      },
      cancelled: {
        label: "Đã hủy",
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <div className="text-red-500 mb-4">
                <Package className="h-16 w-16 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Có lỗi xảy ra</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push("/")} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Về trang chủ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-600">
            Cảm ơn bạn đã mua sắm tại HACOM. Đơn hàng của bạn đã được ghi nhận.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Thông tin đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Mã đơn hàng</p>
                    <p className="font-semibold">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trạng thái</p>
                    {getStatusBadge(order.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày đặt</p>
                    <p className="font-semibold">
                      {new Date(order.created_at).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng tiền</p>
                    <p className="font-semibold text-red-600 text-lg">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
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
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={getMediaUrl(
                              (item.images && item.images[0]) || "",
                            )}
                            alt={item.product_name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.product_name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            SKU: {item.sku}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">
                              Số lượng: {item.quantity}
                            </span>
                            <span className="font-semibold">
                              {formatPrice(item.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Không có sản phẩm trong đơn hàng này
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer & Shipping Info */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{order.customer_email}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{order.customer_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Địa chỉ giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{order.shipping_address}</p>
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Ghi chú</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {user ? (
                <Button asChild className="w-full">
                  <Link href="/orders">
                    <Package className="h-4 w-4 mr-2" />
                    Xem đơn hàng của tôi
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link
                    href={`/track-order?order_number=${order.order_number}`}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Theo dõi đơn hàng
                  </Link>
                </Button>
              )}

              <Button asChild variant="outline" className="w-full">
                <Link href="/products">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Tiếp tục mua sắm
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Về trang chủ
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="max-w-6xl mx-auto mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Lưu ý:</strong> Đơn hàng của bạn sẽ được xử lý trong
                  vòng 24 giờ. Chúng tôi sẽ liên hệ với bạn để xác nhận thông
                  tin giao hàng.
                </p>
                <p>
                  Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline:{" "}
                  <strong>1900.1903</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
