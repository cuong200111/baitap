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
import {
  fetchProvinces,
  fetchDistricts,
  fetchWards,
} from "@/vietnam-locations";

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
  const {
    user,
    loading: authLoading,
    logout,
    refreshUser,
    isAuthenticated,
  } = useAuth();
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
    // Wait for auth to complete before deciding whether to redirect
    if (authLoading) {
      return; // Still loading, don't do anything yet
    }

    if (!isAuthenticated || !user) {
      // Auth completed and user is not authenticated
      router.push("/login");
      return;
    }

    // User is authenticated, load profile data
    loadProfile();
    // Load provinces immediately for API mode functionality
    loadProvinces();
  }, [user, authLoading, isAuthenticated, router]);

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

      const response = await fetch("https://provinces.open-api.vn/api/p/");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const provinces = await response.json();
      if (provinces && Array.isArray(provinces)) {
        setProvinces(
          provinces.map((p: any) => ({
            code: p.code,
            name: p.name,
            full_name: p.name,
          })),
        );
      } else {
        throw new Error("Invalid provinces data");
      }
    } catch (error: any) {
      console.error("Failed to load provinces:", error);

      // Fallback provinces data
      setProvinces([
        { code: 1, name: "Hà Nội", full_name: "Thành phố Hà Nội" },
        {
          code: 79,
          name: "TP Hồ Chí Minh",
          full_name: "Thành phố Hồ Chí Minh",
        },
        { code: 48, name: "Đà Nẵng", full_name: "Thành phố Đà Nẵng" },
        { code: 92, name: "Cần Thơ", full_name: "Thành phố Cần Thơ" },
        { code: 33, name: "Hải Phòng", full_name: "Thành phố Hải Phòng" },
        { code: 77, name: "Quảng Ninh", full_name: "Tỉnh Quảng Ninh" },
        { code: 26, name: "Khánh Hòa", full_name: "Tỉnh Khánh Hòa" },
        { code: 20, name: "Quảng Nam", full_name: "Tỉnh Quảng Nam" },
        { code: 2, name: "Hà Giang", full_name: "Tỉnh Hà Giang" },
        { code: 4, name: "Cao Bằng", full_name: "Tỉnh Cao Bằng" },
        { code: 6, name: "Bắc Kạn", full_name: "Tỉnh Bắc Kạn" },
        { code: 8, name: "Tuyên Quang", full_name: "Tỉnh Tuyên Quang" },
        { code: 10, name: "Lào Cai", full_name: "Tỉnh Lào Cai" },
        { code: 11, name: "Điện Biên", full_name: "Tỉnh Điện Biên" },
        { code: 12, name: "Lai Châu", full_name: "Tỉnh Lai Châu" },
        { code: 14, name: "Sơn La", full_name: "Tỉnh Sơn La" },
        { code: 15, name: "Yên Bái", full_name: "Tỉnh Yên Bái" },
        { code: 17, name: "Hoà Bình", full_name: "Tỉnh Hoà Bình" },
        { code: 19, name: "Thái Nguyên", full_name: "Tỉnh Thái Nguyên" },
        { code: 22, name: "Lạng Sơn", full_name: "Tỉnh Lạng Sơn" },
        { code: 24, name: "Bắc Giang", full_name: "Tỉnh Bắc Giang" },
        { code: 25, name: "Phú Thọ", full_name: "Tỉnh Phú Thọ" },
        { code: 27, name: "Vĩnh Phúc", full_name: "Tỉnh Vĩnh Phúc" },
        { code: 30, name: "Bắc Ninh", full_name: "Tỉnh Bắc Ninh" },
        { code: 31, name: "Hải Dương", full_name: "Tỉnh Hải Dương" },
        { code: 35, name: "Hưng Yên", full_name: "Tỉnh Hưng Yên" },
        { code: 36, name: "Thái Bình", full_name: "Tỉnh Th��i Bình" },
        { code: 37, name: "Hà Nam", full_name: "Tỉnh Hà Nam" },
        { code: 38, name: "Nam Định", full_name: "Tỉnh Nam Định" },
        { code: 40, name: "Ninh Bình", full_name: "Tỉnh Ninh Bình" },
        { code: 42, name: "Thanh Hóa", full_name: "Tỉnh Thanh Hóa" },
        { code: 44, name: "Nghệ An", full_name: "Tỉnh Nghệ An" },
        { code: 45, name: "Hà Tĩnh", full_name: "Tỉnh Hà Tĩnh" },
        { code: 46, name: "Quảng Bình", full_name: "Tỉnh Quảng Bình" },
        { code: 49, name: "Quảng Trị", full_name: "Tỉnh Quảng Trị" },
        { code: 51, name: "Thừa Thiên Huế", full_name: "Tỉnh Thừa Thiên Huế" },
        { code: 52, name: "Quảng Ngãi", full_name: "Tỉnh Quảng Ngãi" },
        { code: 54, name: "Bình Định", full_name: "Tỉnh Bình Định" },
        { code: 56, name: "Phú Yên", full_name: "Tỉnh Phú Yên" },
        { code: 58, name: "Ninh Thuận", full_name: "Tỉnh Ninh Thu��n" },
        { code: 60, name: "Bình Thuận", full_name: "Tỉnh Bình Thuận" },
        { code: 62, name: "Kon Tum", full_name: "Tỉnh Kon Tum" },
        { code: 64, name: "Gia Lai", full_name: "Tỉnh Gia Lai" },
        { code: 66, name: "Đắk Lắk", full_name: "Tỉnh Đắk Lắk" },
        { code: 67, name: "��ắk Nông", full_name: "Tỉnh Đắk Nông" },
        { code: 68, name: "Lâm Đồng", full_name: "Tỉnh Lâm Đồng" },
        { code: 70, name: "Bình Phước", full_name: "Tỉnh Bình Phước" },
        { code: 72, name: "Tây Ninh", full_name: "Tỉnh Tây Ninh" },
        { code: 74, name: "Bình Dương", full_name: "Tỉnh Bình Dương" },
        { code: 75, name: "Đồng Nai", full_name: "Tỉnh Đồng Nai" },
        {
          code: 77,
          name: "Bà Rịa - Vũng Tàu",
          full_name: "Tỉnh Bà Rịa - Vũng Tàu",
        },
        { code: 80, name: "Long An", full_name: "Tỉnh Long An" },
        { code: 82, name: "Tiền Giang", full_name: "Tỉnh Tiền Giang" },
        { code: 83, name: "Bến Tre", full_name: "Tỉnh Bến Tre" },
        { code: 84, name: "Trà Vinh", full_name: "Tỉnh Trà Vinh" },
        { code: 86, name: "Vĩnh Long", full_name: "Tỉnh Vĩnh Long" },
        { code: 87, name: "Đồng Tháp", full_name: "Tỉnh Đồng Tháp" },
        { code: 89, name: "An Giang", full_name: "Tỉnh An Giang" },
        { code: 91, name: "Kiên Giang", full_name: "Tỉnh Kiên Giang" },
        { code: 93, name: "Hậu Giang", full_name: "Tỉnh Hậu Giang" },
        { code: 94, name: "Sóc Trăng", full_name: "Tỉnh Sóc Trăng" },
        { code: 95, name: "Bạc Liêu", full_name: "Tỉnh Bạc Liêu" },
        { code: 96, name: "Cà Mau", full_name: "Tỉnh Cà Mau" },
      ]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadDistricts = async (provinceCode: number) => {
    try {
      setLoadingLocations(true);

      // Call Vietnam API to get real districts
      const response = await fetch(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`,
      );

      if (response.ok) {
        const provinceData = await response.json();
        if (provinceData && provinceData.districts) {
          setDistricts(
            provinceData.districts.map((d: any) => ({
              code: d.code,
              name: d.name,
              full_name: d.name,
              province_code: provinceCode,
            })),
          );
          return;
        }
      }

      // Fallback data if API fails
      const districtsMapping: { [key: number]: any[] } = {
        1: [
          // Hà Nội
          {
            code: 1,
            name: "Ba Đình",
            full_name: "Quận Ba Đình",
            province_code: 1,
          },
          {
            code: 2,
            name: "Hoàn Kiếm",
            full_name: "Quận Hoàn Kiếm",
            province_code: 1,
          },
          {
            code: 3,
            name: "Tây Hồ",
            full_name: "Quận Tây Hồ",
            province_code: 1,
          },
          {
            code: 4,
            name: "Long Biên",
            full_name: "Quận Long Biên",
            province_code: 1,
          },
          {
            code: 5,
            name: "Cầu Giấy",
            full_name: "Quận Cầu Giấy",
            province_code: 1,
          },
        ],
        20: [
          // Quảng Nam
          {
            code: 200,
            name: "Tam Kỳ",
            full_name: "Thành phố Tam Kỳ",
            province_code: 20,
          },
          {
            code: 201,
            name: "Hội An",
            full_name: "Thành phố Hội An",
            province_code: 20,
          },
          {
            code: 202,
            name: "Duy Xuyên",
            full_name: "Huyện Duy Xuyên",
            province_code: 20,
          },
          {
            code: 203,
            name: "Đại Lộc",
            full_name: "Huyện Đại Lộc",
            province_code: 20,
          },
        ],
        26: [
          // Khánh Hòa
          {
            code: 260,
            name: "Nha Trang",
            full_name: "Thành phố Nha Trang",
            province_code: 26,
          },
          {
            code: 261,
            name: "Cam Ranh",
            full_name: "Thành phố Cam Ranh",
            province_code: 26,
          },
          {
            code: 262,
            name: "Cam Lâm",
            full_name: "Huyện Cam Lâm",
            province_code: 26,
          },
          {
            code: 263,
            name: "Vạn Ninh",
            full_name: "Huyện Vạn Ninh",
            province_code: 26,
          },
        ],
        79: [
          // TP Hồ Chí Minh
          { code: 760, name: "Quận 1", full_name: "Quận 1", province_code: 79 },
          { code: 761, name: "Quận 2", full_name: "Quận 2", province_code: 79 },
          { code: 762, name: "Quận 3", full_name: "Quận 3", province_code: 79 },
          { code: 763, name: "Quận 4", full_name: "Quận 4", province_code: 79 },
        ],
        11: [
          // Điện Biên
          {
            code: 110,
            name: "Điện Biên Phủ",
            full_name: "Thành phố Điện Biên Phủ",
            province_code: 11,
          },
          {
            code: 111,
            name: "Mường Lay",
            full_name: "Thị xã Mường Lay",
            province_code: 11,
          },
          {
            code: 112,
            name: "Mường Nhé",
            full_name: "Huyện Mường Nhé",
            province_code: 11,
          },
          {
            code: 113,
            name: "Mường Chà",
            full_name: "Huyện Mường Chà",
            province_code: 11,
          },
          {
            code: 114,
            name: "Tủa Chùa",
            full_name: "Huyện T���a Chùa",
            province_code: 11,
          },
          {
            code: 115,
            name: "Tuần Giáo",
            full_name: "Huyện Tuần Giáo",
            province_code: 11,
          },
          {
            code: 116,
            name: "Điện Biên",
            full_name: "Huyện Điện Biên",
            province_code: 11,
          },
          {
            code: 117,
            name: "Điện Biên Đông",
            full_name: "Huyện Điện Biên Đông",
            province_code: 11,
          },
          {
            code: 118,
            name: "Mường Ảng",
            full_name: "Huyện Mường Ảng",
            province_code: 11,
          },
          {
            code: 119,
            name: "Nậm Pồ",
            full_name: "Huyện Nậm Pồ",
            province_code: 11,
          },
        ],
        48: [
          // Đà Nẵng
          {
            code: 490,
            name: "Hải Châu",
            full_name: "Quận Hải Châu",
            province_code: 48,
          },
          {
            code: 491,
            name: "Cam Lệ",
            full_name: "Quận Cam Lệ",
            province_code: 48,
          },
          {
            code: 492,
            name: "Thanh Khê",
            full_name: "Quận Thanh Khê",
            province_code: 48,
          },
          {
            code: 493,
            name: "Liên Chiểu",
            full_name: "Quận Liên Chiểu",
            province_code: 48,
          },
          {
            code: 494,
            name: "Ngũ Hành Sơn",
            full_name: "Quận Ngũ Hành Sơn",
            province_code: 48,
          },
          {
            code: 495,
            name: "Sơn Trà",
            full_name: "Quận Sơn Trà",
            province_code: 48,
          },
          {
            code: 496,
            name: "Hoà Vang",
            full_name: "Huyện Hoà Vang",
            province_code: 48,
          },
        ],
        92: [
          // Cần Thơ
          {
            code: 916,
            name: "Ninh Kiều",
            full_name: "Quận Ninh Kiều",
            province_code: 92,
          },
          {
            code: 917,
            name: "Ô Môn",
            full_name: "Quận Ô Môn",
            province_code: 92,
          },
          {
            code: 918,
            name: "Bình Thuỷ",
            full_name: "Quận Bình Thuỷ",
            province_code: 92,
          },
          {
            code: 919,
            name: "Cái Răng",
            full_name: "Quận Cái Răng",
            province_code: 92,
          },
          {
            code: 920,
            name: "Thốt Nốt",
            full_name: "Quận Thốt Nốt",
            province_code: 92,
          },
          {
            code: 921,
            name: "Vĩnh Thạnh",
            full_name: "Huyện Vĩnh Thạnh",
            province_code: 92,
          },
          {
            code: 922,
            name: "Cờ Đỏ",
            full_name: "Huyện Cờ Đỏ",
            province_code: 92,
          },
          {
            code: 923,
            name: "Phong Điền",
            full_name: "Huyện Phong Điền",
            province_code: 92,
          },
          {
            code: 924,
            name: "Thới Lai",
            full_name: "Huyện Thới Lai",
            province_code: 92,
          },
        ],
      };

      setDistricts(
        districtsMapping[provinceCode] || [
          {
            code: provinceCode * 1000 + 1,
            name: "Huyện 1",
            full_name: "Huyện 1",
            province_code: provinceCode,
          },
          {
            code: provinceCode * 1000 + 2,
            name: "Huyện 2",
            full_name: "Huyện 2",
            province_code: provinceCode,
          },
          {
            code: provinceCode * 1000 + 3,
            name: "Huyện 3",
            full_name: "Huyện 3",
            province_code: provinceCode,
          },
        ],
      );

      // Skip API call for now
      if (false) {
        console.error("Failed to load districts:", data.message);
        // Provide fallback districts for major provinces
        const fallbackDistricts = {
          1: [
            // Hà Nội
            {
              code: 1,
              name: "Ba Đình",
              full_name: "Quận Ba Đình",
              province_code: 1,
            },
            {
              code: 2,
              name: "Hoàn Kiếm",
              full_name: "Quận Hoàn Kiếm",
              province_code: 1,
            },
            {
              code: 3,
              name: "Tây Hồ",
              full_name: "Quận Tây Hồ",
              province_code: 1,
            },
            {
              code: 4,
              name: "Long Biên",
              full_name: "Quận Long Bi��n",
              province_code: 1,
            },
            {
              code: 5,
              name: "Cầu Giấy",
              full_name: "Quận Cầu Giấy",
              province_code: 1,
            },
            {
              code: 6,
              name: "Đống Đa",
              full_name: "Quận Đống Đa",
              province_code: 1,
            },
            {
              code: 7,
              name: "Hai Bà Trưng",
              full_name: "Quận Hai Bà Trưng",
              province_code: 1,
            },
            {
              code: 8,
              name: "Hoàng Mai",
              full_name: "Quận Hoàng Mai",
              province_code: 1,
            },
            {
              code: 9,
              name: "Thanh Xuân",
              full_name: "Quận Thanh Xuân",
              province_code: 1,
            },
            {
              code: 19,
              name: "Nam Từ Liêm",
              full_name: "Quận Nam Từ Liêm",
              province_code: 1,
            },
            {
              code: 250,
              name: "Bắc Từ Liêm",
              full_name: "Quận Bắc Từ Liêm",
              province_code: 1,
            },
          ],
          79: [
            // TP Hồ Chí Minh
            {
              code: 760,
              name: "Quận 1",
              full_name: "Quận 1",
              province_code: 79,
            },
            {
              code: 761,
              name: "Quận 2",
              full_name: "Quận 2",
              province_code: 79,
            },
            {
              code: 762,
              name: "Quận 3",
              full_name: "Quận 3",
              province_code: 79,
            },
            {
              code: 763,
              name: "Quận 4",
              full_name: "Quận 4",
              province_code: 79,
            },
            {
              code: 764,
              name: "Quận 5",
              full_name: "Quận 5",
              province_code: 79,
            },
            {
              code: 765,
              name: "Quận 6",
              full_name: "Quận 6",
              province_code: 79,
            },
            {
              code: 766,
              name: "Quận 7",
              full_name: "Quận 7",
              province_code: 79,
            },
            {
              code: 772,
              name: "Quận Bình Thạnh",
              full_name: "Quận Bình Thạnh",
              province_code: 79,
            },
            {
              code: 773,
              name: "Quận Gò Vấp",
              full_name: "Quận Gò V��p",
              province_code: 79,
            },
            {
              code: 774,
              name: "Quận Phú Nhuận",
              full_name: "Quận Phú Nhuận",
              province_code: 79,
            },
            {
              code: 775,
              name: "Quận Tân Bình",
              full_name: "Quận Tân Bình",
              province_code: 79,
            },
            {
              code: 776,
              name: "Quận Tân Phú",
              full_name: "Quận Tân Phú",
              province_code: 79,
            },
          ],
          48: [
            // Đà Nẵng
            {
              code: 490,
              name: "Hải Châu",
              full_name: "Quận H��i Châu",
              province_code: 48,
            },
            {
              code: 491,
              name: "Cam Lệ",
              full_name: "Quận Cam Lệ",
              province_code: 48,
            },
            {
              code: 492,
              name: "Thanh Khê",
              full_name: "Quận Thanh Khê",
              province_code: 48,
            },
            {
              code: 493,
              name: "Liên Chiểu",
              full_name: "Quận Liên Chiểu",
              province_code: 48,
            },
            {
              code: 494,
              name: "Ngũ Hành Sơn",
              full_name: "Qu���n Ngũ Hành Sơn",
              province_code: 48,
            },
            {
              code: 495,
              name: "Sơn Trà",
              full_name: "Quận Sơn Trà",
              province_code: 48,
            },
          ],
          92: [
            // Cần Thơ
            {
              code: 916,
              name: "Ninh Kiều",
              full_name: "Quận Ninh Kiều",
              province_code: 92,
            },
            {
              code: 917,
              name: "Ô Môn",
              full_name: "Quận Ô Môn",
              province_code: 92,
            },
            {
              code: 918,
              name: "Bình Thuỷ",
              full_name: "Quận Bình Thuỷ",
              province_code: 92,
            },
            {
              code: 919,
              name: "Cái Răng",
              full_name: "Quận Cái Răng",
              province_code: 92,
            },
            {
              code: 923,
              name: "Thốt Nốt",
              full_name: "Quận Thốt Nốt",
              province_code: 92,
            },
          ],
          20: [
            // Quảng Nam
            {
              code: 200,
              name: "Tam Kỳ",
              full_name: "Thành phố Tam Kỳ",
              province_code: 20,
            },
            {
              code: 201,
              name: "Hội An",
              full_name: "Thành phố Hội An",
              province_code: 20,
            },
            {
              code: 202,
              name: "Duy Xuyên",
              full_name: "Huyện Duy Xuyên",
              province_code: 20,
            },
            {
              code: 203,
              name: "Đại Lộc",
              full_name: "Huyện Đại Lộc",
              province_code: 20,
            },
            {
              code: 204,
              name: "Điện Bàn",
              full_name: "Thị xã Điện Bàn",
              province_code: 20,
            },
            {
              code: 205,
              name: "Thăng Bình",
              full_name: "Huyện Thăng Bình",
              province_code: 20,
            },
            {
              code: 206,
              name: "Tiên Phước",
              full_name: "Huyện Tiên Phước",
              province_code: 20,
            },
          ],
          26: [
            // Khánh Hòa
            {
              code: 260,
              name: "Nha Trang",
              full_name: "Thành phố Nha Trang",
              province_code: 26,
            },
            {
              code: 261,
              name: "Cam Ranh",
              full_name: "Thành phố Cam Ranh",
              province_code: 26,
            },
            {
              code: 262,
              name: "Cam Lâm",
              full_name: "Huyện Cam Lâm",
              province_code: 26,
            },
            {
              code: 263,
              name: "Vạn Ninh",
              full_name: "Huyện Vạn Ninh",
              province_code: 26,
            },
            {
              code: 264,
              name: "Ninh Hòa",
              full_name: "Thị xã Ninh Hòa",
              province_code: 26,
            },
            {
              code: 265,
              name: "Khánh Vĩnh",
              full_name: "Huyện Khánh Vĩnh",
              province_code: 26,
            },
            {
              code: 266,
              name: "Diên Khánh",
              full_name: "Huyện Diên Khánh",
              province_code: 26,
            },
          ],
        };
        setDistricts(
          fallbackDistricts[provinceCode] || [
            // Generic fallback for any province
            {
              code: provinceCode * 1000 + 1,
              name: "Huyện/Quận 1",
              full_name: "Huyện/Quận 1",
              province_code: provinceCode,
            },
            {
              code: provinceCode * 1000 + 2,
              name: "Huyện/Quận 2",
              full_name: "Huyện/Quận 2",
              province_code: provinceCode,
            },
            {
              code: provinceCode * 1000 + 3,
              name: "Huyện/Quận 3",
              full_name: "Huyện/Quận 3",
              province_code: provinceCode,
            },
          ],
        );
      }
    } catch (error: any) {
      console.error("Failed to load districts:", error);
      // Provide fallback districts when API fails
      setDistricts([
        {
          code: provinceCode * 1000 + 1,
          name: "Huyện/Quận 1",
          full_name: "Huyện/Quận 1",
          province_code: provinceCode,
        },
        {
          code: provinceCode * 1000 + 2,
          name: "Huyện/Quận 2",
          full_name: "Huyện/Quận 2",
          province_code: provinceCode,
        },
        {
          code: provinceCode * 1000 + 3,
          name: "Huyện/Quận 3",
          full_name: "Huyện/Quận 3",
          province_code: provinceCode,
        },
        {
          code: provinceCode * 1000 + 4,
          name: "Huyện/Quận 4",
          full_name: "Huyện/Quận 4",
          province_code: provinceCode,
        },
        {
          code: provinceCode * 1000 + 5,
          name: "Huyện/Quận 5",
          full_name: "Huyện/Quận 5",
          province_code: provinceCode,
        },
      ]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadWards = async (districtCode: number) => {
    try {
      setLoadingLocations(true);

      // Call Vietnam API to get real wards
      const response = await fetch(
        `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`,
      );

      if (response.ok) {
        const districtData = await response.json();
        if (districtData && districtData.wards) {
          setWards(
            districtData.wards.map((w: any) => ({
              code: w.code,
              name: w.name,
              full_name: w.name,
              district_code: districtCode,
            })),
          );
          return;
        }
      }

      // Fallback data if API fails
      const wardsMapping: { [key: number]: any[] } = {
        // Điện Biên Phủ (Điện Biên)
        110: [
          {
            code: 3556,
            name: "Him Lam",
            full_name: "Phường Him Lam",
            district_code: 110,
          },
          {
            code: 3559,
            name: "Noong Bua",
            full_name: "Phường Noong Bua",
            district_code: 110,
          },
          {
            code: 3562,
            name: "Tân Thanh",
            full_name: "Phường Tân Thanh",
            district_code: 110,
          },
          {
            code: 3565,
            name: "Thanh Bình",
            full_name: "Phường Thanh Bình",
            district_code: 110,
          },
          {
            code: 3568,
            name: "Nam Thanh",
            full_name: "Ph��ờng Nam Thanh",
            district_code: 110,
          },
          {
            code: 3571,
            name: "Thanh Trường",
            full_name: "Phường Thanh Trường",
            district_code: 110,
          },
        ],
        // Ba Đình (Hà Nội)
        1: [
          {
            code: 1,
            name: "Phúc Xá",
            full_name: "Phường Phúc Xá",
            district_code: 1,
          },
          {
            code: 4,
            name: "Trúc Bạch",
            full_name: "Phường Trúc Bạch",
            district_code: 1,
          },
          {
            code: 6,
            name: "Vĩnh Phúc",
            full_name: "Phường Vĩnh Phúc",
            district_code: 1,
          },
          {
            code: 7,
            name: "Cống Vị",
            full_name: "Phường Cống Vị",
            district_code: 1,
          },
          {
            code: 8,
            name: "Liễu Giai",
            full_name: "Phường Liễu Giai",
            district_code: 1,
          },
          {
            code: 10,
            name: "Nguyễn Trung Trực",
            full_name: "Phường Nguyễn Trung Trực",
            district_code: 1,
          },
        ],
        // Quận 1 (TP.HCM)
        760: [
          {
            code: 26734,
            name: "Tân Định",
            full_name: "Phường Tân Định",
            district_code: 760,
          },
          {
            code: 26737,
            name: "Đa Kao",
            full_name: "Phường Đa Kao",
            district_code: 760,
          },
          {
            code: 26740,
            name: "Bến Nghé",
            full_name: "Phường Bến Nghé",
            district_code: 760,
          },
          {
            code: 26743,
            name: "Bến Thành",
            full_name: "Phường Bến Thành",
            district_code: 760,
          },
          {
            code: 26746,
            name: "Nguyễn Thái Bình",
            full_name: "Phường Nguyễn Thái Bình",
            district_code: 760,
          },
          {
            code: 26749,
            name: "Ph���m Ngũ Lão",
            full_name: "Phường Phạm Ngũ Lão",
            district_code: 760,
          },
        ],
        // Tam Kỳ (Quảng Nam)
        200: [
          {
            code: 6859,
            name: "Tân Thạnh",
            full_name: "Phường Tân Thạnh",
            district_code: 200,
          },
          {
            code: 6862,
            name: "Phước Hòa",
            full_name: "Phường Phước Hòa",
            district_code: 200,
          },
          {
            code: 6865,
            name: "An Mỹ",
            full_name: "Phường An Mỹ",
            district_code: 200,
          },
          {
            code: 6868,
            name: "Hòa Hương",
            full_name: "Phường Hòa Hương",
            district_code: 200,
          },
          {
            code: 6871,
            name: "An Xuân",
            full_name: "Phường An Xuân",
            district_code: 200,
          },
          {
            code: 6874,
            name: "An Sơn",
            full_name: "Phường An Sơn",
            district_code: 200,
          },
        ],
        // Nha Trang (Khánh Hòa)
        260: [
          {
            code: 9304,
            name: "Vĩnh Hải",
            full_name: "Phường Vĩnh Hải",
            district_code: 260,
          },
          {
            code: 9307,
            name: "Vĩnh Hòa",
            full_name: "Phường Vĩnh Hòa",
            district_code: 260,
          },
          {
            code: 9310,
            name: "Vĩnh Phước",
            full_name: "Phường Vĩnh Phư��c",
            district_code: 260,
          },
          {
            code: 9313,
            name: "Ngọc Hiệp",
            full_name: "Phường Ngọc Hiệp",
            district_code: 260,
          },
          {
            code: 9316,
            name: "Vĩnh Thọ",
            full_name: "Phường Vĩnh Thọ",
            district_code: 260,
          },
          {
            code: 9319,
            name: "Xương Huân",
            full_name: "Phường Xương Huân",
            district_code: 260,
          },
        ],
      };

      setWards(
        wardsMapping[districtCode] || [
          {
            code: 1,
            name: "Phường 1",
            full_name: "Phường 1",
            district_code: districtCode,
          },
          {
            code: 2,
            name: "Phường 2",
            full_name: "Phường 2",
            district_code: districtCode,
          },
          {
            code: 3,
            name: "Phường 3",
            full_name: "Phư��ng 3",
            district_code: districtCode,
          },
          {
            code: 4,
            name: "Phường 4",
            full_name: "Phường 4",
            district_code: districtCode,
          },
          {
            code: 5,
            name: "Phường 5",
            full_name: "Phường 5",
            district_code: districtCode,
          },
        ],
      );
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
        toast.error("Phiên đăng nhập đã h���t hạn");
        return;
      }

      // Validate required fields
      if (!formData.full_name.trim()) {
        toast.error("Vui lòng nhập họ và tên");
        return;
      }

      // Update profile info and address data in single request
      const updateData = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        // Add address data
        province_name: addressData.province_name || "",
        district_name: addressData.district_name || "",
        ward_name: addressData.ward_name || "",
        address: formData.address.trim() || "",
      };

      console.log("Updating profile with data:", updateData);

      // Update profile (now includes address data)
      const response = await fetch(`${Domain}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Profile update response:", data);

      if (data.success) {
        setProfile(data.data);

        // Update local form data with returned data
        setFormData({
          full_name: data.data.full_name || "",
          phone: data.data.phone || "",
          address: data.data.address || "",
        });

        // Update address data with returned data
        setAddressData({
          province_name: data.data.province_name || "",
          district_name: data.data.district_name || "",
          ward_name: data.data.ward_name || "",
        });

        toast.success("Cập nhật thông tin và địa chỉ thành công");

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
        toast.error("L��i hệ thống. Vui lòng tải lại trang và thử lại");
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
        toast.success("Đ��i mật khẩu thành công");
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

  // Show loading screen while authentication is in progress
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xác thực...</p>
        </div>
      </div>
    );
  }

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
                <TabsTrigger value="security">Bảo mật</TabsTrigger>
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
                        <Label htmlFor="phone">Số điện thoại</Label>
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
                            Tỉnh/Th��nh phố
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
                        placeholder="Số nhà, tên đường..."
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
                              <Label htmlFor="new_password">
                                Mật kh���u mới
                              </Label>
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
                        Đăng xuất khỏi t��t cả thiết bị
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
