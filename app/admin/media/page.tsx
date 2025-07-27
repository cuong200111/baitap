"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Upload,
  Search,
  Image as ImageIcon,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { getMediaUrl } from "../../../config";
import { apiWrappers } from "@/lib/api-wrapper";

interface MediaFile {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  alt_text?: string;
  title?: string;
  entity_type: string;
  entity_id?: number;
  uploaded_by: number;
  created_at: string;
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null);

  // Upload form state
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadEntityType, setUploadEntityType] = useState("general");

  // Edit form state
  const [editForm, setEditForm] = useState({
    alt_text: "",
    title: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadMediaWithCancel = async () => {
      if (cancelled) return;
      await loadMedia();
    };

    loadMediaWithCancel();

    return () => {
      cancelled = true;
    };
  }, []);

  // Separate effect for filter changes with debouncing
  useEffect(() => {
    let cancelled = false;

    // Debounce the filter change to avoid too many requests
    const timeoutId = setTimeout(async () => {
      if (cancelled) return;
      await loadMedia();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [entityFilter]);

  const loadMedia = async () => {
    try {
      const params: any = { page: 1, limit: 50 };
      if (entityFilter !== "all") {
        params.entity_type = entityFilter;
      }

      const response = await apiWrappers.media.getAll(params);
      if (response.success && response.data) {
        setMedia(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      // Don't show error for cancelled requests
      if (error?.cancelled || error?.name === "AbortError") {
        console.log("Media load request was cancelled");
        return;
      }
      console.error("Failed to load media:", error);
      toast.error("Không thể tải danh sách ảnh");
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadFiles(files);
    }
  };

  const handleUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0) {
      toast.error("Vui lòng chọn file để upload");
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = Array.from(uploadFiles).map((file) =>
        apiWrappers.media.upload(file, uploadEntityType),
      );

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter((r) => r.success).length;

      if (successCount === uploadFiles.length) {
        toast.success(`Đã upload thành công ${successCount} file`);
      } else {
        toast.warning(
          `Upload thành công ${successCount}/${uploadFiles.length} file`,
        );
      }

      setIsUploadDialogOpen(false);
      setUploadFiles(null);
      await loadMedia();
    } catch (error: any) {
      console.error("Upload failed:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message || error?.error || "Upload thất bại";
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (mediaFile: MediaFile) => {
    setEditingMedia(mediaFile);
    setEditForm({
      alt_text: mediaFile.alt_text || "",
      title: mediaFile.title || "",
    });
  };

  const handleUpdateMedia = async () => {
    if (!editingMedia) return;

    try {
      await apiWrappers.media.update(editingMedia.id, {
        alt_text: editForm.alt_text,
        title: editForm.title,
      });
      toast.success("Cập nhật thông tin ảnh thành công");
      setEditingMedia(null);
      await loadMedia();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Cập nhật thất bại");
    }
  };

  const handleDelete = async (mediaId: number) => {
    try {
      await apiWrappers.media.delete(mediaId);
      toast.success("Xóa ảnh thành công");
      await loadMedia();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Xóa ảnh thất bại");
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Đã copy URL ảnh");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredMedia =
    media?.filter((item) => {
      const matchesSearch =
        item.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEntity =
        entityFilter === "all" || item.entity_type === entityFilter;

      return matchesSearch && matchesEntity;
    }) || [];

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
          <h1 className="text-3xl font-bold text-gray-900">Thư viện ảnh</h1>
          <p className="text-gray-600">
            Quản lý tất cả ảnh và media files của website
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Upload ảnh
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload ảnh mới</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="entity_type">Loại</Label>
                <Select
                  value={uploadEntityType}
                  onValueChange={setUploadEntityType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Chung</SelectItem>
                    <SelectItem value="product">Sản phẩm</SelectItem>
                    <SelectItem value="category">Danh mục</SelectItem>
                    <SelectItem value="user">Người dùng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="files">Chọn file</Label>
                <input
                  id="files"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                />
              </div>

              {uploadFiles && uploadFiles.length > 0 && (
                <div className="text-sm text-gray-600">
                  Đã chọn {uploadFiles.length} file
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!uploadFiles || uploading}
              >
                {uploading ? "Đang upload..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm ảnh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="general">Chung</SelectItem>
                <SelectItem value="product">Sản phẩm</SelectItem>
                <SelectItem value="category">Danh mục</SelectItem>
                <SelectItem value="user">Người dùng</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" />
              Tổng: {filteredMedia.length} ảnh
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredMedia.length > 0 ? (
          filteredMedia.map((item) => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="aspect-square relative">
                <img
                  src={getMediaUrl(item.filename)}
                  alt={item.alt_text || item.original_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyUrl(item.url)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(item.url, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa ảnh &quot;
                            {item.original_name}&quot;? Hành động này không thể
                            hoàn tác.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm truncate">
                  {item.title || item.original_name}
                </h3>
                <div className="text-xs text-gray-500 mt-1">
                  <div>{formatFileSize(item.size)}</div>
                  <div className="capitalize">{item.entity_type}</div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Chưa có ảnh nào</p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              Upload ảnh đầu tiên
            </Button>
          </div>
        )}
      </div>

      {/* Edit Media Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin ảnh</DialogTitle>
          </DialogHeader>

          {editingMedia && (
            <div className="space-y-4">
              <div className="aspect-square">
                <img
                  src={getMediaUrl(editingMedia.filename)}
                  alt={editingMedia.alt_text || editingMedia.original_name}
                  className="w-full h-full object-cover rounded"
                />
              </div>

              <div>
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Nhập tiêu đề ảnh"
                />
              </div>

              <div>
                <Label htmlFor="alt_text">Alt text</Label>
                <Input
                  id="alt_text"
                  value={editForm.alt_text}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      alt_text: e.target.value,
                    }))
                  }
                  placeholder="Mô tả ảnh cho SEO"
                />
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <div>File: {editingMedia.original_name}</div>
                <div>Kích thước: {formatFileSize(editingMedia.size)}</div>
                <div>Loại: {editingMedia.entity_type}</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingMedia(null)}
            >
              Hủy
            </Button>
            <Button type="button" onClick={handleUpdateMedia}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
