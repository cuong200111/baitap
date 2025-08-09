import { NextResponse } from 'next/server';

async function getSeoSettings() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seo/settings`);
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return null;
  }
}

async function generateSitemapIndex() {
  const seoSettings = await getSeoSettings();
  const baseUrl = seoSettings?.general?.site_url || 'https://hacom.vn';
  const includeImages = seoSettings?.technical?.sitemap_include_images !== false;
  const includeVideos = seoSettings?.technical?.sitemap_include_videos !== false;
  
  const currentDate = new Date().toISOString();
  
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages sitemap -->
  <sitemap>
    <loc>${baseUrl}/main-sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  
  <!-- Products sitemap -->
  <sitemap>
    <loc>${baseUrl}/products-sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  
  <!-- Categories sitemap -->
  <sitemap>
    <loc>${baseUrl}/categories-sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`;

  // Add image sitemap if enabled
  if (includeImages) {
    sitemapXml += `
  <!-- Images sitemap -->
  <sitemap>
    <loc>${baseUrl}/images-sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`;
  }

  // Add video sitemap if enabled
  if (includeVideos) {
    sitemapXml += `
  <!-- Videos sitemap -->
  <sitemap>
    <loc>${baseUrl}/videos-sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`;
  }

  sitemapXml += `
</sitemapindex>`;

  return sitemapXml;
}

export async function GET() {
  try {
    // Log sitemap generation for analytics
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seo/analytics/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url_path: 'sitemap_generation',
          date: new Date().toISOString().split('T')[0],
          page_views: 1
        })
      });
    } catch (logError) {
      console.error('Error logging sitemap generation:', logError);
    }

    const sitemapContent = await generateSitemapIndex();
    
    return new NextResponse(sitemapContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    return new NextResponse('Error generating sitemap', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
