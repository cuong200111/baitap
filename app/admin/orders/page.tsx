"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Search,
  Eye,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
} from "lucide-react";

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  items_count: number;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_method: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
}

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Demo orders data
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1,
      order_number: "ORD-2024-001",
      customer_name: "Nguyễn Văn An",
      customer_email: "nguyenvanan@email.com",
      customer_phone: "0123456789",
      status: "delivered",
      total_amount: 25990000,
      items_count: 2,
      payment_status: "paid",
      payment_method: "Chuyển khoản ngân hàng",
      shipping_address: "123 Nguyễn Văn Cừ, Q5, TP.HCM",
      created_at: "2024-08-20T10:30:00Z",
      updated_at: "2024-08-22T14:45:00Z",
    },
    {
      id: 2,
      order_number: "ORD-2024-002",
      customer_name: "Trần Thị Bình",
      customer_email: "tranthibinh@email.com",
      customer_phone: "0987654321",
      status: "processing",
      total_amount: 45800000,
      items_count: 3,
      payment_status: "paid",
      payment_method: "Ví MoMo",
      shipping_address: "456 Lê Văn Việt, Q9, TP.HCM",
      created_at: "2024-08-21T15:20:00Z",
      updated_at: "2024-08-21T16:30:00Z",
    },
    {
      id: 3,
      order_number: "ORD-2024-003",
      customer_name: "Lê Văn Cường",
      customer_email: "levancuong@email.com",
      customer_phone: "0912345678",
      status: "shipped",
      total_amount: 18500000,
      items_count: 1,
      payment_status: "paid",
      payment_method: "COD (Thanh toán khi nhận hàng)",
      shipping_address: "789 Võ Văn Kiệt, Q1, TP.HCM",
      created_at: "2024-08-22T09:15:00Z",
      updated_at: "2024-08-23T08:20:00Z",
    },
    {
      id: 4,
      order_number: "ORD-2024-004",
      customer_name: "Phạm Thị Dung",
      customer_email: "phamthidung@email.com",
      status: "pending",
      total_amount: 8990000,
      items_count: 1,
      payment_status: "pending",
      payment_method: "Chuyển khoản ngân hàng",
      shipping_address: "321 Nguyễn Thị Minh Khai, Q3, TP.HCM",
      created_at: "2024-08-23T11:45:00Z",
      updated_at: "2024-08-23T11:45:00Z",
    },
    {
      id: 5,
      order_number: "ORD-2024-005",
      customer_name: "Hoàng Văn Em",
      customer_email: "hoangvanem@email.com",
      customer_phone: "0934567890",
      status: "cancelled",
      total_amount: 32500000,
      items_count: 2,
      payment_status: "refunded",
      payment_method: "Thẻ tín dụng",
      shipping_address: "654 Điện Biên Phủ, Q10, TP.HCM",
      created_at: "2024-08-19T16:30:00Z",
      updated_at: "2024-08-20T10:15:00Z",
    },
  ]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || order.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleUpdateStatus = (orderId: number, newStatus: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: newStatus as Order["status"],
              updated_at: new Date().toISOString(),
            }
          : order,
      ),
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "₫";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800" },
      processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800" },
      shipped: { label: "Đã gửi", color: "bg-purple-100 text-purple-800" },
      delivered: { label: "Đã giao", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={config.color} variant="secondary">
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const paymentConfig = {
      pending: { label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-800" },
      paid: { label: "Đã thanh toán", color: "bg-green-100 text-green-800" },
      failed: { label: "Thất bại", color: "bg-red-100 text-red-800" },
      refunded: { label: "Đã hoàn tiền", color: "bg-gray-100 text-gray-800" },
    };

    const config = paymentConfig[status as keyof typeof paymentConfig];
    return (
      <Badge className={config.color} variant="secondary">
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    totalRevenue: orders
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + o.total_amount, 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="h-8 w-8 mr-3" />
            Quản lý đơn hàng
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và xử lý đơn hàng của khách hàng
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng đơn</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ xử lý</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang xử lý</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.processing}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã giao</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.delivered}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Doanh thu</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatPrice(stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Bộ lọc & Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo mã đơn, tên khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trạng thái đơn hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="shipped">Đã gửi</SelectItem>
                <SelectItem value="delivered">Đã giao</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trạng thái thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thanh toán</SelectItem>
                <SelectItem value="pending">Chờ thanh toán</SelectItem>
                <SelectItem value="paid">Đã thanh toán</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
                <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-gray-500">ID: {order.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-gray-500">
                        {order.customer_email}
                      </p>
                      {order.customer_phone && (
                        <p className="text-sm text-gray-500">
                          {order.customer_phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{order.items_count} sản phẩm</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-lg">
                      {formatPrice(order.total_amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getPaymentBadge(order.payment_status)}
                      <p className="text-xs text-gray-500">
                        {order.payment_method}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          handleUpdateStatus(order.id, value)
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Chờ xử lý</SelectItem>
                          <SelectItem value="processing">Đang xử lý</SelectItem>
                          <SelectItem value="shipped">Đã gửi</SelectItem>
                          <SelectItem value="delivered">Đã giao</SelectItem>
                          <SelectItem value="cancelled">Hủy đơn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Không tìm thấy đơn hàng nào</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
