"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
} from "lucide-react";
import { formatPrice } from "../../config";
import { API_DOMAIN } from "@/lib/api-helpers";

interface DashboardStats {
  products: {
    total: number;
    active: number;
    featured: number;
    low_stock: number;
  };
  categories: {
    total: number;
    active: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    completed: number;
    cancelled: number;
    failed: number;
    successful: number;
    failed_total: number;
  };
  users: {
    total: number;
    customers: number;
    admins: number;
  };
  revenue: {
    total: number;
    lost: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    products: { total: 0, active: 0, featured: 0, low_stock: 0 },
    categories: { total: 0, active: 0 },
    orders: {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      failed: 0,
      successful: 0,
      failed_total: 0,
    },
    users: { total: 0, customers: 0, admins: 0 },
    revenue: { total: 0, lost: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_DOMAIN}/api/admin/dashboard-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      } else {
        console.error("Failed to load dashboard stats:", result.message);
        // Keep default stats if API fails
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Tổng quan về hoạt động của hệ thống ZOXVN
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Products */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sản phẩm</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.products.total}
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Hoạt động: {stats.products.active}</span>
                <span>Nổi bật: {stats.products.featured}</span>
              </div>
              <div className="mt-1">
                <span className="text-red-600">
                  Sắp hết: {stats.products.low_stock}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FolderTree className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Danh mục</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.categories.total}
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Hoạt động: {stats.categories.active}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.orders.total}
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Chờ xử lý: {stats.orders.pending}</span>
                <span className="text-green-600">
                  Đã giao: {stats.orders.delivered}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Đang xử lý: {stats.orders.processing}</span>
                <span className="text-red-600">
                  Đã hủy: {stats.orders.cancelled}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Người dùng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.users.total}
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Khách hàng: {stats.users.customers}</span>
                <span>Admin: {stats.users.admins}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Doanh thu từ đơn đã giao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatPrice(stats.revenue.total)}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
              Từ {stats.orders.delivered} đơn đã giao và{" "}
              {stats.orders.completed} đơn hoàn thành
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Doanh thu bị mất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {formatPrice(stats.revenue.lost)}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
              Từ {stats.orders.cancelled} đơn đã hủy và {stats.orders.failed}{" "}
              đơn thất bại
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn sử dụng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Bắt đầu với ZOXVN Admin</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tạo danh mục sản phẩm trước</li>
                <li>• Upload ảnh vào thư viện</li>
                <li>• Thêm sản phẩm và chọn ảnh từ thư viện</li>
                <li>• Theo dõi đơn hàng từ khách hàng</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Tính năng nổi bật</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Quản lý ảnh tập trung</li>
                <li>• Hệ thống đánh giá sản phẩm</li>
                <li>• Quản lý người dùng và phân quyền</li>
                <li>• Theo dõi thống kê real-time</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
