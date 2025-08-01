"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Camera,
  Save,
  User,
  MapPin,
  Lock,
  CheckCircle,
  AlertCircle,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Domain, getMediaUrl } from "@/config";
import { toast } from "sonner";

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  avatar?: string;
  address?: string;
  province_id?: number;
  province_name?: string;
  district_id?: number;
  district_name?: string;
  ward_id?: number;
  ward_name?: string;
  role: string;
  created_at: string;
}

interface Province {
  code: number;
  name: string;
  full_name: string;
}

interface District {
  code: number;
  name: string;
  full_name: string;
  province_code: number;
}

interface Ward {
  code: number;
  name: string;
  full_name: string;
  district_code: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Robust request handling to prevent "body stream already read" errors
  const updateInProgress = useRef<boolean>(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
  });

  // Address input mode - default to manual (true)
  const [isManualAddressMode, setIsManualAddressMode] = useState(true);
  const [addressData, setAddressData] = useState({
    province_name: "",
    district_name: "",
    ward_name: "",
  });

  // API selection state (only used when API mode is enabled)
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null,
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null,
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadProfile();
    // Only load provinces if user switches to API mode
    // Default to manual mode, so no need to load provinces immediately
  }, [user, router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${Domain}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setFormData({
          full_name: data.data.full_name || "",
          phone: data.data.phone || "",
          address: data.data.address || "",
        });

        // Set address data - always use names
        setAddressData({
          province_name: data.data.province_name || "",
          district_name: data.data.district_name || "",
          ward_name: data.data.ward_name || "",
        });

        // Always default to manual mode
        setIsManualAddressMode(true);

        // No need to load districts/wards on initial load since we default to manual mode
      } else {
        toast.error("Không thể tải thông tin profile");
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast.error("Có lỗi xảy ra khi tải thông tin");
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async () => {
    // Prevent multiple simultaneous calls
    if (loadingLocations) return;

    try {
      setLoadingLocations(true);

      const response = await fetch("/api/locations?type=provinces");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setProvinces(data.data);
      } else {
        throw new Error(data.message || "No data received");
      }
    } catch (error: any) {
      console.error("Failed to load provinces:", error);

      // Only show error toast if it's not an abort error
      if (error.name !== "AbortError") {
        // Set fallback provinces for common areas
        setProvinces([
          { code: 1, name: "Hà Nội", full_name: "Thành phố Hà Nội" },
          {
            code: 79,
            name: "TP Hồ Chí Minh",
            full_name: "Thành phố Hồ Chí Minh",
          },
          { code: 48, name: "Đà Nẵng", full_name: "Thành phố Đà Nẵng" },
          { code: 92, name: "Cần Thơ", full_name: "Thành phố Cần Thơ" },
        ]);
      }
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadDistricts = async (provinceCode: number) => {
    try {
      setLoadingLocations(true);

      const response = await fetch(
        `${Domain}/api/locations?type=districts&province_code=${provinceCode}`,
      );

      const data = await response.json();
      if (data.success) {
        setDistricts(data.data);
      } else {
        console.error("Failed to load districts:", data.message);
        // Don't show error toast for external API failures
      }
    } catch (error: any) {
      console.error("Failed to load districts:", error);
      // Only show error if it's not an abort error
      if (error.name !== "AbortError") {
        // Don't show error toast for external API failures
      }
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadWards = async (districtCode: number) => {
    try {
      setLoadingLocations(true);

      const response = await fetch(
        `${Domain}/api/locations?type=wards&district_code=${districtCode}`,
      );

      const data = await response.json();
      if (data.success) {
        setWards(data.data);
      } else {
        console.error("Failed to load wards:", data.message);
        // Don't show error toast for external API failures
      }
    } catch (error: any) {
      console.error("Failed to load wards:", error);
      // Only show error if it's not an abort error
      if (error.name !== "AbortError") {
        // Don't show error toast for external API failures
      }
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setAddressData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressModeToggle = (checked: boolean) => {
    setIsManualAddressMode(checked);
    if (checked) {
      // Switching to manual mode - clear API selections
      setSelectedProvince(null);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setDistricts([]);
      setWards([]);
    } else {
      // Switching to API mode - load provinces if not already loaded
      if (provinces.length === 0) {
        loadProvinces();
      }
    }
  };

  const handleProvinceChange = (value: string) => {
    const province = provinces.find((p) => p.code.toString() === value);
    setSelectedProvince(province || null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);

    if (province) {
      // Update address data with selected province name
      setAddressData((prev) => ({
        ...prev,
        province_name: province.name,
        district_name: "",
        ward_name: "",
      }));
      loadDistricts(province.code);
    }
  };

  const handleDistrictChange = (value: string) => {
    const district = districts.find((d) => d.code.toString() === value);
    setSelectedDistrict(district || null);
    setSelectedWard(null);
    setWards([]);

    if (district) {
      // Update address data with selected district name
      setAddressData((prev) => ({
        ...prev,
        district_name: district.name,
        ward_name: "",
      }));
      loadWards(district.code);
    }
  };

  const handleWardChange = (value: string) => {
    const ward = wards.find((w) => w.code.toString() === value);
    setSelectedWard(ward || null);

    if (ward) {
      // Update address data with selected ward name
      setAddressData((prev) => ({
        ...prev,
        ward_name: ward.name,
      }));
    }
  };

  const handleUpdateProfile = async () => {
    // Use ref-based check to prevent race conditions
    if (updateInProgress.current) {
      console.log("Update already in progress, ignoring request");
      return;
    }

    // Mark update as in progress
    updateInProgress.current = true;

    try {
      setUpdating(true);

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Phiên đăng nhập đã hết hạn");
        return;
      }

      // Validate required fields
      if (!formData.full_name.trim()) {
        toast.error("Vui lòng nhập họ và tên");
        return;
      }

      // Always store only names in database
      const updateData = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        province_name: addressData.province_name.trim() || null,
        district_name: addressData.district_name.trim() || null,
        ward_name: addressData.ward_name.trim() || null,
      };

      console.log("Updating profile with data:", {
        mode: isManualAddressMode ? "manual" : "api",
        updateData,
      });

      // Create request body once and reuse
      const requestBody = JSON.stringify(updateData);

      const response = await fetch(`${Domain}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: requestBody,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Profile update response:", data);

      if (data.success) {
        setProfile(data.data);
        toast.success("Cập nhật thông tin thành công");

        // Refresh user context
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        console.error("Profile update failed:", data);
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Update profile error:", error);

      // Don't show error if request was aborted (user initiated)
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }

      // Handle specific error types
      if (error.message?.includes("body stream already read")) {
        toast.error("Lỗi hệ thống. Vui lòng tải lại trang và thử lại");
      } else if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("NetworkError")
      ) {
        toast.error(
          "Không thể kết nối đến server. Vui l��ng kiểm tra kết nối mạng",
        );
      } else {
        toast.error("Có l��i xảy ra khi cập nhật thông tin. Vui lòng thử lại");
      }
    } finally {
      setUpdating(false);
      updateInProgress.current = false;
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("avatar", file);

      // Add current profile data to maintain other fields
      Object.entries(profile || {}).forEach(([key, value]) => {
        if (key !== "avatar" && value) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(`${Domain}/api/auth/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        toast.success("Cập nhật ảnh đại diện thành công");

        // Refresh user context
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        toast.error(data.message || "Có l���i xảy ra");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Có lỗi xảy ra khi tải ảnh lên");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước file không được vượt quá 5MB");
        return;
      }

      handleAvatarUpload(file);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${Domain}/api/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đổi mật khẩu thành công");
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        setIsPasswordDialogOpen(false);
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("Có lỗi xảy ra khi đổi mật khẩu");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="lg:col-span-2 h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Không thể tải profile
            </h2>
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Thông tin cá nhân
            </h1>
            <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Avatar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Ảnh đại diện</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="relative w-32 h-32 mx-auto">
                    <Image
                      src={
                        profile.avatar
                          ? getMediaUrl(profile.avatar)
                          : "/placeholder.svg"
                      }
                      alt="Avatar"
                      fill
                      className="object-cover rounded-full border-4 border-gray-200"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                  <p className="text-gray-600">{profile.email}</p>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        profile.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {profile.role === "admin"
                        ? "Quản trị viên"
                        : "Khách hàng"}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingAvatar ? "Đang tải lên..." : "Thay đổi ảnh"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Thông tin cá nhân</TabsTrigger>
                <TabsTrigger value="security">B��o mật</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Họ và tên</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) =>
                            handleInputChange("full_name", e.target.value)
                          }
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Số đi��n thoại</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          placeholder="0912345678"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email không thể thay đổi
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Địa chỉ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Address Mode Toggle */}
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="manual-address"
                        checked={isManualAddressMode}
                        onCheckedChange={handleAddressModeToggle}
                      />
                      <Label
                        htmlFor="manual-address"
                        className="text-sm font-medium"
                      >
                        Nhập địa chỉ thủ công
                      </Label>
                      <span className="text-xs text-gray-500">
                        (Bỏ tích để chọn từ danh sách vùng miền Việt Nam)
                      </span>
                    </div>

                    {/* Address Input Fields */}
                    {isManualAddressMode ? (
                      // Manual Input Mode
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="manual_province">
                            Tỉnh/Thành phố
                          </Label>
                          <Input
                            id="manual_province"
                            value={addressData.province_name}
                            onChange={(e) =>
                              handleAddressChange(
                                "province_name",
                                e.target.value,
                              )
                            }
                            placeholder="Nhập tên tỉnh/thành phố"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual_district">Quận/Huyện</Label>
                          <Input
                            id="manual_district"
                            value={addressData.district_name}
                            onChange={(e) =>
                              handleAddressChange(
                                "district_name",
                                e.target.value,
                              )
                            }
                            placeholder="Nhập tên quận/huyện"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual_ward">Phường/Xã</Label>
                          <Input
                            id="manual_ward"
                            value={addressData.ward_name}
                            onChange={(e) =>
                              handleAddressChange("ward_name", e.target.value)
                            }
                            placeholder="Nhập tên phường/xã"
                          />
                        </div>
                      </div>
                    ) : (
                      // API Dropdown Mode
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="province">Tỉnh/Thành phố</Label>
                          <Select
                            value={selectedProvince?.code.toString() || ""}
                            onValueChange={handleProvinceChange}
                            disabled={loadingLocations}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn tỉnh" />
                            </SelectTrigger>
                            <SelectContent>
                              {provinces.map((province) => (
                                <SelectItem
                                  key={province.code}
                                  value={province.code.toString()}
                                >
                                  {province.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="district">Quận/Huyện</Label>
                          <Select
                            value={selectedDistrict?.code.toString() || ""}
                            onValueChange={handleDistrictChange}
                            disabled={
                              !selectedProvince || districts.length === 0
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn huyện" />
                            </SelectTrigger>
                            <SelectContent>
                              {districts.map((district) => (
                                <SelectItem
                                  key={district.code}
                                  value={district.code.toString()}
                                >
                                  {district.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="ward">Phường/Xã</Label>
                          <Select
                            value={selectedWard?.code.toString() || ""}
                            onValueChange={handleWardChange}
                            disabled={!selectedDistrict || wards.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn xã" />
                            </SelectTrigger>
                            <SelectContent>
                              {wards.map((ward) => (
                                <SelectItem
                                  key={ward.code}
                                  value={ward.code.toString()}
                                >
                                  {ward.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="address">Địa chỉ chi tiết</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        placeholder="S��� nh��, tên đường..."
                      />
                    </div>

                    <Button
                      onClick={handleUpdateProfile}
                      disabled={updating || updateInProgress.current}
                      className="w-full md:w-auto"
                      type="button"
                    >
                      {updating ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {updating ? "Đang cập nhật..." : "Lưu thay đổi"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Bảo m��t tài khoản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Tài khoản của bạn được bảo mật bằng mật khẩu mạnh.
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <h4 className="font-medium">Mật khẩu</h4>
                        <p className="text-sm text-gray-600">
                          Cập nhật lần cuối:{" "}
                          {new Date(profile.created_at).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                      <Dialog
                        open={isPasswordDialogOpen}
                        onOpenChange={setIsPasswordDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline">Đổi mật khẩu</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Đổi mật kh����u</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="current_password">
                                Mật kh��u hiện tại
                              </Label>
                              <Input
                                id="current_password"
                                type="password"
                                value={passwordData.current_password}
                                onChange={(e) =>
                                  setPasswordData((prev) => ({
                                    ...prev,
                                    current_password: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="new_password">Mật khẩu mới</Label>
                              <Input
                                id="new_password"
                                type="password"
                                value={passwordData.new_password}
                                onChange={(e) =>
                                  setPasswordData((prev) => ({
                                    ...prev,
                                    new_password: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="confirm_password">
                                Xác nhận mật khẩu mới
                              </Label>
                              <Input
                                id="confirm_password"
                                type="password"
                                value={passwordData.confirm_password}
                                onChange={(e) =>
                                  setPasswordData((prev) => ({
                                    ...prev,
                                    confirm_password: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleChangePassword}
                                className="flex-1"
                              >
                                Đổi mật khẩu
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setIsPasswordDialogOpen(false)}
                              >
                                Hủy
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-red-600 mb-2">
                        Vùng nguy hiểm
                      </h4>
                      <Button
                        variant="destructive"
                        onClick={logout}
                        className="w-full md:w-auto"
                      >
                        Đăng xuất khỏi tất cả thiết bị
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
