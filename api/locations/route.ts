import { NextRequest, NextResponse } from "next/server";

// Proxy requests to the backend server
const BACKEND_URL = "http://localhost:4000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Forward the request to the backend
    const backendUrl = `${BACKEND_URL}/api/locations${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Locations API proxy error:", error);
    
    // Return fallback data for provinces if backend is not available
    if (request.url.includes("type=provinces")) {
      return NextResponse.json({
        success: true,
        data: [
          { code: 1, name: "Hà Nội", full_name: "Thành phố Hà Nội" },
          { code: 79, name: "TP Hồ Chí Minh", full_name: "Thành phố Hồ Chí Minh" },
          { code: 48, name: "Đà Nẵng", full_name: "Thành phố Đà Nẵng" },
          { code: 92, name: "Cần Thơ", full_name: "Thành phố Cần Thơ" },
          { code: 33, name: "Hải Phòng", full_name: "Thành phố Hải Phòng" },
          { code: 77, name: "Quảng Ninh", full_name: "Tỉnh Quảng Ninh" },
          { code: 26, name: "Khánh Hòa", full_name: "Tỉnh Khánh Hòa" },
          { code: 20, name: "Quảng Nam", full_name: "Tỉnh Quảng Nam" },
        ],
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch locations data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
