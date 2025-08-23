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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  Tag,
  DollarSign,
  BarChart3,
  TrendingUp,
  Upload,
  Download,
  RefreshCw,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  sku: string;
  category: string;
  status: "active" | "inactive" | "draft";
  featured: boolean;
  images: string[];
  created_at: string;
  avg_rating?: number;
  review_count?: number;
}

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Demo products data
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Laptop Gaming ASUS ROG Strix G15",
      slug: "laptop-gaming-asus-rog-strix-g15",
      description: "Laptop gaming cao cấp với RTX 4060, RAM 16GB, SSD 512GB",
      price: 25990000,
      sale_price: 23990000,
      stock_quantity: 15,
      sku: "ASUS-ROG-G15-001",
      category: "Laptop Gaming",
      status: "active",
      featured: true,
      images: ["/uploads/laptop-asus-1.jpg"],
      created_at: "2024-08-20T10:00:00Z",
      avg_rating: 4.8,
      review_count: 24,
    },
    {
      id: 2,
      name: "PC Gaming Intel Core i7-12700K",
      slug: "pc-gaming-intel-core-i7-12700k",
      description: "PC gaming custom với Intel i7-12700K, RTX 4070, RAM 32GB",
      price: 35990000,
      sale_price: 32990000,
      stock_quantity: 8,
      sku: "PC-INTEL-I7-001",
      category: "PC Gaming",
      status: "active",
      featured: true,
      images: ["/uploads/pc-gaming-1.jpg"],
      created_at: "2024-08-18T14:30:00Z",
      avg_rating: 4.9,
      review_count: 18,
    },
    {
      id: 3,
      name: "Màn hình Gaming MSI 27\" 165Hz",
      slug: "man-hinh-gaming-msi-27-165hz",
      description: "Màn hình gaming 27 inch QHD, 165Hz, G-Sync Compatible",
      price: 7990000,
      stock_quantity: 25,
      sku: "MSI-MON-27-001",
      category: "Màn hình",
      status: "active",
      featured: false,
      images: ["/uploads/monitor-msi-1.jpg"],
      created_at: "2024-08-15T09:15:00Z",
      avg_rating: 4.6,
      review_count: 12,
    },
    {
      id: 4,
      name: "Bàn phím cơ Keychron K8",
      slug: "ban-phim-co-keychron-k8",
      description: "Bàn phím cơ wireless, hot-swappable, RGB backlight",
      price: 2490000,
      stock_quantity: 0,
      sku: "KEY-K8-001",
      category: "Phụ kiện",
      status: "inactive",
      featured: false,
      images: ["/uploads/keyboard-k8-1.jpg"],
      created_at: "2024-08-10T16:45:00Z",
      avg_rating: 4.7,
      review_count: 8,
    },
    {
      id: 5,
      name: "Laptop MacBook Air M2 13\"",
      slug: "laptop-macbook-air-m2-13",
      description: "MacBook Air với chip M2, RAM 8GB, SSD 256GB, màu Midnight",
      price: 28990000,
      stock_quantity: 12,
      sku: "APPLE-MBA-M2-001",
      category: "Laptop",
      status: "active",
      featured: true,
      images: ["/uploads/macbook-air-m2-1.jpg"],
      created_at: "2024-08-12T11:20:00Z",
      avg_rating: 4.9,
      review_count: 31,
    },
  ]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    sale_price: "",
    stock_quantity: "",
    sku: "",
    category: "",
    status: "draft" as "active" | "inactive" | "draft",
    featured: false,
  });

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.sku) {
      const product: Product = {
        id: Math.max(...products.map((p) => p.id)) + 1,
        name: newProduct.name,
        slug: newProduct.name.toLowerCase().replace(/\s+/g, "-"),
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        sale_price: newProduct.sale_price
          ? parseFloat(newProduct.sale_price)
          : undefined,
        stock_quantity: parseInt(newProduct.stock_quantity) || 0,
        sku: newProduct.sku,
        category: newProduct.category,
        status: newProduct.status,
        featured: newProduct.featured,
        images: [],
        created_at: new Date().toISOString(),
      };
      setProducts([...products, product]);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        sale_price: "",
        stock_quantity: "",
        sku: "",
        category: "",
        status: "draft",
        featured: false,
      });
      setIsCreateDialogOpen(false);
    }
  };

  const handleToggleStatus = (productId: number) => {
    setProducts(
      products.map((product) =>
        product.id === productId
          ? {
              ...product,
              status:
                product.status === "active"
                  ? "inactive"
                  : ("active" as "active"),
            }
          : product,
      ),
    );
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      setProducts(products.filter((product) => product.id !== productId));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "₫";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === "active").length,
    featured: products.filter((p) => p.featured).length,
    outOfStock: products.filter((p) => p.stock_quantity === 0).length,
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock_quantity, 0),
  };

  const categories = [
    "Laptop Gaming",
    "PC Gaming",
    "Laptop",
    "Màn hình",
    "Phụ kiện",
    "CPU",
    "GPU",
    "RAM",
    "SSD",
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="h-8 w-8 mr-3" />
            Quản lý sản phẩm
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý danh mục sản phẩm trong cửa hàng
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Thêm sản phẩm
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo sản phẩm mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tên sản phẩm *</label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      placeholder="Laptop Gaming ASUS ROG..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">SKU *</label>
                    <Input
                      value={newProduct.sku}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, sku: e.target.value })
                      }
                      placeholder="ASUS-ROG-001"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Mô tả</label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                    placeholder="Mô tả chi tiết sản phẩm..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Giá bán *</label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      placeholder="25990000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Giá khuyến mãi</label>
                    <Input
                      type="number"
                      value={newProduct.sale_price}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          sale_price: e.target.value,
                        })
                      }
                      placeholder="23990000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số lượng</label>
                    <Input
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          stock_quantity: e.target.value,
                        })
                      }
                      placeholder="10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Danh mục</label>
                    <Select
                      value={newProduct.category}
                      onValueChange={(value) =>
                        setNewProduct({ ...newProduct, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trạng thái</label>
                    <Select
                      value={newProduct.status}
                      onValueChange={(value: "active" | "inactive" | "draft") =>
                        setNewProduct({ ...newProduct, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Bản nháp</SelectItem>
                        <SelectItem value="active">Hoạt động</SelectItem>
                        <SelectItem value="inactive">Tạm ngưng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={newProduct.featured}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        featured: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor="featured" className="text-sm font-medium">
                    Sản phẩm nổi bật
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleCreateProduct}>Tạo sản phẩm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng số</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang bán</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nổi bật</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.featured}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hết hàng</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.outOfStock}
                </p>
              </div>
              <Tag className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Giá trị tồn</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatPrice(stats.totalValue)}
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
                  placeholder="Tìm kiếm theo tên hoặc SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang bán</SelectItem>
                <SelectItem value="inactive">Tạm ngưng</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá bán</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Đánh giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {product.id}
                          {product.featured && (
                            <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                              Nổi bật
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      {product.sale_price ? (
                        <>
                          <p className="font-medium text-red-600">
                            {formatPrice(product.sale_price)}
                          </p>
                          <p className="text-sm text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </p>
                        </>
                      ) : (
                        <p className="font-medium">
                          {formatPrice(product.price)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        product.stock_quantity === 0
                          ? "text-red-600"
                          : product.stock_quantity < 5
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {product.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    {product.avg_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm">
                          {product.avg_rating} ({product.review_count})
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "active"
                          ? "default"
                          : product.status === "inactive"
                            ? "destructive"
                            : "secondary"
                      }
                      className={
                        product.status === "active"
                          ? "bg-green-100 text-green-800"
                          : product.status === "inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }
                    >
                      {product.status === "active"
                        ? "Đang bán"
                        : product.status === "inactive"
                          ? "Tạm ngưng"
                          : "Bản nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(product.id)}
                      >
                        {product.status === "active" ? "Tạm ngưng" : "Kích hoạt"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
