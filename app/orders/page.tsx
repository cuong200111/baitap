"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Package,
  Truck,
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, getMediaUrl } from "@/config";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { WithAuth } from "@/components/AuthGuard";

interface Order {
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
  items: OrderItem[];
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

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if redirected from successful order
  const isSuccess = searchParams.get("success") === "true";
  const orderNumber = searchParams.get("order_number");

  useEffect(() => {
    // Wait for auth to complete before deciding whether to redirect
    if (authLoading) {
      return; // Still loading, don't do anything yet
    }

    if (!isAuthenticated || !user) {
      // Auth completed and user is not authenticated
      router.push("/login");
      return;
    }

    // User is authenticated, load orders
    if (user?.id) {
      loadOrders();
    }
  }, [user, authLoading, isAuthenticated, router]);

  const loadOrders = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders?user_id=${user.id}&limit=50`);
      const data = await response.json();

      console.log("Orders API response:", data);

      if (data.success) {
        setOrders(data.data?.orders || []);
      } else {
        console.error("Orders API error:", data.message);
        toast.error("Không thể tải danh sách đơn hàng");
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Có lỗi xảy ra khi tải đơn h��ng");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      pending: {
        label: "Chờ xử lý",
        icon: Package,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        description: "Đơn hàng đang được xử lý",
      },
      confirmed: {
        label: "Đã xác nhận",
        icon: CheckCircle,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        description: "Đơn hàng đã được xác nhận",
      },
      processing: {
        label: "Đang chuẩn bị",
        icon: Package,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        description: "Đang chuẩn bị hàng",
      },
      shipped: {
        label: "Đã gửi hàng",
        icon: Truck,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        description: "Đơn hàng đang được vận chuyển",
      },
      delivered: {
        label: "Đã giao hàng",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        description: "Đơn hàng đã được giao thành công",
      },
      cancelled: {
        label: "Đã hủy",
        icon: Package,
        color: "text-red-600",
        bgColor: "bg-red-50",
        description: "Đơn hàng đã bị hủy",
      },
    };

    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    );
  };

  // Show loading screen while authentication is in progress
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
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
            <h1 className="text-3xl font-bold text-gray-900">
              Đơn hàng của tôi
            </h1>
            <p className="text-gray-600">
              Theo dõi trạng thái và lịch sử đơn hàng
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Về trang chủ
          </Button>
        </div>

        {/* Success Message */}
        {isSuccess && orderNumber && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Đặt hàng thành công!</strong> Mã đơn hàng của bạn là{" "}
              <strong>{orderNumber}</strong>. Chúng tôi sẽ liên hệ với bạn sớm
              nhất.
            </AlertDescription>
          </Alert>
        )}

        {orders.length === 0 ? (
          // No orders
          <Card className="text-center py-16">
            <CardContent>
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Chưa có đơn hàng nào
              </h2>
              <p className="text-gray-600 mb-6">
                Hãy đặt hàng để theo dõi trạng thái giao hàng
              </p>
              <Link href="/products">
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Mua sắm ngay
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          // Orders list
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className={`${statusInfo.bgColor} border-b`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                        <div>
                          <CardTitle className="text-lg">
                            Đơn hàng #{order.order_number}
                          </CardTitle>
                          <p className={`text-sm ${statusInfo.color}`}>
                            {statusInfo.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                        <div className="text-sm text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(order.created_at).toLocaleDateString(
                            "vi-VN",
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Order Items */}
                      <div className="lg:col-span-2">
                        <h3 className="font-semibold mb-4">Sản phẩm đã đặt</h3>
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4 p-3 bg-gray-50 rounded"
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
                                <h4 className="font-medium line-clamp-1">
                                  {item.product_name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  SKU: {item.product_sku}
                                </p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-sm">
                                    SL: {item.quantity}
                                  </span>
                                  <span className="text-sm font-medium text-red-600">
                                    {formatPrice(item.total)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Details */}
                      <div>
                        <h3 className="font-semibold mb-4">
                          Thông tin đơn hàng
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">
                                Địa chỉ giao hàng:
                              </span>
                              <div className="text-gray-600 mt-1">
                                {order.shipping_address}
                              </div>
                            </div>
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

                          {order.notes && (
                            <div>
                              <span className="font-medium">Ghi chú:</span>
                              <div className="text-gray-600 mt-1">
                                {order.notes}
                              </div>
                            </div>
                          )}

                          <div className="border-t pt-3 mt-4">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Tổng cộng:</span>
                              <span className="text-lg font-bold text-red-600">
                                {formatPrice(order.total_amount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Đặt hàng lúc{" "}
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </div>
                      <div className="flex gap-2">
                        {order.status === "pending" && (
                          <Button variant="outline" size="sm">
                            Hủy đơn hàng
                          </Button>
                        )}
                        {order.status === "delivered" && (
                          <Button variant="outline" size="sm">
                            Mua lại
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
