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
import {
  Plus,
  Edit,
  Trash2,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Category } from "../../../types";
import { apiWrappers } from "@/lib/api-wrapper";
import { MediaSelector } from "@/components/MediaSelector";

interface CategoryFormData {
  name: string;
  description: string;
  parent_id: number | null;
  sort_order: number;
  image: string;
}

const initialFormData: CategoryFormData = {
  name: "",
  description: "",
  parent_id: null,
  sort_order: 0,
  image: "",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const [hierarchicalResponse, flatResponse] = await Promise.all([
        apiWrappers.categories.getAll(),
        apiWrappers.categories.getAll({ flat: true }),
      ]);

      if (hierarchicalResponse.success && hierarchicalResponse.data) {
        setCategories(hierarchicalResponse.data);
      }

      if (flatResponse.success && flatResponse.data) {
        setFlatCategories(flatResponse.data);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (!formData.name) {
      toast.error("Tên danh mục là bắt buộc");
      setSubmitting(false);
      return;
    }
    try {
      if (editingCategory) {
        const response = await apiWrappers.categories.update(
          editingCategory.id,
          {
            ...formData,
            parent_id: formData.parent_id || undefined,
          },
        );
        if (response.success) {
          toast.success("Cập nhật danh mục thành công");
        } else {
          toast.error(response.message || "Không thể cập nhật danh mục");
          return;
        }
      } else {
        const response = await apiWrappers.categories.create({
          ...formData,
          parent_id: formData.parent_id || undefined,
        });
        if (response.success) {
          toast.success("Tạo danh mục thành công");
        } else {
          toast.error(response.message || "Không thể tạo danh mục");
          return;
        }
      }

      setFormData(initialFormData);
      setEditingCategory(null);
      setIsFormOpen(false);
      loadCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error("Kh��ng thể lưu danh mục");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      parent_id: category.parent_id || null,
      sort_order: category.sort_order,
      image: category.image || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (category: Category) => {
    try {
      const response = await apiWrappers.categories.delete(category.id);
      if (response.success) {
        toast.success("Xóa danh mục thành công");
        loadCategories();
      } else {
        toast.error(response.message || "Không thể xóa danh mục");
      }
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      toast.error(error.message || "Không thể xóa danh mục");
    }
  };

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryRow = (
    category: Category,
    level = 0,
  ): React.ReactNode => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    const filteredCategories = searchTerm
      ? flatCategories.filter((cat) =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : flatCategories;

    if (searchTerm && !filteredCategories.find((c) => c.id === category.id)) {
      return null;
    }

    return (
      <>
        <TableRow key={category.id}>
          <TableCell>
            <div
              className="flex items-center"
              style={{ paddingLeft: `${level * 24}px` }}
            >
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(category.id)}
                  className="p-0 h-6 w-6 mr-2"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {!hasChildren && <div className="w-8" />}
              <FolderTree className="h-4 w-4 mr-2 text-blue-600" />
              <span className="font-medium">{category.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
              {category.slug}
            </code>
          </TableCell>
          <TableCell className="max-w-xs truncate">
            {category.description || "-"}
          </TableCell>
          <TableCell className="text-center">
            <Badge variant="outline">{category.products_count || 0}</Badge>
          </TableCell>
          <TableCell className="text-center">
            <Badge
              variant={category.is_active ? "default" : "secondary"}
              className={
                category.is_active ? "bg-green-100 text-green-800" : ""
              }
            >
              {category.is_active ? "Hoạt động" : "Tạm dừng"}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(category)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa danh mục</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xóa danh mục &quot;{category.name}
                      &quot;? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(category)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TableCell>
        </TableRow>
        {hasChildren &&
          isExpanded &&
          category.children?.map((child) => (
            <React.Fragment key={child.id}>
              {renderCategoryRow(child, level + 1)}
            </React.Fragment>
          ))}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh mục...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="text-gray-600">
            Quản lý danh mục sản phẩm theo cấu trúc phân cấp
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setFormData(initialFormData);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Tên danh mục *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nhập tên danh mục"
                  required
                />
              </div>

              <div>
                <Label htmlFor="parent_id">Danh mục cha</Label>
                <Select
                  value={formData.parent_id?.toString() || "0"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      parent_id: value === "0" ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục cha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Không có danh mục cha</SelectItem>
                    {flatCategories
                      .filter((cat) => cat.id !== editingCategory?.id)
                      .map((category) => (
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
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Nhập mô tả danh mục"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="sort_order">Thứ tự sắp xếp</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <Label>Hình ảnh danh mục</Label>
                <MediaSelector
                  selectedImage={formData.image}
                  onSelect={(imageUrl) => {
                    setFormData({ ...formData, image: imageUrl });
                    console.log("Selected image:", imageUrl);
                  }}
                  placeholder="Chọn hình ảnh cho danh mục"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {submitting
                    ? "Đang lưu..."
                    : editingCategory
                      ? "Cập nhật"
                      : "Thêm mới"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách danh mục</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm danh mục..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Mô t��</TableHead>
                <TableHead className="text-center">Sản phẩm</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-gray-500">
                      <FolderTree className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Chưa có danh mục nào</p>
                      <p className="text-sm">
                        Thêm danh mục đ��u tiên để bắt đầu
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <React.Fragment key={category.id}>
                    {renderCategoryRow(category)}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
