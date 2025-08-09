import { Domain } from "./config.js";

async function testSeoFunctionality() {
  console.log("🧪 Testing SEO functionality...");

  try {
    // Test 1: Check if SEO settings API is accessible
    console.log("\n1. Testing SEO settings API...");
    const settingsResponse = await fetch(`${Domain}/api/seo/settings`);

    if (settingsResponse.ok) {
      const settingsData = await settingsResponse.json();
      console.log("✅ SEO settings API working");
      console.log("📋 Settings loaded:", Object.keys(settingsData.data || {}));

      if (settingsData.data?.general?.site_name) {
        console.log("🏷��� Site name:", settingsData.data.general.site_name);
        console.log(
          "📄 Description length:",
          settingsData.data.general.site_description?.length || 0,
        );
      }
    } else {
      console.log("❌ SEO settings API failed:", settingsResponse.status);
      const errorText = await settingsResponse.text();
      console.log("Error:", errorText);
    }

    // Test 2: Check if SEO status API works
    console.log("\n2. Testing SEO status API...");
    const statusResponse = await fetch(`${Domain}/api/seo/status`);

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log("✅ SEO status API working");
      console.log("📊 Health score:", statusData.data?.healthScore || "N/A");
      console.log(
        "🔍 SEO settings count:",
        statusData.data?.checks?.seoSettings || 0,
      );
    } else {
      console.log("❌ SEO status API failed:", statusResponse.status);
    }

    // Test 3: Check main website metadata
    console.log("\n3. Testing website metadata...");
    const websiteResponse = await fetch(`${Domain.replace(":4000", ":3000")}/`);

    if (websiteResponse.ok) {
      const htmlContent = await websiteResponse.text();

      // Check for title
      const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
      if (titleMatch) {
        console.log("✅ Title tag found:", titleMatch[1]);
      } else {
        console.log("❌ Title tag not found");
      }

      // Check for meta description
      const descMatch = htmlContent.match(
        /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i,
      );
      if (descMatch) {
        console.log(
          "✅ Meta description found:",
          descMatch[1].substring(0, 50) + "...",
        );
      } else {
        console.log("❌ Meta description not found");
      }

      // Check for Open Graph tags
      const ogTitleMatch = htmlContent.match(
        /<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i,
      );
      if (ogTitleMatch) {
        console.log("✅ OG title found:", ogTitleMatch[1]);
      } else {
        console.log("❌ OG title not found");
      }

      // Check for structured data
      if (htmlContent.includes("application/ld+json")) {
        console.log("✅ Structured data found");
      } else {
        console.log("❌ Structured data not found");
      }
    } else {
      console.log("❌ Website not accessible:", websiteResponse.status);
    }

    // Test 4: Content analysis API
    console.log("\n4. Testing content analysis...");
    const analysisResponse = await fetch(`${Domain}/api/seo/content-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content:
          "Laptop gaming ASUS ROG với hiệu năng mạnh mẽ. Máy tính chuyên game với card đồ họa RTX 4060. Giá tốt nhất thị trường.",
        targetKeywords: ["laptop gaming", "ASUS ROG"],
        pageType: "product",
      }),
    });

    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log("✅ Content analysis API working");
      console.log("📊 Content score:", analysisData.data?.score || "N/A");
      console.log("📝 Word count:", analysisData.data?.contentLength || 0);
      console.log(
        "🔤 Keyword density:",
        analysisData.data?.keywordDensity || {},
      );
    } else {
      console.log("❌ Content analysis API failed:", analysisResponse.status);
    }

    console.log("\n🎉 SEO functionality test completed!");
  } catch (error) {
    console.error("💥 Test failed with error:", error);
  }
}

// Run test
testSeoFunctionality();
