"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Eye, Package, Plus } from "lucide-react";
import Image from "next/image";
import { formatPrice, getMediaUrl } from "@/config";
import { toast } from "sonner";
import { API_DOMAIN } from "@/lib/api-helpers";

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      params.append("limit", "50");

      console.log("Loading orders with params:", params.toString());
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Orders API response:", data);

      if (data.success && data.data && data.data.orders) {
        console.log("Setting orders:", data.data.orders.length, "orders");
        setOrders(data.data.orders);
      } else {
        console.error("Invalid response structure:", data);
        toast.error(data.message || "Không thể tải danh sách đơn hàng");
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Có lỗi xảy ra khi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      setUpdating(orderId);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Cập nhật trạng thái thành công");
        await loadOrders();
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      toast.error("Có lỗi xảy ra khi cập nhật đơn hàng");
    } finally {
      setUpdating(null);
    }
  };

  const createTestOrder = async () => {
    try {
      const response = await fetch(
        `${API_DOMAIN}/api/debug/create-test-order-complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success(
          "Tạo đơn hàng test thành công: " + data.data.order_number,
        );
        await loadOrders();
      } else {
        toast.error(data.message || "Có lỗi xảy ra khi tạo đơn hàng test");
      }
    } catch (error) {
      console.error("Failed to create test order:", error);
      toast.error("Có lỗi xảy ra khi tạo đơn hàng test");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Chờ xử lý", variant: "default" as const },
      confirmed: { label: "Đã xác nhận", variant: "secondary" as const },
      processing: { label: "Đang xử lý", variant: "default" as const },
      shipped: { label: "Đã gửi hàng", variant: "secondary" as const },
      delivered: { label: "Đã giao", variant: "default" as const },
      cancelled: { label: "Đã hủy", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "default" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-gray-600">
            Quản lý và theo dõi tất cả đơn hàng của khách hàng
          </p>
        </div>
        <Button
          onClick={createTestOrder}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo đơn test
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo mã đơn, tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="shipped">Đã gửi hàng</SelectItem>
                <SelectItem value="delivered">Đã giao</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              Tổng: {filteredOrders.length} đơn hàng
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn hàng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{order.order_number}</div>
                    <div className="text-sm text-gray-500">
                      {order.items.length} sản phẩm
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">
                        {order.customer_email}
                      </div>
                      {order.customer_phone && (
                        <div className="text-sm text-gray-500">
                          {order.customer_phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-red-600">
                      {formatPrice(order.total_amount)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {getStatusBadge(order.status)}
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          updateOrderStatus(order.id, value)
                        }
                        disabled={updating === order.id}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Chờ xử lý</SelectItem>
                          <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                          <SelectItem value="processing">Đang xử lý</SelectItem>
                          <SelectItem value="shipped">Đã gửi hàng</SelectItem>
                          <SelectItem value="delivered">Đã giao</SelectItem>
                          <SelectItem value="cancelled">Đã hủy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(order.created_at).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString("vi-VN")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Chi tiết đơn hàng {order.order_number}
                          </DialogTitle>
                        </DialogHeader>

                        {selectedOrder && (
                          <div className="space-y-6">
                            {/* Order Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">
                                    Thông tin khách hàng
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div>
                                    <span className="font-medium">Tên: </span>
                                    {selectedOrder.customer_name}
                                  </div>
                                  <div>
                                    <span className="font-medium">Email: </span>
                                    {selectedOrder.customer_email}
                                  </div>
                                  {selectedOrder.customer_phone && (
                                    <div>
                                      <span className="font-medium">SĐT: </span>
                                      {selectedOrder.customer_phone}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium">
                                      Địa chỉ:{" "}
                                    </span>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {selectedOrder.shipping_address}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">
                                    Thông tin đơn hàng
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div>
                                    <span className="font-medium">
                                      Mã đơn:{" "}
                                    </span>
                                    {selectedOrder.order_number}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Trạng thái:{" "}
                                    </span>
                                    {getStatusBadge(selectedOrder.status)}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Tổng tiền:{" "}
                                    </span>
                                    <span className="text-red-600 font-bold">
                                      {formatPrice(selectedOrder.total_amount)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Ngày đặt:{" "}
                                    </span>
                                    {new Date(
                                      selectedOrder.created_at,
                                    ).toLocaleString("vi-VN")}
                                  </div>
                                  {selectedOrder.notes && (
                                    <div>
                                      <span className="font-medium">
                                        Ghi chú:{" "}
                                      </span>
                                      <div className="text-sm text-gray-600 mt-1">
                                        {selectedOrder.notes}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>

                            {/* Order Items */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">
                                  Sản phẩm đã đặt
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  {selectedOrder.items.map((item, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-4 p-4 border rounded"
                                    >
                                      <div className="relative w-16 h-16 flex-shrink-0">
                                        <Image
                                          src={getMediaUrl(
                                            item.images[0] || "",
                                          )}
                                          alt={item.product_name}
                                          fill
                                          className="object-cover rounded"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-medium">
                                          {item.product_name}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                          SKU: {item.product_sku}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                          <span className="text-sm">
                                            Số lượng: {item.quantity}
                                          </span>
                                          <span className="text-sm">
                                            Đơn giá: {formatPrice(item.price)}
                                          </span>
                                          <span className="text-sm font-medium">
                                            Thành tiền:{" "}
                                            {formatPrice(item.total)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
