"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Eye,
  BarChart3,
  Activity,
} from "lucide-react";

export default function AdminDashboard() {
  // Demo data - in real app would come from API
  const stats = [
    {
      title: "Tổng người dùng",
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Sản phẩm",
      value: "567",
      change: "+5%",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Đơn hàng",
      value: "89",
      change: "+23%",
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Doanh thu",
      value: "₫456M",
      change: "+18%",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "Đơn hàng mới",
      description: "Đơn hàng #12345 được tạo bởi Nguyễn Văn A",
      time: "5 phút trước",
      type: "order",
    },
    {
      id: 2,
      action: "Sản phẩm mới",
      description: "Laptop Gaming ROG Strix được thêm vào kho",
      time: "10 phút trước",
      type: "product",
    },
    {
      id: 3,
      action: "Người dùng mới",
      description: "Trần Thị B đã đăng ký tài khoản",
      time: "15 phút trước",
      type: "user",
    },
    {
      id: 4,
      action: "Thanh toán",
      description: "Đơn hàng #12340 đã được thanh toán",
      time: "20 phút trước",
      type: "payment",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Tổng quan hoạt động hệ thống HACOM
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.change} so với tháng trước
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full">
                Xem tất cả hoạt động
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Thêm sản phẩm mới
            </Button>
            <Button className="w-full" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Quản lý người dùng
            </Button>
            <Button className="w-full" variant="outline">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Xem đơn hàng
            </Button>
            <Button className="w-full" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Xem báo cáo
            </Button>
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-600 mb-2">Truy cập nhanh</p>
              <div className="space-y-2">
                <a
                  href="/admin/products"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  → Quản lý sản phẩm
                </a>
                <a
                  href="/admin/categories"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  → Quản lý danh mục
                </a>
                <a
                  href="/admin/users"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  → Quản lý người dùng
                </a>
                <a
                  href="/admin/settings"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  → Cài đặt hệ thống
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Trạng thái hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium">API Server</p>
              <p className="text-xs text-green-600">Hoạt động bình thường</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium">Database</p>
              <p className="text-xs text-yellow-600">Kết nối fallback</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium">Frontend</p>
              <p className="text-xs text-green-600">Hoạt động tốt</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium">CDN</p>
              <p className="text-xs text-green-600">Tốc độ cao</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
