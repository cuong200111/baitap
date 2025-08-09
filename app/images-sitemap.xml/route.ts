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

async function getImages() {
  try {
    // Get products with images
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/products`);
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data.map((product: any) => ({
        url: `/products/${product.id}`,
        images: product.images || [product.image].filter(Boolean),
        title: product.name,
        caption: product.description?.substring(0, 200),
        lastmod: product.updated_at || product.created_at
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching product images:', error);
    return [];
  }
}

async function generateImagesSitemap() {
  const seoSettings = await getSeoSettings();
  const baseUrl = seoSettings?.general?.site_url || 'https://hacom.vn';
  const maxUrls = seoSettings?.technical?.sitemap_max_urls || 50000;
  
  // Check if images sitemap is enabled
  if (!seoSettings?.technical?.sitemap_include_images) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Images sitemap is disabled in SEO settings -->
</urlset>`;
  }
  
  const images = await getImages();
  const limitedImages = images.slice(0, maxUrls);
  
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  // Add product images
  limitedImages.forEach((item: any) => {
    if (item.images && item.images.length > 0) {
      sitemapXml += `
  <url>
    <loc>${baseUrl}${item.url}</loc>
    <lastmod>${new Date(item.lastmod).toISOString()}</lastmod>`;

      // Add each image for this product
      item.images.forEach((image: string) => {
        const imageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
        sitemapXml += `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${item.title}</image:title>`;
        
        if (item.caption) {
          sitemapXml += `
      <image:caption>${item.caption}</image:caption>`;
        }
        
        sitemapXml += `
    </image:image>`;
      });

      sitemapXml += `
  </url>`;
    }
  });

  // Add static/promotional images
  const staticImages = [
    {
      url: '/',
      images: ['/images/hero-banner.jpg', '/images/featured-products.jpg'],
      title: 'HACOM Homepage',
      caption: 'Máy tính, laptop, gaming gear chính hãng'
    },
    {
      url: '/about',
      images: ['/images/about-us.jpg', '/images/store-front.jpg'],
      title: 'Về HACOM',
      caption: 'Hệ thống cửa hàng HACOM trên toàn quốc'
    }
  ];

  staticImages.forEach((item) => {
    sitemapXml += `
  <url>
    <loc>${baseUrl}${item.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>`;

    item.images.forEach((image) => {
      sitemapXml += `
    <image:image>
      <image:loc>${baseUrl}${image}</image:loc>
      <image:title>${item.title}</image:title>
      <image:caption>${item.caption}</image:caption>
    </image:image>`;
    });

    sitemapXml += `
  </url>`;
  });

  sitemapXml += `
</urlset>`;

  return sitemapXml;
}

export async function GET() {
  try {
    const sitemapContent = await generateImagesSitemap();
    
    return new NextResponse(sitemapContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=7200, s-maxage=7200', // Cache for 2 hours
      },
    });
  } catch (error) {
    console.error('Error generating images sitemap:', error);
    
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Error generating images sitemap -->
</urlset>`;
    
    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}
