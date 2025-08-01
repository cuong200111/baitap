// Vietnam locations API utilities
const VN_API_BASE = "https://provinces.open-api.vn/api";

export interface Province {
  code: number;
  name: string;
  name_with_type?: string;
  full_name?: string;
}

export interface District {
  code: number;
  name: string;
  name_with_type?: string;
  full_name?: string;
  province_code: number;
}

export interface Ward {
  code: number;
  name: string;
  name_with_type?: string;
  full_name?: string;
  district_code: number;
}

export const fetchProvinces = async (): Promise<Province[]> => {
  try {
    const response = await fetch(`${VN_API_BASE}/p/`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const provinces = await response.json();
    return provinces.map((p: any) => ({
      code: p.code,
      name: p.name,
      full_name: p.name_with_type || p.name,
    }));
  } catch (error) {
    console.error("Failed to fetch provinces:", error);
    // Return fallback provinces
    return [
      { code: 1, name: "Hà Nội", full_name: "Thành phố Hà Nội" },
      { code: 79, name: "TP Hồ Chí Minh", full_name: "Thành phố Hồ Chí Minh" },
      { code: 48, name: "Đà Nẵng", full_name: "Thành phố Đà Nẵng" },
      { code: 92, name: "Cần Thơ", full_name: "Thành phố Cần Thơ" },
    ];
  }
};

export const fetchDistricts = async (
  provinceCode: number,
): Promise<District[]> => {
  try {
    const response = await fetch(`${VN_API_BASE}/p/${provinceCode}?depth=2`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const provinceData = await response.json();
    if (provinceData && provinceData.districts) {
      return provinceData.districts.map((d: any) => ({
        code: d.code,
        name: d.name,
        full_name: d.name_with_type || d.name,
        province_code: provinceCode,
      }));
    }
    throw new Error("No districts data");
  } catch (error) {
    console.error("Failed to fetch districts:", error);
    // Return fallback districts
    return [
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
    ];
  }
};

export const fetchWards = async (districtCode: number): Promise<Ward[]> => {
  try {
    const response = await fetch(`${VN_API_BASE}/d/${districtCode}?depth=2`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const districtData = await response.json();
    if (districtData && districtData.wards) {
      return districtData.wards.map((w: any) => ({
        code: w.code,
        name: w.name,
        full_name: w.name_with_type || w.name,
        district_code: districtCode,
      }));
    }
    throw new Error("No wards data");
  } catch (error) {
    console.error("Failed to fetch wards:", error);
    // Return fallback wards
    return [
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
        full_name: "Phường 3",
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
    ];
  }
};
