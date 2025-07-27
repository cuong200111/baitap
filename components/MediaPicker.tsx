"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image as ImageIcon, Upload, Search, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { mediaApi, getMediaUrl } from "../config";
import ErrorBoundary from "./ErrorBoundary";

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
}

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaFile: MediaFile) => void;
  onBulkSelect?: (mediaFiles: MediaFile[]) => void;
  multiple?: boolean;
  selectedIds?: number[];
  entityType?: string;
  title?: string;
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  onBulkSelect,
  multiple = false,
  selectedIds = [],
  entityType = "general",
  title = "Chọn ảnh",
}: MediaPickerProps) {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [selected, setSelected] = useState<number[]>(selectedIds);
  const [uploading, setUploading] = useState(false);
  const [lastLoadParams, setLastLoadParams] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    if (isOpen) {
      setSelected(selectedIds);
      setSearchTerm(""); // Reset search when opening

      // Load media with cancellation support
      const loadMediaWithCancel = async () => {
        if (cancelled) return;
        await loadMedia();
      };

      loadMediaWithCancel();
    } else {
      // Reset selected state when dialog closes
      setSelected([]);
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen]); // Remove selectedIds dependency to prevent infinite loops

  // Separate effect for filter changes to avoid infinite loops
  useEffect(() => {
    let cancelled = false;

    if (isOpen) {
      // Debounce the filter change to avoid too many requests
      const timeoutId = setTimeout(async () => {
        if (cancelled) return;
        await loadMedia();
      }, 500); // Increase debounce time

      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
      };
    }
  }, [entityFilter]); // Remove isOpen dependency to prevent infinite loops

  const loadMedia = useCallback(async () => {
    // Prevent loading if already loading or not open
    if (loading || !isOpen) return;

    const params: any = { page: 1, limit: 100 };
    if (entityFilter !== "all") {
      params.entity_type = entityFilter;
    }

    // Create a params string to check if we need to reload
    const paramsString = JSON.stringify(params);
    if (paramsString === lastLoadParams && media.length > 0) {
      // Don't reload if params haven't changed and we have data
      return;
    }

    setLoading(true);
    try {
      const response = await mediaApi.getAll(params);

      if (response.success && response.data) {
        const mediaData = Array.isArray(response.data) ? response.data : [];
        setMedia(mediaData);
        setLastLoadParams(paramsString);
      } else {
        setMedia([]);
        if (response.message) {
          toast.error(response.message);
        }
      }
    } catch (error: any) {
      // Don't show error for cancelled requests
      if (error?.cancelled || error?.name === "AbortError") {
        return;
      }
      console.error("Failed to load media:", error);
      toast.error("Không thể tải danh sách ảnh");
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, [loading, isOpen, entityFilter, lastLoadParams, media.length]);

  const handleSelect = (mediaFile: MediaFile) => {
    try {
      if (multiple) {
        const newSelected = selected.includes(mediaFile.id)
          ? selected.filter((id) => id !== mediaFile.id)
          : [...selected, mediaFile.id];
        setSelected(newSelected);
      } else {
        onSelect(mediaFile);
        onClose();
      }
    } catch (error) {
      console.error("Error selecting media file:", error);
      toast.error("Lỗi khi chọn ảnh");
    }
  };

  const handleConfirmMultiple = () => {
    if (multiple && selected.length > 0) {
      const selectedMedia = media.filter((m) => selected.includes(m.id));

      if (onBulkSelect) {
        // Use bulk handler if available (regardless of count)
        onBulkSelect(selectedMedia);
      } else {
        // For single item or if no bulk handler, use regular onSelect
        selectedMedia.forEach((mediaItem) => onSelect(mediaItem));
      }
      onClose();
    }
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) =>
        mediaApi.upload(file, entityType),
      );

      const results = await Promise.all(uploadPromises);
      const successResults = results.filter((r) => r.success);

      if (successResults.length > 0) {
        toast.success(`Đã upload thành công ${successResults.length} file`);
        await loadMedia();

        // Auto select newly uploaded files
        if (successResults.length === 1 && !multiple) {
          const newMedia = successResults[0].data;
          if (newMedia) {
            onSelect(newMedia);
            onClose();
          }
        }
      }
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

  const filteredMedia = useMemo(() => {
    if (!media || media.length === 0) return [];

    return media.filter((item) => {
      const matchesSearch =
        item.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEntity =
        entityFilter === "all" || item.entity_type === entityFilter;

      return matchesSearch && matchesEntity;
    });
  }, [media, searchTerm, entityFilter]);

  return (
    <ErrorBoundary>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm ảnh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-48">
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

              <div className="flex gap-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleQuickUpload}
                  className="hidden"
                  id="quick-upload"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("quick-upload")?.click()
                  }
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Media Grid */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : filteredMedia.length > 0 ? (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {filteredMedia.map((item) => (
                    <div
                      key={item.id}
                      className={`relative aspect-square border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selected.includes(item.id)
                          ? "border-red-500 ring-2 ring-red-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleSelect(item)}
                    >
                      <img
                        src={getMediaUrl(item.filename)}
                        alt={item.alt_text || item.original_name}
                        className="w-full h-full object-cover"
                      />
                      {selected.includes(item.id) && (
                        <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                          <div className="bg-red-500 text-white rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                        {item.title || item.original_name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? "Không tìm thấy ảnh nào" : "Chưa có ảnh nào"}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("quick-upload")?.click()
                    }
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload ảnh đầu tiên
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-600">
                {multiple && selected.length > 0 && (
                  <span>Đã chọn {selected.length} ảnh</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                {multiple && selected.length > 0 && (
                  <Button onClick={handleConfirmMultiple}>
                    Chọn {selected.length} ảnh
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}
