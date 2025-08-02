"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Globe,
  Image,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Domain } from "@/config";

interface CustomSitemap {
  id: number;
  url: string;
  title?: string;
  description?: string;
  priority: number;
  changefreq: string;
  last_modified?: string;
  image_url?: string;
  image_title?: string;
  image_caption?: string;
  mobile_friendly: boolean;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface CustomSitemapManagerProps {
  authToken?: string;
}

export default function CustomSitemapManager({
  authToken,
}: CustomSitemapManagerProps) {
  const [sitemaps, setSitemaps] = useState<CustomSitemap[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSitemap, setEditingSitemap] = useState<CustomSitemap | null>(
    null,
  );
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    description: "",
    priority: 0.2,
    changefreq: "monthly",
    last_modified: "",
    image_url: "",
    image_title: "",
    image_caption: "",
    mobile_friendly: true,
    status: "active" as "active" | "inactive",
  });

  // Fetch sitemaps
  const fetchSitemaps = async () => {
    try {
      console.log('Fetching sitemaps with token:', authToken ? 'exists' : 'missing');
      const response = await fetch(`${Domain}/api/custom-sitemaps/admin`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        if (data.success) {
          setSitemaps(data.data);
        } else {
          console.error('API returned success: false', data);
          toast.error(data.message || 'Không thể tải sitemap');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Response not ok:', response.status, errorData);
        toast.error(errorData.message || `Lỗi: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching custom sitemaps:", error);
      toast.error("Không thể tải danh sách sitemap");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchSitemaps();
    }
  }, [authToken]);

  // Reset form
  const resetForm = () => {
    setFormData({
      url: "",
      title: "",
      description: "",
      priority: 0.2,
      changefreq: "monthly",
      last_modified: "",
      image_url: "",
      image_title: "",
      image_caption: "",
      mobile_friendly: true,
      status: "active",
    });
    setEditingSitemap(null);
  };

  // Handle create/edit
  const handleSubmit = async () => {
    try {
      const isEditing = editingSitemap !== null;
      const url = isEditing
        ? `${Domain}/api/custom-sitemaps/${editingSitemap.id}`
        : `${Domain}/api/custom-sitemaps`;

      const method = isEditing ? "PUT" : "POST";

      const submitData = { ...formData };
      if (submitData.last_modified && submitData.last_modified.trim()) {
        submitData.last_modified = new Date(
          submitData.last_modified,
        ).toISOString();
      } else {
        delete submitData.last_modified;
      }

      console.log('Submitting sitemap:', { method, url, submitData, authToken: authToken ? 'exists' : 'missing' });

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      console.log('Submit response status:', response.status);
      const data = await response.json();
      console.log('Submit response data:', data);

      if (response.ok && data.success) {
        toast.success(
          isEditing ? "Cập nhật sitemap thành công" : "Thêm sitemap thành công",
        );
        setIsDialogOpen(false);
        resetForm();
        fetchSitemaps();
      } else {
        console.error('Submit failed:', data);
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error saving sitemap:", error);
      toast.error("Không thể lưu sitemap");
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sitemap này?")) return;

    try {
      const response = await fetch(`${Domain}/api/custom-sitemaps/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Xóa sitemap thành công");
        fetchSitemaps();
      } else {
        toast.error(data.message || "Không thể xóa sitemap");
      }
    } catch (error) {
      console.error("Error deleting sitemap:", error);
      toast.error("Không thể xóa sitemap");
    }
  };

  // Handle edit
  const handleEdit = (sitemap: CustomSitemap) => {
    setEditingSitemap(sitemap);
    setFormData({
      url: sitemap.url,
      title: sitemap.title || "",
      description: sitemap.description || "",
      priority: sitemap.priority,
      changefreq: sitemap.changefreq,
      last_modified: sitemap.last_modified
        ? sitemap.last_modified.split("T")[0]
        : "",
      image_url: sitemap.image_url || "",
      image_title: sitemap.image_title || "",
      image_caption: sitemap.image_caption || "",
      mobile_friendly: sitemap.mobile_friendly,
      status: sitemap.status,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Đang tải...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Quản lý Sitemap tùy chỉnh
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Thêm các URL tùy chỉnh vào sitemap với độ ưu tiên 0.2
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm sitemap
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSitemap ? "Sửa sitemap" : "Thêm sitemap mới"}
                </DialogTitle>
                <DialogDescription>
                  Nhập thông tin cho URL muốn thêm vào sitemap
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/page"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, url: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Tiêu đề</Label>
                    <Input
                      id="title"
                      placeholder="Tiêu đề trang"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Độ ưu tiên</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: parseFloat(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả nội dung trang"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="changefreq">Tần suất cập nhật</Label>
                    <Select
                      value={formData.changefreq}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, changefreq: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">Luôn luôn</SelectItem>
                        <SelectItem value="hourly">Hàng giờ</SelectItem>
                        <SelectItem value="daily">Hàng ngày</SelectItem>
                        <SelectItem value="weekly">Hàng tuần</SelectItem>
                        <SelectItem value="monthly">Hàng tháng</SelectItem>
                        <SelectItem value="yearly">Hàng năm</SelectItem>
                        <SelectItem value="never">Không bao giờ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last_modified">Ngày sửa đổi cuối</Label>
                    <Input
                      id="last_modified"
                      type="date"
                      value={formData.last_modified}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          last_modified: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="image_url">URL hình ảnh</Label>
                  <Input
                    id="image_url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        image_url: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="image_title">Tiêu đề hình ảnh</Label>
                    <Input
                      id="image_title"
                      placeholder="Tiêu đề cho hình ảnh"
                      value={formData.image_title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          image_title: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="image_caption">Chú thích hình ảnh</Label>
                    <Input
                      id="image_caption"
                      placeholder="Chú thích cho hình ảnh"
                      value={formData.image_caption}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          image_caption: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mobile_friendly"
                      checked={formData.mobile_friendly}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          mobile_friendly: checked,
                        }))
                      }
                    />
                    <Label htmlFor="mobile_friendly">Tương thích mobile</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="status">Trạng thái:</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Kích hoạt</SelectItem>
                        <SelectItem value="inactive">Tạm dừng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleSubmit}>
                  {editingSitemap ? "Cập nhật" : "Thêm mới"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Độ ưu tiên</TableHead>
                <TableHead>Tần suất</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sitemaps.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chưa có sitemap tùy chỉnh nào
                  </TableCell>
                </TableRow>
              ) : (
                sitemaps.map((sitemap) => (
                  <TableRow key={sitemap.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={sitemap.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {sitemap.url.length > 50
                            ? sitemap.url.substring(0, 50) + "..."
                            : sitemap.url}
                        </a>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32">
                        {sitemap.title ? (
                          <span className="text-sm">{sitemap.title}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Không có
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {sitemap.priority.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sitemap.changefreq}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sitemap.status === "active" ? "default" : "secondary"
                        }
                      >
                        {sitemap.status === "active" ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Kích hoạt
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Tạm dừng
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(sitemap)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sitemap.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {sitemaps.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Tổng cộng: {sitemaps.length} sitemap tùy chỉnh
          </div>
        )}
      </CardContent>
    </Card>
  );
}
