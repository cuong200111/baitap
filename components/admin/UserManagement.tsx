"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  Shield,
  User as UserIcon,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { usersApi } from "../../config";
import { User } from "../../types";

interface UserFormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: "admin" | "user";
  is_active: boolean;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "user",
    is_active: true,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    userId: 0,
    newPassword: "",
    confirmPassword: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersApi.getAll({ page: 1, limit: 50 });
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      full_name: "",
      phone: "",
      role: "user",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "", // Don't populate password
      full_name: user.full_name,
      phone: user.phone || "",
      role: user.role,
      is_active: user.is_active,
    });
    setIsDialogOpen(true);
  };

  const openPasswordDialog = (userId: number) => {
    setPasswordData({
      userId,
      newPassword: "",
      confirmPassword: "",
    });
    setIsPasswordDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.full_name) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error("Vui lòng nhập mật khẩu cho người dùng mới");
      return;
    }

    setSubmitting(true);
    try {
      const userData = { ...formData };

      // Don't send empty password for edit
      if (editingUser && !userData.password) {
        delete (userData as any).password;
      }

      let response;
      if (editingUser) {
        response = await usersApi.update(editingUser.id, userData);
      } else {
        response = await usersApi.create(userData);
      }

      if (response.success) {
        toast.success(
          editingUser
            ? "Cập nhật người dùng thành công"
            : "Tạo người dùng thành công",
        );
        setIsDialogOpen(false);
        await loadUsers();
      }
    } catch (error) {
      console.error("Failed to save user:", error);
      toast.error("Lưu thông tin người dùng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin mật khẩu");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setSubmitting(true);
    try {
      console.log(
        "🔑 Attempting to change password for user ID:",
        passwordData.userId,
      );

      const response = await usersApi.changePassword(passwordData.userId, {
        new_password: passwordData.newPassword,
      });

      console.log("🔑 Password change response:", response);

      if (response.success) {
        toast.success("Đổi mật khẩu thành công");
        setIsPasswordDialogOpen(false);
        setPasswordData({ userId: 0, newPassword: "", confirmPassword: "" });
      } else {
        toast.error(response.message || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error(
        "Đổi mật khẩu thất bại - " + (error.message || "Lỗi kết nối"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await usersApi.update(userId, {
        is_active: !currentStatus,
      });

      if (response.success) {
        toast.success(
          `${!currentStatus ? "Kích hoạt" : "Vô hiệu hóa"} người dùng thành công`,
        );
        await loadUsers();
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
      toast.error("Cập nhật trạng thái người dùng thất bại");
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      const response = await usersApi.delete(userId);
      if (response.success) {
        toast.success("Xóa người dùng thành công");
        await loadUsers();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Xóa người dùng thất bại");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý người dùng
          </h1>
          <p className="text-gray-600">
            Quản lý tài khoản người dùng, phân quyền và trạng thái hoạt động
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Tổng người dùng
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Quản trị viên
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Người dùng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.role === "user").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoạt đ���ng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="user">Người dùng</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              Tổng: {filteredUsers.length} người dùng
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role === "admin" ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Quản trị viên
                        </>
                      ) : (
                        <>
                          <UserIcon className="h-3 w-3 mr-1" />
                          Người dùng
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() =>
                          handleToggleStatus(user.id, user.is_active)
                        }
                      />
                      <span className="text-sm">
                        {user.is_active ? "Hoạt động" : "Không hoạt động"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPasswordDialog(user.id)}
                      >
                        Đổi MK
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
                              Bạn có chắc chắn muốn xóa người dùng &quot;
                              {user.full_name}&quot;? Hành động này không thể
                              hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user.id)}
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Họ và tên *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Nhập địa chỉ email"
              />
            </div>

            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Nhập số điện thoại"
              />
            </div>

            {!editingUser && (
              <div>
                <Label htmlFor="password">Mật khẩu *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Nhập mật khẩu"
                />
              </div>
            )}

            <div>
              <Label htmlFor="role">Vai trò</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "user") =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Người dùng</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="is_active">Tài khoản hoạt động</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu người dùng</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new_password">Mật khẩu m���i *</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="Nhập mật khẩu mới"
              />
            </div>

            <div>
              <Label htmlFor="confirm_password">Xác nhận mật khẩu *</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={submitting}
            >
              {submitting ? "Đang đổi..." : "��ổi mật khẩu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
