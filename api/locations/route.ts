import { NextRequest, NextResponse } from "next/server";

// Cache for storing location data
let locationsCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Vietnamese administrative divisions API
const VN_API_URL = "https://provinces.open-api.vn/api";

interface Province {
  code: number;
  name: string;
  name_en: string;
  full_name: string;
  full_name_en: string;
  code_name: string;
  administrative_unit_id: number;
  administrative_region_id: number;
}

interface District {
  code: number;
  name: string;
  name_en: string;
  full_name: string;
  full_name_en: string;
  code_name: string;
  province_code: number;
  administrative_unit_id: number;
}

interface Ward {
  code: number;
  name: string;
  name_en: string;
  full_name: string;
  full_name_en: string;
  code_name: string;
  district_code: number;
  administrative_unit_id: number;
}

const fetchWithRetry = async (url: string, retries = 2): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; HacomBot/1.0)",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

const loadLocationsData = async () => {
  try {
    console.log("Loading Vietnam locations data...");

    // Load provinces with districts and wards
    const provincesData = await fetchWithRetry(`${VN_API_URL}/p/`);

    const provinces: Province[] = provincesData || [];
    const allDistricts: District[] = [];
    const allWards: Ward[] = [];

    // Load districts and wards for each province
    for (const province of provinces) {
      try {
        const provinceDetail = await fetchWithRetry(
          `${VN_API_URL}/p/${province.code}?depth=3`,
        );

        if (provinceDetail.districts) {
          allDistricts.push(...provinceDetail.districts);

          for (const district of provinceDetail.districts) {
            if (district.wards) {
              allWards.push(...district.wards);
            }
          }
        }
      } catch (error) {
        console.error(
          `Failed to load data for province ${province.code}:`,
          error,
        );
        // Continue with other provinces
      }
    }

    return {
      provinces,
      districts: allDistricts,
      wards: allWards,
    };
  } catch (error) {
    console.error("Failed to load locations data:", error);

    // Return fallback data for major cities
    return {
      provinces: [
        {
          code: 1,
          name: "Hà Nội",
          full_name: "Thành phố Hà Nội",
          code_name: "ha_noi",
        },
        {
          code: 79,
          name: "TP Hồ Chí Minh",
          full_name: "Thành phố Hồ Chí Minh",
          code_name: "ho_chi_minh",
        },
        {
          code: 48,
          name: "Đà Nẵng",
          full_name: "Thành phố Đà Nẵng",
          code_name: "da_nang",
        },
        {
          code: 92,
          name: "Cần Thơ",
          full_name: "Thành phố Cần Thơ",
          code_name: "can_tho",
        },
      ],
      districts: [],
      wards: [],
    };
  }
};

const getLocationsData = async () => {
  const now = Date.now();

  // Return cached data if still valid
  if (locationsCache && now - cacheTimestamp < CACHE_DURATION) {
    return locationsCache;
  }

  // Load fresh data
  locationsCache = await loadLocationsData();
  cacheTimestamp = now;

  return locationsCache;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // provinces, districts, wards
    const provinceCode = searchParams.get("province_code");
    const districtCode = searchParams.get("district_code");

    const data = await getLocationsData();

    switch (type) {
      case "provinces":
        return NextResponse.json({
          success: true,
          data: data.provinces.map((p: Province) => ({
            code: p.code,
            name: p.name,
            full_name: p.full_name,
            code_name: p.code_name,
          })),
        });

      case "districts":
        if (!provinceCode) {
          return NextResponse.json(
            { success: false, message: "Province code is required" },
            { status: 400 },
          );
        }

        const districts = data.districts.filter(
          (d: District) => d.province_code === parseInt(provinceCode),
        );

        return NextResponse.json({
          success: true,
          data: districts.map((d: District) => ({
            code: d.code,
            name: d.name,
            full_name: d.full_name,
            code_name: d.code_name,
            province_code: d.province_code,
          })),
        });

      case "wards":
        if (!districtCode) {
          return NextResponse.json(
            { success: false, message: "District code is required" },
            { status: 400 },
          );
        }

        const wards = data.wards.filter(
          (w: Ward) => w.district_code === parseInt(districtCode),
        );

        return NextResponse.json({
          success: true,
          data: wards.map((w: Ward) => ({
            code: w.code,
            name: w.name,
            full_name: w.full_name,
            code_name: w.code_name,
            district_code: w.district_code,
          })),
        });

      default:
        // Return all data
        return NextResponse.json({
          success: true,
          data: {
            provinces: data.provinces.map((p: Province) => ({
              code: p.code,
              name: p.name,
              full_name: p.full_name,
              code_name: p.code_name,
            })),
            districts: data.districts.map((d: District) => ({
              code: d.code,
              name: d.name,
              full_name: d.full_name,
              code_name: d.code_name,
              province_code: d.province_code,
            })),
            wards: data.wards.map((w: Ward) => ({
              code: w.code,
              name: w.name,
              full_name: w.full_name,
              code_name: w.code_name,
              district_code: w.district_code,
            })),
          },
        });
    }
  } catch (error) {
    console.error("Locations API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch locations data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
