"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Search, Image as ImageIcon } from "lucide-react";
import { mediaApi, getMediaUrl, MediaFile } from "@/config";
import { toast } from "sonner";

// MediaFile interface imported from config.ts

interface MediaSelectorProps {
  selectedImage?: string;
  onSelect: (imageUrl: string) => void;
  trigger?: React.ReactNode;
  placeholder?: string;
}

export function MediaSelector({
  selectedImage,
  onSelect,
  trigger,
  placeholder = "Chọn hình ảnh",
}: MediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadMediaFiles();
    }
  }, [isOpen]);

  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      const response = await mediaApi.getAll();
      if (response.success && response.data) {
        setMediaFiles(response.data);
      }
    } catch (error) {
      console.error("Failed to load media files:", error);
      toast.error("Không thể tải danh sách media");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ cho phép upload file hình ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    setUploading(true);
    try {
      const response = await mediaApi.upload(file, "category");
      if (response.success && response.data) {
        toast.success("Upload hình ảnh thành công");
        await loadMediaFiles(); // Reload media list
      } else {
        toast.error(response.message || "Upload thất bại");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Upload thất bại");
    } finally {
      setUploading(false);
      event.target.value = ""; // Reset file input
    }
  };

  const handleSelect = (mediaFile: MediaFile) => {
    onSelect(mediaFile.url);
    setIsOpen(false);
  };

  const filteredFiles = mediaFiles.filter(
    (file) =>
      file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.alt_text || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <div className="space-y-2">
          {selectedImage && (
            <div className="relative inline-block">
              <img
                src={getMediaUrl(selectedImage)}
                alt="Selected"
                className="w-32 h-24 object-cover rounded border"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={() => onSelect("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(true)}
            className="w-full"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            {selectedImage ? "Thay đổi hình ảnh" : placeholder}
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Chọn hình ảnh từ thư viện Media</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload & Search */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm hình ảnh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Button disabled={uploading} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Đang upload..." : "Upload mới"}
                </Button>
              </div>
            </div>

            {/* Media Grid */}
            <div className="h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p>Không có hình ảnh nào</p>
                  <p className="text-sm">Upload hình ảnh mới để bắt đầu</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {filteredFiles.map((file) => (
                    <Card
                      key={file.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSelect(file)}
                    >
                      <CardContent className="p-2">
                        <div className="aspect-square mb-2">
                          <img
                            src={getMediaUrl(file.url)}
                            alt={file.alt_text || file.original_name}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="space-y-1">
                          <p
                            className="text-xs font-medium truncate"
                            title={file.original_name}
                          >
                            {file.original_name}
                          </p>
                          {file.alt_text && (
                            <Badge variant="secondary" className="text-xs">
                              {file.alt_text}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
