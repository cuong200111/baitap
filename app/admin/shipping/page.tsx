"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Warehouse,
  MapPin,
  Plus,
  Edit,
  Truck,
  Calculator,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/config";
import { API_DOMAIN } from "@/lib/api-helpers";

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

interface WarehouseType {
  id: number;
  name: string;
  address: string;
  province_id: number;
  province_name: string;
  district_id: number;
  district_name: string;
  ward_name?: string;
  is_default: boolean;
  is_active: boolean;
}

interface ShippingZone {
  id: number;
  name: string;
  warehouse_id: number;
  warehouse_name: string;
  province_ids: number[];
  district_ids: number[];
  is_active: boolean;
}

interface ShippingRate {
  id: number;
  zone_id: number;
  zone_name: string;
  warehouse_name: string;
  min_distance: number;
  max_distance?: number;
  base_rate: number;
  per_km_rate: number;
  min_order_amount: number;
  is_active: boolean;
}

export default function AdminShippingPage() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);

  // Form states
  const [warehouseForm, setWarehouseForm] = useState({
    name: "",
    address: "",
    province_id: "",
    district_id: "",
    ward_name: "",
    is_default: false,
  });

  const [zoneForm, setZoneForm] = useState({
    name: "",
    warehouse_id: "",
    province_ids: [] as number[],
    district_ids: [] as number[],
  });

  const [rateForm, setRateForm] = useState({
    zone_id: "",
    min_distance: "0",
    max_distance: "",
    base_rate: "",
    per_km_rate: "0",
    min_order_amount: "0",
  });

  useEffect(() => {
    loadData();
    loadProvinces();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [warehousesRes, zonesRes, ratesRes] = await Promise.all([
        fetch(`${API_DOMAIN}/api/admin/warehouses`),
        fetch(`${API_DOMAIN}/api/admin/shipping-zones`),
        fetch(`${API_DOMAIN}/api/admin/shipping-rates`),
      ]);

      const [warehousesData, zonesData, ratesData] = await Promise.all([
        warehousesRes.json(),
        zonesRes.json(),
        ratesRes.json(),
      ]);

      if (warehousesData.success) setWarehouses(warehousesData.data);
      if (zonesData.success) setZones(zonesData.data);
      if (ratesData.success) setRates(ratesData.data);
    } catch (error) {
      console.error("Failed to load shipping data:", error);
      toast.error("Không thể tải d�� liệu shipping");
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async () => {
    try {
      const response = await fetch(
        `${API_DOMAIN}/api/locations?type=provinces`,
      );
      const data = await response.json();
      if (data.success) {
        setProvinces(data.data);
      }
    } catch (error) {
      console.error("Failed to load provinces:", error);
    }
  };

  const loadDistricts = async (provinceCode: number) => {
    try {
      const response = await fetch(
        `/api/locations?type=districts&province_code=${provinceCode}`,
      );
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data);
      }
    } catch (error) {
      console.error("Failed to load districts:", error);
    }
  };

  const handleCreateWarehouse = async () => {
    try {
      const selectedProvince = provinces.find(
        (p) => p.code.toString() === warehouseForm.province_id,
      );
      const selectedDistrict = districts.find(
        (d) => d.code.toString() === warehouseForm.district_id,
      );

      if (!selectedProvince || !selectedDistrict) {
        toast.error("Vui lòng chọn tỉnh và huyện");
        return;
      }

      const response = await fetch(`${API_DOMAIN}/api/admin/warehouses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...warehouseForm,
          province_id: parseInt(warehouseForm.province_id),
          province_name: selectedProvince.name,
          district_id: parseInt(warehouseForm.district_id),
          district_name: selectedDistrict.name,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Tạo kho thành công");
        setIsWarehouseDialogOpen(false);
        setWarehouseForm({
          name: "",
          address: "",
          province_id: "",
          district_id: "",
          ward_name: "",
          is_default: false,
        });
        loadData();
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Create warehouse error:", error);
      toast.error("Có lỗi xảy ra khi tạo kho");
    }
  };

  const handleCreateZone = async () => {
    try {
      const response = await fetch(`${API_DOMAIN}/api/admin/shipping-zones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...zoneForm,
          warehouse_id: parseInt(zoneForm.warehouse_id),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Tạo khu vực thành công");
        setIsZoneDialogOpen(false);
        setZoneForm({
          name: "",
          warehouse_id: "",
          province_ids: [],
          district_ids: [],
        });
        loadData();
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Create zone error:", error);
      toast.error("Có lỗi xảy ra khi tạo khu vực");
    }
  };

  const handleCreateRate = async () => {
    try {
      const response = await fetch(`${API_DOMAIN}/api/admin/shipping-rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone_id: parseInt(rateForm.zone_id),
          min_distance: parseFloat(rateForm.min_distance) || 0,
          max_distance: rateForm.max_distance
            ? parseFloat(rateForm.max_distance)
            : null,
          base_rate: parseFloat(rateForm.base_rate),
          per_km_rate: parseFloat(rateForm.per_km_rate) || 0,
          min_order_amount: parseFloat(rateForm.min_order_amount) || 0,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Tạo mức phí thành công");
        setIsRateDialogOpen(false);
        setRateForm({
          zone_id: "",
          min_distance: "0",
          max_distance: "",
          base_rate: "",
          per_km_rate: "0",
          min_order_amount: "0",
        });
        loadData();
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Create rate error:", error);
      toast.error("Có lỗi xảy ra khi tạo mức phí");
    }
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
            Quản lý vận chuyển
          </h1>
          <p className="text-gray-600">
            Cấu hình kho hàng, khu vực và phí ship
          </p>
        </div>
      </div>

      <Tabs defaultValue="warehouses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="warehouses">Kho hàng</TabsTrigger>
          <TabsTrigger value="zones">Khu vực giao hàng</TabsTrigger>
          <TabsTrigger value="rates">Mức phí vận chuyển</TabsTrigger>
        </TabsList>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Kho hàng</h2>
            <Dialog
              open={isWarehouseDialogOpen}
              onOpenChange={setIsWarehouseDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm kho
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm kho hàng mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="warehouse-name">Tên kho *</Label>
                    <Input
                      id="warehouse-name"
                      value={warehouseForm.name}
                      onChange={(e) =>
                        setWarehouseForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Kho chính Hà Nội"
                    />
                  </div>
                  <div>
                    <Label htmlFor="warehouse-address">Địa chỉ *</Label>
                    <Input
                      id="warehouse-address"
                      value={warehouseForm.address}
                      onChange={(e) =>
                        setWarehouseForm((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="123 Đường ABC"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="warehouse-province">
                        Tỉnh/Thành phố *
                      </Label>
                      <Select
                        value={warehouseForm.province_id}
                        onValueChange={(value) => {
                          setWarehouseForm((prev) => ({
                            ...prev,
                            province_id: value,
                            district_id: "",
                          }));
                          loadDistricts(parseInt(value));
                        }}
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
                      <Label htmlFor="warehouse-district">Quận/Huyện *</Label>
                      <Select
                        value={warehouseForm.district_id}
                        onValueChange={(value) =>
                          setWarehouseForm((prev) => ({
                            ...prev,
                            district_id: value,
                          }))
                        }
                        disabled={!warehouseForm.province_id}
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
                  </div>
                  <div>
                    <Label htmlFor="warehouse-ward">Phường/Xã</Label>
                    <Input
                      id="warehouse-ward"
                      value={warehouseForm.ward_name}
                      onChange={(e) =>
                        setWarehouseForm((prev) => ({
                          ...prev,
                          ward_name: e.target.value,
                        }))
                      }
                      placeholder="Phường 1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="warehouse-default"
                      checked={warehouseForm.is_default}
                      onCheckedChange={(checked) =>
                        setWarehouseForm((prev) => ({
                          ...prev,
                          is_default: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="warehouse-default">
                      Đặt làm kho mặc định
                    </Label>
                  </div>
                  <Button onClick={handleCreateWarehouse} className="w-full">
                    Tạo kho hàng
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên kho</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>Vị trí</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4" />
                          {warehouse.name}
                          {warehouse.is_default && (
                            <Badge variant="default">Mặc định</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{warehouse.address}</TableCell>
                      <TableCell>
                        {warehouse.province_name}, {warehouse.district_name}
                        {warehouse.ward_name && `, ${warehouse.ward_name}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            warehouse.is_active ? "default" : "secondary"
                          }
                        >
                          {warehouse.is_active
                            ? "Hoạt động"
                            : "Không hoạt động"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Khu vực giao hàng</h2>
            <Dialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={warehouses.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm khu vực
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm khu vực giao hàng</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="zone-name">Tên khu vực *</Label>
                    <Input
                      id="zone-name"
                      value={zoneForm.name}
                      onChange={(e) =>
                        setZoneForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Khu vực nội thành Hà Nội"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zone-warehouse">Kho hàng *</Label>
                    <Select
                      value={zoneForm.warehouse_id}
                      onValueChange={(value) =>
                        setZoneForm((prev) => ({
                          ...prev,
                          warehouse_id: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn kho" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses
                          .filter((w) => w.is_active)
                          .map((warehouse) => (
                            <SelectItem
                              key={warehouse.id}
                              value={warehouse.id.toString()}
                            >
                              {warehouse.name} - {warehouse.province_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tỉnh/Thành phố áp dụng</Label>
                    <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                      {provinces.map((province) => (
                        <div
                          key={province.code}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`province-${province.code}`}
                            checked={zoneForm.province_ids.includes(
                              province.code,
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setZoneForm((prev) => ({
                                  ...prev,
                                  province_ids: [
                                    ...prev.province_ids,
                                    province.code,
                                  ],
                                }));
                              } else {
                                setZoneForm((prev) => ({
                                  ...prev,
                                  province_ids: prev.province_ids.filter(
                                    (id) => id !== province.code,
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`province-${province.code}`}
                            className="text-sm"
                          >
                            {province.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Để trống để áp dụng cho tất cả tỉnh
                    </p>
                  </div>
                  <Button onClick={handleCreateZone} className="w-full">
                    Tạo khu vực
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên khu vực</TableHead>
                    <TableHead>Kho hàng</TableHead>
                    <TableHead>Số tỉnh</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {zone.name}
                        </div>
                      </TableCell>
                      <TableCell>{zone.warehouse_name}</TableCell>
                      <TableCell>
                        {zone.province_ids.length > 0
                          ? `${zone.province_ids.length} tỉnh`
                          : "Tất cả"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={zone.is_active ? "default" : "secondary"}
                        >
                          {zone.is_active ? "Hoạt động" : "Không hoạt động"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Rates Tab */}
        <TabsContent value="rates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mức phí vận chuyển</h2>
            <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={zones.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm mức phí
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm mức phí vận chuyển</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rate-zone">Khu vực *</Label>
                    <Select
                      value={rateForm.zone_id}
                      onValueChange={(value) =>
                        setRateForm((prev) => ({ ...prev, zone_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khu vực" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones
                          .filter((z) => z.is_active)
                          .map((zone) => (
                            <SelectItem
                              key={zone.id}
                              value={zone.id.toString()}
                            >
                              {zone.name} ({zone.warehouse_name})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rate-min-distance">
                        Khoảng cách tối thiểu (km)
                      </Label>
                      <Input
                        id="rate-min-distance"
                        type="number"
                        value={rateForm.min_distance}
                        onChange={(e) =>
                          setRateForm((prev) => ({
                            ...prev,
                            min_distance: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rate-max-distance">
                        Khoảng cách tối đa (km)
                      </Label>
                      <Input
                        id="rate-max-distance"
                        type="number"
                        value={rateForm.max_distance}
                        onChange={(e) =>
                          setRateForm((prev) => ({
                            ...prev,
                            max_distance: e.target.value,
                          }))
                        }
                        placeholder="Để trống = không giới hạn"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rate-base">Phí cơ bản (VND) *</Label>
                    <Input
                      id="rate-base"
                      type="number"
                      value={rateForm.base_rate}
                      onChange={(e) =>
                        setRateForm((prev) => ({
                          ...prev,
                          base_rate: e.target.value,
                        }))
                      }
                      placeholder="20000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate-per-km">Phí mỗi km (VND)</Label>
                    <Input
                      id="rate-per-km"
                      type="number"
                      value={rateForm.per_km_rate}
                      onChange={(e) =>
                        setRateForm((prev) => ({
                          ...prev,
                          per_km_rate: e.target.value,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate-free-threshold">
                      Miễn phí từ (VND)
                    </Label>
                    <Input
                      id="rate-free-threshold"
                      type="number"
                      value={rateForm.min_order_amount}
                      onChange={(e) =>
                        setRateForm((prev) => ({
                          ...prev,
                          min_order_amount: e.target.value,
                        }))
                      }
                      placeholder="500000"
                    />
                  </div>
                  <Button onClick={handleCreateRate} className="w-full">
                    Tạo mức phí
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khu vực</TableHead>
                    <TableHead>Khoảng cách (km)</TableHead>
                    <TableHead>Phí cơ bản</TableHead>
                    <TableHead>Phí/km</TableHead>
                    <TableHead>Miễn phí từ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rate.zone_name}</div>
                          <div className="text-sm text-gray-500">
                            {rate.warehouse_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rate.min_distance} - {rate.max_distance || "∞"} km
                      </TableCell>
                      <TableCell>{formatPrice(rate.base_rate)}</TableCell>
                      <TableCell>{formatPrice(rate.per_km_rate)}</TableCell>
                      <TableCell>
                        {rate.min_order_amount > 0
                          ? formatPrice(rate.min_order_amount)
                          : "Không"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
