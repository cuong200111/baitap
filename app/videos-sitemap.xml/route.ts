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

async function getVideos() {
  try {
    // Get products with videos or promotional videos
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/products`);
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data
        .filter((product: any) => product.videos && product.videos.length > 0)
        .map((product: any) => ({
          url: `/products/${product.id}`,
          videos: product.videos,
          title: product.name,
          description: product.description?.substring(0, 200),
          thumbnail: product.thumbnail || product.image,
          lastmod: product.updated_at || product.created_at
        }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching product videos:', error);
    return [];
  }
}

async function generateVideosSitemap() {
  const seoSettings = await getSeoSettings();
  const baseUrl = seoSettings?.general?.site_url || 'https://hacom.vn';
  const maxUrls = seoSettings?.technical?.sitemap_max_urls || 50000;
  
  // Check if videos sitemap is enabled
  if (!seoSettings?.technical?.sitemap_include_videos) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <!-- Videos sitemap is disabled in SEO settings -->
</urlset>`;
  }
  
  const videos = await getVideos();
  const limitedVideos = videos.slice(0, maxUrls);
  
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

  // Add product videos
  limitedVideos.forEach((item: any) => {
    if (item.videos && item.videos.length > 0) {
      sitemapXml += `
  <url>
    <loc>${baseUrl}${item.url}</loc>
    <lastmod>${new Date(item.lastmod).toISOString()}</lastmod>`;

      // Add each video for this product
      item.videos.forEach((video: any) => {
        const videoUrl = video.url?.startsWith('http') ? video.url : `${baseUrl}${video.url}`;
        const thumbnailUrl = video.thumbnail?.startsWith('http') ? video.thumbnail : `${baseUrl}${video.thumbnail || item.thumbnail}`;
        
        sitemapXml += `
    <video:video>
      <video:thumbnail_loc>${thumbnailUrl}</video:thumbnail_loc>
      <video:title>${video.title || item.title}</video:title>
      <video:description>${video.description || item.description}</video:description>
      <video:content_loc>${videoUrl}</video:content_loc>`;
        
        // Add optional video properties
        if (video.duration) {
          sitemapXml += `
      <video:duration>${video.duration}</video:duration>`;
        }
        
        if (video.rating) {
          sitemapXml += `
      <video:rating>${video.rating}</video:rating>`;
        }
        
        if (video.view_count) {
          sitemapXml += `
      <video:view_count>${video.view_count}</video:view_count>`;
        }
        
        if (video.publication_date) {
          sitemapXml += `
      <video:publication_date>${new Date(video.publication_date).toISOString()}</video:publication_date>`;
        }
        
        // Add family friendly tag
        sitemapXml += `
      <video:family_friendly>yes</video:family_friendly>`;
        
        // Add live status
        if (video.live !== undefined) {
          sitemapXml += `
      <video:live>${video.live ? 'yes' : 'no'}</video:live>`;
        }
        
        sitemapXml += `
    </video:video>`;
      });

      sitemapXml += `
  </url>`;
    }
  });

  // Add promotional/static videos
  const staticVideos = [
    {
      url: '/',
      videos: [
        {
          url: '/videos/hacom-introduction.mp4',
          title: 'Giới thiệu HACOM - Hệ thống máy tính uy tín',
          description: 'Video giới thiệu về HACOM, hệ thống bán máy tính, laptop uy tín tại Việt Nam',
          thumbnail: '/images/video-thumbnails/intro.jpg',
          duration: 120,
          publication_date: '2024-01-01'
        }
      ]
    },
    {
      url: '/category/laptop-gaming',
      videos: [
        {
          url: '/videos/laptop-gaming-guide.mp4',
          title: 'Hướng dẫn chọn laptop gaming phù hợp',
          description: 'Video hướng dẫn chi tiết cách chọn laptop gaming phù hợp v���i nhu cầu và ngân sách',
          thumbnail: '/images/video-thumbnails/laptop-guide.jpg',
          duration: 300,
          publication_date: '2024-01-15'
        }
      ]
    }
  ];

  staticVideos.forEach((item) => {
    sitemapXml += `
  <url>
    <loc>${baseUrl}${item.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>`;

    item.videos.forEach((video) => {
      const videoUrl = video.url.startsWith('http') ? video.url : `${baseUrl}${video.url}`;
      const thumbnailUrl = video.thumbnail.startsWith('http') ? video.thumbnail : `${baseUrl}${video.thumbnail}`;
      
      sitemapXml += `
    <video:video>
      <video:thumbnail_loc>${thumbnailUrl}</video:thumbnail_loc>
      <video:title>${video.title}</video:title>
      <video:description>${video.description}</video:description>
      <video:content_loc>${videoUrl}</video:content_loc>
      <video:duration>${video.duration}</video:duration>
      <video:publication_date>${new Date(video.publication_date).toISOString()}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>`;
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
    const sitemapContent = await generateVideosSitemap();
    
    return new NextResponse(sitemapContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=7200, s-maxage=7200', // Cache for 2 hours
      },
    });
  } catch (error) {
    console.error('Error generating videos sitemap:', error);
    
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <!-- Error generating videos sitemap -->
</urlset>`;
    
    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}
