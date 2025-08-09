import { executeQuery } from './backend/database/connection.js';

async function debugProductDeletion() {
  try {
    console.log('🔍 Debugging product deletion issue...');
    
    // Check if product 4 exists
    const product = await executeQuery('SELECT * FROM products WHERE id = ?', [4]);
    console.log('📦 Product 4 exists:', product.length > 0);
    
    if (product.length > 0) {
      console.log('📋 Product details:', {
        id: product[0].id,
        name: product[0].name,
        created_at: product[0].created_at
      });
    }
    
    // Check for orders
    const orders = await executeQuery('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?', [4]);
    console.log('🛒 Orders with product 4:', orders[0].count);
    
    // Check validation - is "4" a valid integer?
    const id = "4";
    console.log('🔢 ID validation:');
    console.log('  - ID value:', id);
    console.log('  - Type:', typeof id);
    console.log('  - isInt:', Number.isInteger(parseInt(id)));
    console.log('  - parseInt:', parseInt(id));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugProductDeletion();
