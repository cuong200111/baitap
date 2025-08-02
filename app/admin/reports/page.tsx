"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  PieChart,
  AlertTriangle,
  Star,
} from "lucide-react";
import { formatPrice } from "@/config";
import { toast } from "sonner";
import { API_DOMAIN } from "@/lib/api-helpers";

interface SalesData {
  overview: {
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
    unique_customers: number;
    completed_orders: number;
    cancelled_orders: number;
    revenue_growth: string;
    period_days: number;
  };
  dailySales: Array<{
    date: string;
    orders: number;
    revenue: number;
    unique_customers: number;
  }>;
  monthlySales: Array<{
    month: string;
    orders: number;
    revenue: number;
    unique_customers: number;
    avg_order_value: number;
  }>;
  bestSellingProducts: Array<{
    id: number;
    name: string;
    sku: string;
    total_sold: number;
    total_revenue: number;
    avg_price: number;
    order_count: number;
  }>;
  salesByCategory: Array<{
    id: number;
    category_name: string;
    total_sold: number;
    total_revenue: number;
    order_count: number;
    unique_products: number;
  }>;
}

interface ProductsData {
  overview: {
    total_products: number;
    active_products: number;
    featured_products: number;
    low_stock_products: number;
    out_of_stock_products: number;
    avg_price: number;
  };
  topProductsBySales: Array<{
    id: number;
    name: string;
    sku: string;
    price: number;
    total_sold: number;
    total_revenue: number;
    order_count: number;
    avg_rating: number;
    review_count: number;
  }>;
  lowStockProducts: Array<{
    id: number;
    name: string;
    sku: string;
    stock_quantity: number;
    price: number;
    total_sold_last_30_days: number;
  }>;
  categoryPerformance: Array<{
    id: number;
    category_name: string;
    product_count: number;
    active_products: number;
    total_sold: number;
    total_revenue: number;
    avg_price: number;
  }>;
}

interface CustomersData {
  stats: {
    total_customers: number;
    paying_customers: number;
    active_last_30_days: number;
    avg_orders_per_customer: number;
    avg_spent_per_customer: number;
  };
  topCustomersByOrders: Array<{
    id: number;
    full_name: string;
    email: string;
    order_count: number;
    total_spent: number;
    avg_order_value: number;
    last_order_date: string;
  }>;
  topCustomersBySpent: Array<{
    id: number;
    full_name: string;
    email: string;
    order_count: number;
    total_spent: number;
    avg_order_value: number;
    last_order_date: string;
  }>;
  retentionAnalysis: Array<{
    customer_type: string;
    count: number;
    avg_spent: number;
    total_revenue: number;
  }>;
}

export default function ReportsPage() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [productsData, setProductsData] = useState<ProductsData | null>(null);
  const [customersData, setCustomersData] = useState<CustomersData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedReport, setSelectedReport] = useState("overview");

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Vui lòng đăng nhập để xem báo cáo");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Load sales data
      try {
        const salesResponse = await fetch(
          `${API_DOMAIN}/api/admin/reports/sales?period=${selectedPeriod}`,
          {
            headers,
          },
        );

        if (salesResponse.ok) {
          const salesResult = await salesResponse.json();
          if (salesResult.success) {
            setSalesData(salesResult.data);
          } else {
            console.error("Sales API error:", salesResult.message);
          }
        } else {
          console.error("Sales API HTTP error:", salesResponse.status);
        }
      } catch (error) {
        console.error("Sales API fetch error:", error);
      }

      // Load products data
      try {
        const productsResponse = await fetch(
          `${API_DOMAIN}/api/admin/reports/products`,
          {
            headers,
          },
        );

        if (productsResponse.ok) {
          const productsResult = await productsResponse.json();
          if (productsResult.success) {
            setProductsData(productsResult.data);
          } else {
            console.error("Products API error:", productsResult.message);
          }
        } else {
          console.error("Products API HTTP error:", productsResponse.status);
        }
      } catch (error) {
        console.error("Products API fetch error:", error);
      }

      // Load customers data
      try {
        const customersResponse = await fetch(
          `${API_DOMAIN}/api/admin/reports/customers`,
          {
            headers,
          },
        );

        if (customersResponse.ok) {
          const customersResult = await customersResponse.json();
          if (customersResult.success) {
            setCustomersData(customersResult.data);
          } else {
            console.error("Customers API error:", customersResult.message);
          }
        } else {
          console.error("Customers API HTTP error:", customersResponse.status);
        }
      } catch (error) {
        console.error("Customers API fetch error:", error);
      }
    } catch (error) {
      console.error("Failed to load report data:", error);
      toast.error("Có lỗi xảy ra khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      period: selectedPeriod,
      sales: salesData,
      products: productsData,
      customers: customersData,
      generated_at: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zoxvn-report-${selectedPeriod}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Báo cáo đã được xuất thành công");
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "7":
        return "7 ngày qua";
      case "30":
        return "30 ngày qua";
      case "90":
        return "3 tháng qua";
      case "365":
        return "12 tháng qua";
      default:
        return "30 ngày qua";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Báo cáo & Thống kê
          </h1>
          <p className="text-gray-600">
            Phân tích dữ liệu kinh doanh và hiệu suất bán hàng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{getPeriodLabel("7")}</SelectItem>
              <SelectItem value="30">{getPeriodLabel("30")}</SelectItem>
              <SelectItem value="90">{getPeriodLabel("90")}</SelectItem>
              <SelectItem value="365">{getPeriodLabel("365")}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button onClick={loadReportData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Cập nhật
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedReport === "overview" ? "default" : "outline"}
          onClick={() => setSelectedReport("overview")}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Tổng quan
        </Button>
        <Button
          variant={selectedReport === "sales" ? "default" : "outline"}
          onClick={() => setSelectedReport("sales")}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Doanh số
        </Button>
        <Button
          variant={selectedReport === "products" ? "default" : "outline"}
          onClick={() => setSelectedReport("products")}
        >
          <Package className="h-4 w-4 mr-2" />
          Sản phẩm
        </Button>
        <Button
          variant={selectedReport === "customers" ? "default" : "outline"}
          onClick={() => setSelectedReport("customers")}
        >
          <Users className="h-4 w-4 mr-2" />
          Khách hàng
        </Button>
      </div>

      {selectedReport === "overview" && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Doanh thu
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {salesData?.overview
                        ? formatPrice(salesData.overview.total_revenue || 0)
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  {salesData?.overview?.revenue_growth &&
                  salesData.overview.revenue_growth !== "N/A" ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-600 font-medium">
                        {salesData.overview.revenue_growth}%
                      </span>
                      <span className="text-gray-500 ml-1">
                        so với kỳ trước
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500">
                      Không có dữ liệu so sánh
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Đơn hàng
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {salesData?.overview?.total_orders?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Giá trị TB:{" "}
                  {salesData?.overview
                    ? formatPrice(salesData.overview.avg_order_value || 0)
                    : "N/A"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Sản phẩm
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {productsData?.overview?.total_products?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Hoạt động: {productsData?.overview?.active_products || "0"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Khách hàng
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customersData?.stats?.total_customers?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Đã mua hàng: {customersData?.stats?.paying_customers || "0"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products and Categories */}
          {salesData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Sản phẩm bán chạy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesData.bestSellingProducts
                      ?.slice(0, 5)
                      .map((product, index) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium line-clamp-1">
                                {product.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                Đã bán: {product.total_sold} sản phẩm
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              {formatPrice(product.total_revenue)}
                            </p>
                          </div>
                        </div>
                      )) || (
                      <div className="text-center py-4 text-gray-500">
                        Không có dữ liệu sản phẩm
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Hiệu suất theo danh mục
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesData.salesByCategory
                      ?.slice(0, 5)
                      .map((category, index) => {
                        const totalRevenue =
                          salesData.salesByCategory?.reduce(
                            (sum, cat) => sum + (cat.total_revenue || 0),
                            0,
                          ) || 1;
                        const percentage =
                          ((category.total_revenue || 0) / totalRevenue) * 100;

                        return (
                          <div key={category.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {category.category_name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {percentage.toFixed(1)}%
                                </span>
                                <span className="font-semibold text-green-600">
                                  {formatPrice(category.total_revenue || 0)}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.max(percentage, 2)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      }) || (
                      <div className="text-center py-4 text-gray-500">
                        Không có dữ liệu danh mục
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {selectedReport === "sales" && salesData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                Thống kê doanh thu ({getPeriodLabel(selectedPeriod)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Tổng doanh thu:</span>
                  <span className="font-bold text-green-600">
                    {formatPrice(salesData.overview.total_revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Số đơn hàng:</span>
                  <span className="font-semibold">
                    {salesData.overview.total_orders || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Giá trị TB/đơn:</span>
                  <span className="font-semibold">
                    {formatPrice(salesData.overview.avg_order_value || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Đơn hàng hoàn thành:</span>
                  <Badge variant="secondary" className="text-green-600">
                    {salesData.overview.completed_orders || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Đơn hàng bị hủy:</span>
                  <Badge variant="destructive">
                    {salesData.overview.cancelled_orders || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Khách hàng độc nhất:</span>
                  <span className="font-semibold">
                    {salesData.overview.unique_customers || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Doanh thu theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salesData.monthlySales?.slice(0, 6).map((month, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm">{month.month}</span>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatPrice(month.revenue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {month.orders} đơn
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-500">
                    Không có dữ liệu theo tháng
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedReport === "products" && productsData && (
        <div className="space-y-6">
          {/* Product Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Package className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-2xl font-bold text-gray-900">
                    {productsData.overview.total_products || 0}
                  </p>
                  <p className="text-sm text-gray-600">Tổng sản phẩm</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Hoạt động: {productsData.overview.active_products || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <p className="text-2xl font-bold text-gray-900">
                    {productsData.overview.low_stock_products || 0}
                  </p>
                  <p className="text-sm text-gray-600">Sắp hết hàng</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Hết hàng: {productsData.overview.out_of_stock_products || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Star className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <p className="text-2xl font-bold text-gray-900">
                    {productsData.overview.featured_products || 0}
                  </p>
                  <p className="text-sm text-gray-600">Sản phẩm nổi bật</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Giá TB: {formatPrice(productsData.overview.avg_price || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm bán chạy nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productsData.topProductsBySales
                  ?.slice(0, 10)
                  .map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            SKU: {product.sku} • Đã bán: {product.total_sold}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatPrice(product.total_revenue)}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          {Number(product.avg_rating).toFixed(1)} (
                          {product.review_count})
                        </div>
                      </div>
                    </div>
                  )) || (
                  <div className="text-center py-4 text-gray-500">
                    Không có dữ liệu sản phẩm
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedReport === "customers" && customersData && (
        <div className="space-y-6">
          {/* Customer Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-2xl font-bold text-gray-900">
                    {customersData.stats.total_customers || 0}
                  </p>
                  <p className="text-sm text-gray-600">Tổng khách hàng</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Đã mua: {customersData.stats.paying_customers || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-2xl font-bold text-gray-900">
                    {Number(
                      customersData.stats.avg_orders_per_customer || 0,
                    ).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Đơn hàng TB/khách</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(
                      customersData.stats.avg_spent_per_customer || 0,
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Giá trị TB/khách</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Khách hàng chi tiêu nhiều nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customersData.topCustomersBySpent
                    ?.slice(0, 10)
                    .map((customer, index) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{customer.full_name}</p>
                            <p className="text-sm text-gray-500">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatPrice(customer.total_spent)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {customer.order_count} đơn hàng
                          </p>
                        </div>
                      </div>
                    )) || (
                    <div className="text-center py-4 text-gray-500">
                      Không có dữ liệu khách hàng
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phân loại khách hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customersData.retentionAnalysis?.map((segment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {segment.customer_type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {segment.count} khách
                          </span>
                          <span className="font-semibold text-green-600">
                            {formatPrice(segment.total_revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Chi tiêu TB: {formatPrice(segment.avg_spent)}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-gray-500">
                      Không có dữ liệu phân loại
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
