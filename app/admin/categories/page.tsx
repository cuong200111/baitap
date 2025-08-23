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
  FolderTree,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  TrendingUp,
  BarChart3,
  Folder,
  RefreshCw,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  is_active: boolean;
  sort_order: number;
  products_count?: number;
  created_at: string;
}

export default function AdminCategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Demo categories data
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 1,
      name: "Laptop",
      slug: "laptop",
      description: "Máy tính xách tay các loại",
      is_active: true,
      sort_order: 1,
      products_count: 45,
      created_at: "2024-01-15T10:30:00Z",
    },
    {
      id: 2,
      name: "Laptop Gaming",
      slug: "laptop-gaming",
      description: "Laptop chuyên game với cấu hình cao",
      parent_id: 1,
      is_active: true,
      sort_order: 1,
      products_count: 23,
      created_at: "2024-01-16T11:00:00Z",
    },
    {
      id: 3,
      name: "Laptop Văn phòng",
      slug: "laptop-van-phong",
      description: "Laptop phù hợp cho công việc văn phòng",
      parent_id: 1,
      is_active: true,
      sort_order: 2,
      products_count: 22,
      created_at: "2024-01-16T11:15:00Z",
    },
    {
      id: 4,
      name: "PC Gaming",
      slug: "pc-gaming",
      description: "Máy tính bàn chuyên game",
      is_active: true,
      sort_order: 2,
      products_count: 18,
      created_at: "2024-01-17T09:30:00Z",
    },
    {
      id: 5,
      name: "Linh kiện máy tính",
      slug: "linh-kien-may-tinh",
      description: "Các linh kiện, phụ kiện máy tính",
      is_active: true,
      sort_order: 3,
      products_count: 156,
      created_at: "2024-01-18T14:20:00Z",
    },
    {
      id: 6,
      name: "CPU",
      slug: "cpu",
      description: "Bộ vi xử lý Intel, AMD",
      parent_id: 5,
      is_active: true,
      sort_order: 1,
      products_count: 34,
      created_at: "2024-01-19T10:45:00Z",
    },
    {
      id: 7,
      name: "GPU - Card đồ họa",
      slug: "gpu-card-do-hoa",
      description: "Card đồ họa NVIDIA, AMD",
      parent_id: 5,
      is_active: true,
      sort_order: 2,
      products_count: 28,
      created_at: "2024-01-19T11:00:00Z",
    },
    {
      id: 8,
      name: "Màn hình",
      slug: "man-hinh",
      description: "Màn hình máy tính, gaming monitor",
      is_active: true,
      sort_order: 4,
      products_count: 67,
      created_at: "2024-01-20T15:30:00Z",
    },
    {
      id: 9,
      name: "Phụ kiện Gaming",
      slug: "phu-kien-gaming",
      description: "Bàn phím, chuột, tai nghe gaming",
      is_active: false,
      sort_order: 5,
      products_count: 0,
      created_at: "2024-01-21T16:00:00Z",
    },
  ]);

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parent_id: "",
    sort_order: "1",
    is_active: true,
  });

  // Filter categories
  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && category.is_active) ||
      (statusFilter === "inactive" && !category.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleCreateCategory = () => {
    if (newCategory.name) {
      const category: Category = {
        id: Math.max(...categories.map((c) => c.id)) + 1,
        name: newCategory.name,
        slug: newCategory.name.toLowerCase().replace(/\s+/g, "-"),
        description: newCategory.description,
        parent_id: newCategory.parent_id
          ? parseInt(newCategory.parent_id)
          : undefined,
        is_active: newCategory.is_active,
        sort_order: parseInt(newCategory.sort_order),
        products_count: 0,
        created_at: new Date().toISOString(),
      };
      setCategories([...categories, category]);
      setNewCategory({
        name: "",
        description: "",
        parent_id: "",
        sort_order: "1",
        is_active: true,
      });
      setIsCreateDialogOpen(false);
    }
  };

  const handleToggleStatus = (categoryId: number) => {
    setCategories(
      categories.map((category) =>
        category.id === categoryId
          ? { ...category, is_active: !category.is_active }
          : category,
      ),
    );
  };

  const handleDeleteCategory = (categoryId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      setCategories(categories.filter((category) => category.id !== categoryId));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getParentName = (parentId?: number) => {
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : "—";
  };

  const getLevel = (category: Category) => {
    return category.parent_id ? 2 : 1;
  };

  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.is_active).length,
    parentCategories: categories.filter((c) => !c.parent_id).length,
    totalProducts: categories.reduce(
      (sum, c) => sum + (c.products_count || 0),
      0,
    ),
  };

  const parentCategories = categories.filter((c) => !c.parent_id);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FolderTree className="h-8 w-8 mr-3" />
            Quản lý danh mục
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý cấu trúc danh mục sản phẩm
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Thêm danh mục
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tạo danh mục mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tên danh mục *</label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    placeholder="Laptop Gaming"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mô tả</label>
                  <Textarea
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    placeholder="Mô tả danh mục..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Danh mục cha</label>
                  <Select
                    value={newCategory.parent_id}
                    onValueChange={(value) =>
                      setNewCategory({ ...newCategory, parent_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục cha (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Không có</SelectItem>
                      {parentCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Thứ tự sắp xếp</label>
                  <Input
                    type="number"
                    value={newCategory.sort_order}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        sort_order: e.target.value,
                      })
                    }
                    placeholder="1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newCategory.is_active}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        is_active: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Kích hoạt danh mục
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
                <Button onClick={handleCreateCategory}>Tạo danh mục</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng danh mục</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FolderTree className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang hoạt động</p>
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
                <p className="text-sm text-gray-600">Danh mục cha</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.parentCategories}
                </p>
              </div>
              <Folder className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng sản phẩm</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.totalProducts}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
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
                  placeholder="Tìm kiếm danh mục..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Đã tắt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách danh mục ({filteredCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Danh mục cha</TableHead>
                <TableHead>Cấp độ</TableHead>
                <TableHead>Số sản phẩm</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          category.parent_id ? "bg-purple-100" : "bg-blue-100"
                        }`}
                      >
                        {category.parent_id ? (
                          <Folder className="h-4 w-4 text-purple-600" />
                        ) : (
                          <FolderTree className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-gray-500">
                          ID: {category.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {getParentName(category.parent_id)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getLevel(category) === 1 ? "default" : "secondary"}
                    >
                      Cấp {getLevel(category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {category.products_count || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{category.sort_order}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={category.is_active ? "default" : "destructive"}
                      className={
                        category.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {category.is_active ? "Hoạt động" : "Đã tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(category.created_at)}
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
                        onClick={() => handleToggleStatus(category.id)}
                      >
                        {category.is_active ? "Tắt" : "Bật"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCategory(category.id)}
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
          {filteredCategories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Không tìm thấy danh mục nào</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
