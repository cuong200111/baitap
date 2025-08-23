"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Search,
  Upload,
  X,
  Image as ImageIcon,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MediaPicker } from "../MediaPicker";
import { toast } from "sonner";
import { getMediaUrl, formatPrice } from "../../config";
import { Product, Category } from "../../types";
import { apiWrappers } from "../../lib/api-wrapper";

interface ProductFormData {
  name: string;
  description: string;
  short_description: string;
  sku: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  featured: boolean;
  category_ids: number[];
  images: string[];
  specifications: Record<string, any>;
  weight?: number;
  dimensions?: string;
  status: "active" | "inactive" | "draft";
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    short_description: "",
    sku: "",
    price: 0,
    sale_price: undefined,
    stock_quantity: 0,
    featured: false,
    category_ids: [],
    images: [],
    specifications: {},
    weight: undefined,
    dimensions: "",
    status: "active",
  });

  const [submitting, setSubmitting] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        apiWrappers.products.getAll({ page: 1, limit: 50 }),
        apiWrappers.categories.getAll({ flat: true }),
      ]);

      if (productsResponse.success && productsResponse.data) {
        // Handle both array format and paginated format
        const productData = Array.isArray(productsResponse.data)
          ? productsResponse.data
          : productsResponse.data.products || [];
        setProducts(productData);
      } else {
        console.error("Products API error:", productsResponse);
        setProducts([]);
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Không thể tải dữ liệu");
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      short_description: "",
      sku: "",
      price: 0,
      sale_price: undefined,
      stock_quantity: 0,
      featured: false,
      category_ids: [],
      images: [],
      specifications: {},
      weight: undefined,
      dimensions: "",
      status: "active",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      short_description: product.short_description || "",
      sku: product.sku,
      price: product.price,
      sale_price: product.sale_price || undefined,
      stock_quantity: product.stock_quantity || 0,
      featured: product.featured || false,
      category_ids: product.categories?.map((cat) => cat.id) || [],
      images: product.images || [],
      specifications: product.specifications || {},
      weight: product.weight || undefined,
      dimensions: product.dimensions || "",
      status: product.status || "active",
    });
    setIsDialogOpen(true);
  };

  const handleMediaSelect = (media: any) => {
    // Check if this image is already added
    if (formData.images.includes(media.filename)) {
      toast.warning("Ảnh này đã được thêm rồi");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, media.filename],
    }));
    toast.success(`Đã thêm ảnh: ${media.original_name}`);
  };

  const handleBulkMediaSelect = (mediaList: any[]) => {
    if (!Array.isArray(mediaList) || mediaList.length === 0) {
      return;
    }

    const newImages: string[] = [];
    const duplicates: string[] = [];

    mediaList.forEach((media) => {
      if (media && media.filename) {
        if (formData.images.includes(media.filename)) {
          duplicates.push(media.original_name || media.filename);
        } else {
          newImages.push(media.filename);
        }
      }
    });

    if (newImages.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
      toast.success(`Đã thêm ${newImages.length} ảnh mới`);
    }

    if (duplicates.length > 0) {
      toast.warning(`${duplicates.length} ảnh đã tồn tại`);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    toast.success("Đã xóa ảnh");
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.images.length) return;

    setFormData((prev) => {
      const newImages = [...prev.images];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      return {
        ...prev,
        images: newImages,
      };
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sku || formData.price <= 0) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      const productData = {
        ...formData,
        sale_price: formData.sale_price || undefined,
        weight: formData.weight || undefined,
        specifications: Object.keys(formData.specifications).length
          ? formData.specifications
          : {},
      };

      let response;
      if (editingProduct) {
        response = await apiWrappers.products.update(editingProduct.id, productData);
      } else {
        response = await apiWrappers.products.create(productData);
      }

      if (response.success) {
        toast.success(
          editingProduct
            ? "Cập nhật sản phẩm thành công"
            : "Tạo sản phẩm thành công",
        );
        setIsDialogOpen(false);
        await loadData();
      }
    } catch (error) {
      console.error("Failed to save product:", error);
      toast.error("Lưu sản phẩm thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: number) => {
    try {
      const response = await apiWrappers.products.delete(productId);
      if (response.success) {
        toast.success("Xóa sản phẩm thành công");
        await loadData();
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Xóa sản phẩm thất bại");
    }
  };

  const addSpecification = () => {
    const key = prompt("Tên thông số:");
    const value = prompt("Giá trị:");
    if (key && value) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [key]: value,
        },
      }));
    }
  };

  const removeSpecification = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      specifications: Object.fromEntries(
        Object.entries(prev.specifications).filter(([k]) => k !== key),
      ),
    }));
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(
    (product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" ||
        product.categories?.some((cat) => cat.id.toString() === categoryFilter);

      return matchesSearch && matchesStatus && matchesCategory;
    },
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-600">
            Quản lý danh sách sản phẩm, thêm mới, chỉnh sửa và xóa sản phẩm
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
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
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              Tổng: {filteredProducts.length} sản phẩm
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Kho</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Đánh giá</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                console.log(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={getMediaUrl(product.images?.[0] || "")}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.short_description}
                          </div>
                          {product.featured && (
                            <Badge variant="secondary" className="mt-1">
                              <Star className="h-3 w-3 mr-1" />
                              Nổi bật
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {product.sku}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatPrice(product.price)}
                        </div>
                        {product.sale_price && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(product.sale_price)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (product.stock_quantity || 0) > 0
                            ? "default"
                            : "destructive"
                        }
                      >
                        {product.stock_quantity || 0}
                      </Badge>
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
                      >
                        {product.status === "active"
                          ? "Hoạt động"
                          : product.status === "inactive"
                            ? "Không hoạt động"
                            : "Bản nháp"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm">
                          {product.average_rating?.toFixed(1) || "0.0"}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({product.total_reviews || 0})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa sản phẩm &quot;
                                {product.name}&quot;? Hành động này không thể
                                hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(product.id)}
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Chỉnh sửa sản ph��m" : "Thêm sản phẩm mới"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="pricing">Giá & Kho</TabsTrigger>
              <TabsTrigger value="images">Hình ảnh</TabsTrigger>
              <TabsTrigger value="specs">Thông số</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Tên sản phẩm *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    placeholder="Mã sản phẩm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="short_description">Mô tả ngắn</Label>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      short_description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả ngắn về sản phẩm"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="description">Mô tả chi tiết</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả chi tiết về sản phẩm"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categories">Danh mục</Label>
                  <Select
                    value={formData.category_ids[0]?.toString() || "0"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        category_ids: value === "0" ? [] : [parseInt(value)],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Chọn danh mục</SelectItem>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive" | "draft") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="inactive">Không hoạt động</SelectItem>
                      <SelectItem value="draft">Bản nháp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      featured: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="featured">Sản phẩm nổi bật</Label>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Giá bán *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="sale_price">Giá gốc (nếu có)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    value={formData.sale_price || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sale_price: parseFloat(e.target.value) || undefined,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="stock_quantity">Số lượng tồn kho</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stock_quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Trọng lượng (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        weight: parseFloat(e.target.value) || undefined,
                      }))
                    }
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label htmlFor="dimensions">Kích thước</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dimensions: e.target.value,
                      }))
                    }
                    placeholder="L x W x H"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              <div>
                <Label>Hình ảnh sản phẩm</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Ảnh đầu tiên sẽ là ảnh chính của sản phẩm
                </p>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="w-full border-dashed p-6 h-auto flex flex-col gap-2 hover:bg-gray-50"
                  >
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                    <span>Chọn ảnh từ thư viện</span>
                    <span className="text-xs text-gray-500">
                      Hỗ trợ chọn nhiều ảnh cùng lúc
                    </span>
                  </Button>
                </div>
              </div>

              {formData.images.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm text-gray-600">
                      Đã chọn {formData.images.length} ảnh
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, images: [] }));
                        toast.success("Đã xóa tất cả ảnh");
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Xóa tất cả
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        {index === 0 && (
                          <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded z-10">
                            Ảnh chính
                          </div>
                        )}
                        <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                          <img
                            src={getMediaUrl(image)}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all">
                            {/* Move buttons */}
                            <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {index > 0 && (
                                <button
                                  onClick={() => moveImage(index, index - 1)}
                                  className="bg-blue-600 text-white rounded p-1 hover:bg-blue-700"
                                  title="Di chuyển lên"
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </button>
                              )}
                              {index < formData.images.length - 1 && (
                                <button
                                  onClick={() => moveImage(index, index + 1)}
                                  className="bg-blue-600 text-white rounded p-1 hover:bg-blue-700"
                                  title="Di chuyển xuống"
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            {/* Delete button */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => removeImage(index)}
                                className="bg-red-600 text-white rounded p-1 hover:bg-red-700"
                                title="Xóa ảnh"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          Ảnh {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="specs" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Thông số kỹ thuật</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSpecification}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm thông số
                </Button>
              </div>

              <div className="space-y-2">
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input value={key} disabled className="flex-1" />
                    <Input
                      value={value as string}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          specifications: {
                            ...prev.specifications,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSpecification(key)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {Object.keys(formData.specifications).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Chưa có thông số kỹ thuật nào
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu sản phẩm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Picker */}
      <MediaPicker
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        onBulkSelect={handleBulkMediaSelect}
        multiple={true}
        entityType="product"
        title="Chọn ảnh sản phẩm"
        selectedIds={[]}
      />
    </div>
  );
}
