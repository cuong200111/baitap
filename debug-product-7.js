// Quick test to debug product 7 og:image issue
const Domain = 'http://localhost:4000';

async function checkProduct7() {
  try {
    console.log('🔍 Checking Product 7 Data...');
    
    // Fetch product data
    const response = await fetch(`${Domain}/api/products/7`);
    const data = await response.json();
    
    if (data.success && data.data) {
      const product = data.data;
      
      console.log('📋 Product 7 Raw Data:', {
        id: product.id,
        name: product.name,
        image: product.image,
        images: product.images,
        hasMainImage: !!product.image,
        hasImagesArray: !!(product.images && Array.isArray(product.images)),
        imagesCount: product.images ? product.images.length : 0
      });
      
      // Calculate what og:image should be based on our logic
      let productImage = undefined;
      if (product.image) {
        productImage = product.image.startsWith("http")
          ? product.image
          : `${Domain}/uploads/${product.image}`;
      } else if (
        product.images &&
        Array.isArray(product.images) &&
        product.images.length > 0
      ) {
        const firstImage = product.images[0];
        productImage = firstImage.startsWith("http")
          ? firstImage
          : `${Domain}/uploads/${firstImage}`;
      }
      
      console.log('🖼️ Image Logic Result:', {
        selectedImage: productImage,
        source: product.image ? 'product.image' : 'product.images[0]',
        isCorrect: productImage && productImage.includes('/uploads/')
      });
      
      // Check actual page metadata
      console.log('🌐 Checking actual page metadata...');
      const pageResponse = await fetch('http://localhost:3000/products/7');
      const html = await pageResponse.text();
      
      const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
      const actualOgImage = ogImageMatch ? ogImageMatch[1] : null;
      
      console.log('📄 Page Metadata:', {
        actualOgImage,
        matchesLogic: actualOgImage === productImage,
        isBackendImage: actualOgImage && actualOgImage.includes('/uploads/')
      });
      
      // Comparison
      if (actualOgImage !== productImage) {
        console.error('❌ MISMATCH DETECTED!');
        console.error('Expected:', productImage);
        console.error('Actual:', actualOgImage);
      } else {
        console.log('✅ og:image matches expected logic');
      }
      
    } else {
      console.error('❌ Failed to fetch product data:', data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkProduct7();
