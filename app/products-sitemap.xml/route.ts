import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  try {
    // Fetch products from API
    const response = await fetch(`${apiUrl}/api/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache busting to ensure fresh data
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();
    
    const products = data.success && data.data 
      ? (Array.isArray(data.data) ? data.data : data.data.products || [])
      : [];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${products.map((product: any) => `  <url>
    <loc>${siteUrl}/products/${product.id}</loc>
    <lastmod>${product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300' // 5 minutes cache for products
      }
    });

  } catch (error) {
    console.error('Error generating products sitemap:', error);
    
    // Return empty sitemap on error
    const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

    return new NextResponse(emptySitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=60, s-maxage=60' // Short cache on error
      }
    });
  }
}
