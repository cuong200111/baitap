import { executeQuery } from "../database/connection.js";

export const searchController = {
  // Autocomplete search
  async autocomplete(req, res) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.length < 2) {
        return res.json({
          success: true,
          data: [],
        });
      }

      const searchTerm = `%${q}%`;
      
      // Search in products
      const products = await executeQuery(
        `SELECT id, name, price, sale_price, images
         FROM products 
         WHERE status = 'active' AND (name LIKE ? OR description LIKE ?)
         ORDER BY name
         LIMIT ?`,
        [searchTerm, searchTerm, parseInt(limit)]
      );

      // Search in categories
      const categories = await executeQuery(
        `SELECT id, name, slug
         FROM categories 
         WHERE is_active = 1 AND name LIKE ?
         ORDER BY name
         LIMIT ?`,
        [searchTerm, parseInt(limit)]
      );

      const suggestions = [
        ...products.map(p => ({
          type: 'product',
          id: p.id,
          title: p.name,
          price: p.sale_price || p.price,
          image: p.images ? JSON.parse(p.images)[0] : null,
          url: `/products/${p.id}`,
        })),
        ...categories.map(c => ({
          type: 'category',
          id: c.id,
          title: c.name,
          url: `/category/${c.slug}`,
        })),
      ];

      res.json({
        success: true,
        data: suggestions.slice(0, parseInt(limit)),
      });
    } catch (error) {
      console.error('Autocomplete search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform autocomplete search',
      });
    }
  },

  // Full text search
  async search(req, res) {
    try {
      const { 
        q, 
        category_id, 
        min_price, 
        max_price, 
        sort = 'relevance',
        page = 1,
        limit = 20 
      } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
        });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const searchTerm = `%${q}%`;

      // Build dynamic query
      let whereConditions = ["products.status = 'active'"];
      let queryParams = [];

      // Add search condition
      whereConditions.push("(products.name LIKE ? OR products.description LIKE ?)");
      queryParams.push(searchTerm, searchTerm);

      // Add category filter
      if (category_id) {
        whereConditions.push("products.category_id = ?");
        queryParams.push(parseInt(category_id));
      }

      // Add price filters
      if (min_price) {
        whereConditions.push("(products.sale_price >= ? OR (products.sale_price IS NULL AND products.price >= ?))");
        queryParams.push(parseFloat(min_price), parseFloat(min_price));
      }

      if (max_price) {
        whereConditions.push("(products.sale_price <= ? OR (products.sale_price IS NULL AND products.price <= ?))");
        queryParams.push(parseFloat(max_price), parseFloat(max_price));
      }

      // Build ORDER BY clause
      let orderBy = "products.created_at DESC";
      switch (sort) {
        case 'price_asc':
          orderBy = "COALESCE(products.sale_price, products.price) ASC";
          break;
        case 'price_desc':
          orderBy = "COALESCE(products.sale_price, products.price) DESC";
          break;
        case 'name_asc':
          orderBy = "products.name ASC";
          break;
        case 'name_desc':
          orderBy = "products.name DESC";
          break;
        case 'newest':
          orderBy = "products.created_at DESC";
          break;
        case 'oldest':
          orderBy = "products.created_at ASC";
          break;
        default:
          orderBy = "products.featured DESC, products.created_at DESC";
      }

      const whereClause = whereConditions.join(" AND ");

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM products
        LEFT JOIN categories ON products.category_id = categories.id
        WHERE ${whereClause}
      `;
      
      const countResult = await executeQuery(countQuery, queryParams);
      const total = countResult[0]?.total || 0;

      // Get products
      const productsQuery = `
        SELECT 
          products.id,
          products.name,
          products.slug,
          products.description,
          products.price,
          products.sale_price,
          products.images,
          products.featured,
          products.stock_quantity,
          categories.name as category_name,
          categories.slug as category_slug,
          AVG(reviews.rating) as avg_rating,
          COUNT(reviews.id) as review_count
        FROM products
        LEFT JOIN categories ON products.category_id = categories.id
        LEFT JOIN reviews ON products.id = reviews.product_id
        WHERE ${whereClause}
        GROUP BY products.id
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(parseInt(limit), offset);
      const products = await executeQuery(productsQuery, queryParams);

      // Process results
      const processedProducts = products.map(product => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        avg_rating: parseFloat(product.avg_rating || 0),
        review_count: parseInt(product.review_count || 0),
      }));

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        has_next: parseInt(page) < Math.ceil(total / parseInt(limit)),
        has_prev: parseInt(page) > 1,
      };

      res.json({
        success: true,
        data: {
          products: processedProducts,
          pagination,
          query: q,
          filters: {
            category_id: category_id || null,
            min_price: min_price || null,
            max_price: max_price || null,
            sort,
          },
        },
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform search',
      });
    }
  },
};

export const locationsController = {
  // Get locations based on type parameter
  async getLocations(req, res) {
    try {
      const { type, province_code, district_code } = req.query;

      // Handle provinces request
      if (type === 'provinces') {
        const provinces = [
          { code: 1, name: "Hà Nội", full_name: "Thành phố Hà Nội" },
          { code: 79, name: "TP Hồ Chí Minh", full_name: "Thành phố H��� Chí Minh" },
          { code: 48, name: "Đà Nẵng", full_name: "Thành phố Đà Nẵng" },
          { code: 92, name: "Cần Thơ", full_name: "Thành phố Cần Thơ" },
          { code: 33, name: "Hải Phòng", full_name: "Thành phố Hải Phòng" },
          { code: 77, name: "Quảng Ninh", full_name: "Tỉnh Quảng Ninh" },
          { code: 26, name: "Khánh Hòa", full_name: "Tỉnh Khánh Hòa" },
          { code: 20, name: "Quảng Nam", full_name: "Tỉnh Quảng Nam" },
          { code: 2, name: "Hà Giang", full_name: "Tỉnh Hà Giang" },
          { code: 4, name: "Cao Bằng", full_name: "Tỉnh Cao Bằng" },
          { code: 6, name: "Bắc Kạn", full_name: "Tỉnh Bắc Kạn" },
          { code: 8, name: "Tuyên Quang", full_name: "Tỉnh Tuyên Quang" },
          { code: 10, name: "Lào Cai", full_name: "Tỉnh Lào Cai" },
          { code: 11, name: "Điện Biên", full_name: "Tỉnh Điện Biên" },
          { code: 12, name: "Lai Châu", full_name: "Tỉnh Lai Châu" },
          { code: 14, name: "Sơn La", full_name: "Tỉnh Sơn La" },
          { code: 15, name: "Yên Bái", full_name: "Tỉnh Yên Bái" },
          { code: 17, name: "Hoà Bình", full_name: "Tỉnh Hoà Bình" },
          { code: 19, name: "Thái Nguyên", full_name: "Tỉnh Thái Nguyên" },
          { code: 22, name: "Lạng Sơn", full_name: "Tỉnh Lạng Sơn" },
          { code: 24, name: "Bắc Giang", full_name: "Tỉnh Bắc Giang" },
          { code: 25, name: "Phú Thọ", full_name: "Tỉnh Phú Thọ" },
          { code: 27, name: "Vĩnh Phúc", full_name: "Tỉnh Vĩnh Phúc" },
          { code: 30, name: "Bắc Ninh", full_name: "Tỉnh Bắc Ninh" },
          { code: 31, name: "Hải Dương", full_name: "Tỉnh Hải Dương" },
          { code: 35, name: "Hưng Yên", full_name: "Tỉnh Hưng Yên" },
          { code: 36, name: "Thái Bình", full_name: "Tỉnh Thái Bình" },
          { code: 37, name: "Hà Nam", full_name: "Tỉnh Hà Nam" },
          { code: 38, name: "Nam Định", full_name: "Tỉnh Nam Định" },
          { code: 40, name: "Ninh Bình", full_name: "Tỉnh Ninh Bình" },
          { code: 42, name: "Thanh Hóa", full_name: "Tỉnh Thanh Hóa" },
          { code: 44, name: "Nghệ An", full_name: "Tỉnh Nghệ An" },
          { code: 45, name: "Hà Tĩnh", full_name: "Tỉnh Hà Tĩnh" },
          { code: 46, name: "Quảng Bình", full_name: "Tỉnh Quảng Bình" },
          { code: 49, name: "Quảng Trị", full_name: "Tỉnh Quảng Trị" },
          { code: 51, name: "Thừa Thiên Huế", full_name: "Tỉnh Thừa Thiên Huế" },
          { code: 52, name: "Quảng Ngãi", full_name: "Tỉnh Quảng Ngãi" },
          { code: 54, name: "Bình Định", full_name: "Tỉnh Bình Định" },
          { code: 56, name: "Phú Yên", full_name: "Tỉnh Phú Yên" },
          { code: 58, name: "Ninh Thuận", full_name: "Tỉnh Ninh Thuận" },
          { code: 60, name: "Bình Thuận", full_name: "Tỉnh Bình Thuận" },
          { code: 62, name: "Kon Tum", full_name: "Tỉnh Kon Tum" },
          { code: 64, name: "Gia Lai", full_name: "Tỉnh Gia Lai" },
          { code: 66, name: "Đắk Lắk", full_name: "Tỉnh Đắk Lắk" },
          { code: 67, name: "Đắk Nông", full_name: "Tỉnh Đắk Nông" },
          { code: 68, name: "Lâm Đồng", full_name: "Tỉnh Lâm Đồng" },
          { code: 70, name: "Bình Phước", full_name: "Tỉnh Bình Phước" },
          { code: 72, name: "Tây Ninh", full_name: "Tỉnh Tây Ninh" },
          { code: 74, name: "Bình Dương", full_name: "Tỉnh Bình Dương" },
          { code: 75, name: "Đồng Nai", full_name: "Tỉnh Đồng Nai" },
          { code: 77, name: "Bà Rịa - Vũng Tàu", full_name: "Tỉnh Bà Rịa - Vũng Tàu" },
          { code: 80, name: "Long An", full_name: "Tỉnh Long An" },
          { code: 82, name: "Tiền Giang", full_name: "Tỉnh Tiền Giang" },
          { code: 83, name: "Bến Tre", full_name: "Tỉnh Bến Tre" },
          { code: 84, name: "Trà Vinh", full_name: "Tỉnh Trà Vinh" },
          { code: 86, name: "Vĩnh Long", full_name: "Tỉnh Vĩnh Long" },
          { code: 87, name: "Đồng Tháp", full_name: "Tỉnh Đồng Tháp" },
          { code: 89, name: "An Giang", full_name: "Tỉnh An Giang" },
          { code: 91, name: "Kiên Giang", full_name: "Tỉnh Kiên Giang" },
          { code: 93, name: "Hậu Giang", full_name: "Tỉnh Hậu Giang" },
          { code: 94, name: "Sóc Trăng", full_name: "Tỉnh Sóc Trăng" },
          { code: 95, name: "Bạc Liêu", full_name: "Tỉnh Bạc Liêu" },
          { code: 96, name: "Cà Mau", full_name: "Tỉnh Cà Mau" },
        ];

        return res.json({
          success: true,
          data: provinces,
        });
      }

      // Handle districts request
      if (type === 'districts' && province_code) {
        const districtsData = {
          1: [ // Hà Nội
            { code: 1, name: "Ba Đình", full_name: "Quận Ba Đình", province_code: 1 },
            { code: 2, name: "Hoàn Kiếm", full_name: "Quận Hoàn Kiếm", province_code: 1 },
            { code: 3, name: "Tây Hồ", full_name: "Quận Tây Hồ", province_code: 1 },
            { code: 4, name: "Long Biên", full_name: "Quận Long Biên", province_code: 1 },
            { code: 5, name: "Cầu Giấy", full_name: "Quận Cầu Giấy", province_code: 1 },
            { code: 6, name: "Đống Đa", full_name: "Quận Đống Đa", province_code: 1 },
            { code: 7, name: "Hai Bà Trưng", full_name: "Quận Hai Bà Trưng", province_code: 1 },
            { code: 8, name: "Hoàng Mai", full_name: "Quận Hoàng Mai", province_code: 1 },
            { code: 9, name: "Thanh Xuân", full_name: "Quận Thanh Xuân", province_code: 1 },
            { code: 16, name: "Sóc Sơn", full_name: "Huyện Sóc Sơn", province_code: 1 },
            { code: 17, name: "Đông Anh", full_name: "Huyện Đông Anh", province_code: 1 },
            { code: 18, name: "Gia Lâm", full_name: "Huyện Gia Lâm", province_code: 1 },
            { code: 19, name: "Nam Từ Liêm", full_name: "Quận Nam Từ Liêm", province_code: 1 },
            { code: 21, name: "Thanh Trì", full_name: "Huyện Thanh Trì", province_code: 1 },
            { code: 250, name: "Bắc Từ Liêm", full_name: "Quận Bắc Từ Liêm", province_code: 1 },
          ],
          79: [ // TP Hồ Chí Minh
            { code: 760, name: "Quận 1", full_name: "Quận 1", province_code: 79 },
            { code: 761, name: "Quận 2", full_name: "Quận 2", province_code: 79 },
            { code: 762, name: "Quận 3", full_name: "Quận 3", province_code: 79 },
            { code: 763, name: "Quận 4", full_name: "Quận 4", province_code: 79 },
            { code: 764, name: "Quận 5", full_name: "Quận 5", province_code: 79 },
            { code: 765, name: "Quận 6", full_name: "Quận 6", province_code: 79 },
            { code: 766, name: "Quận 7", full_name: "Quận 7", province_code: 79 },
            { code: 767, name: "Quận 8", full_name: "Quận 8", province_code: 79 },
            { code: 768, name: "Quận 9", full_name: "Quận 9", province_code: 79 },
            { code: 769, name: "Quận 10", full_name: "Quận 10", province_code: 79 },
            { code: 770, name: "Quận 11", full_name: "Quận 11", province_code: 79 },
            { code: 771, name: "Quận 12", full_name: "Quận 12", province_code: 79 },
            { code: 772, name: "Quận Bình Thạnh", full_name: "Quận Bình Thạnh", province_code: 79 },
            { code: 773, name: "Quận Gò Vấp", full_name: "Quận Gò Vấp", province_code: 79 },
            { code: 774, name: "Quận Phú Nhuận", full_name: "Quận Phú Nhuận", province_code: 79 },
            { code: 775, name: "Quận Tân Bình", full_name: "Quận Tân Bình", province_code: 79 },
            { code: 776, name: "Quận Tân Phú", full_name: "Quận Tân Phú", province_code: 79 },
            { code: 783, name: "Huyện Nhà Bè", full_name: "Huyện Nhà Bè", province_code: 79 },
            { code: 784, name: "Huyện Hóc Môn", full_name: "Huyện Hóc Môn", province_code: 79 },
            { code: 785, name: "Huyện Củ Chi", full_name: "Huyện Củ Chi", province_code: 79 },
          ],
          48: [ // Đà Nẵng
            { code: 490, name: "Hải Châu", full_name: "Quận Hải Châu", province_code: 48 },
            { code: 491, name: "Cam Lệ", full_name: "Quận Cam Lệ", province_code: 48 },
            { code: 492, name: "Thanh Khê", full_name: "Quận Thanh Khê", province_code: 48 },
            { code: 493, name: "Liên Chiểu", full_name: "Quận Liên Chiểu", province_code: 48 },
            { code: 494, name: "Ngũ Hành Sơn", full_name: "Quận Ngũ Hành Sơn", province_code: 48 },
            { code: 495, name: "Sơn Trà", full_name: "Quận Sơn Trà", province_code: 48 },
            { code: 497, name: "Hoà Vang", full_name: "Huyện Hoà Vang", province_code: 48 },
          ],
          92: [ // Cần Thơ
            { code: 916, name: "Ninh Kiều", full_name: "Quận Ninh Kiều", province_code: 92 },
            { code: 917, name: "Ô Môn", full_name: "Quận Ô Môn", province_code: 92 },
            { code: 918, name: "Bình Thuỷ", full_name: "Quận Bình Thuỷ", province_code: 92 },
            { code: 919, name: "Cái Răng", full_name: "Quận Cái Răng", province_code: 92 },
            { code: 923, name: "Thốt Nốt", full_name: "Quận Thốt Nốt", province_code: 92 },
            { code: 924, name: "Vĩnh Thạnh", full_name: "Huyện Vĩnh Thạnh", province_code: 92 },
            { code: 925, name: "Cờ Đỏ", full_name: "Huyện Cờ Đỏ", province_code: 92 },
            { code: 926, name: "Phong Điền", full_name: "Huyện Phong Điền", province_code: 92 },
            { code: 927, name: "Thới Lai", full_name: "Huyện Thới Lai", province_code: 92 },
          ],
          26: [ // Khánh Hòa
            { code: 260, name: "Nha Trang", full_name: "Thành phố Nha Trang", province_code: 26 },
            { code: 261, name: "Cam Ranh", full_name: "Thành phố Cam Ranh", province_code: 26 },
            { code: 262, name: "Cam Lâm", full_name: "Huyện Cam Lâm", province_code: 26 },
            { code: 263, name: "Vạn Ninh", full_name: "Huyện Vạn Ninh", province_code: 26 },
            { code: 264, name: "Ninh Hòa", full_name: "Thị xã Ninh Hòa", province_code: 26 },
            { code: 265, name: "Khánh Vĩnh", full_name: "Huyện Khánh Vĩnh", province_code: 26 },
            { code: 266, name: "Diên Khánh", full_name: "Huyện Diên Khánh", province_code: 26 },
            { code: 267, name: "Khánh Sơn", full_name: "Huyện Khánh Sơn", province_code: 26 },
            { code: 268, name: "Trường Sa", full_name: "Huyện Trường Sa", province_code: 26 },
          ],
          33: [ // Hải Phòng
            { code: 330, name: "Hồng Bàng", full_name: "Quận Hồng Bàng", province_code: 33 },
            { code: 331, name: "Ngô Quyền", full_name: "Quận Ngô Quyền", province_code: 33 },
            { code: 332, name: "Lê Chân", full_name: "Quận Lê Chân", province_code: 33 },
            { code: 333, name: "Hải An", full_name: "Quận Hải An", province_code: 33 },
            { code: 334, name: "Kiến An", full_name: "Quận Kiến An", province_code: 33 },
            { code: 335, name: "Đồ Sơn", full_name: "Quận Đồ Sơn", province_code: 33 },
            { code: 336, name: "Dương Kinh", full_name: "Quận Dương Kinh", province_code: 33 },
          ],
          77: [ // Quảng Ninh
            { code: 770, name: "Hạ Long", full_name: "Thành phố Hạ Long", province_code: 77 },
            { code: 771, name: "Móng Cái", full_name: "Thành phố Móng Cái", province_code: 77 },
            { code: 772, name: "Cam Phả", full_name: "Thành phố Cam Phả", province_code: 77 },
            { code: 773, name: "Uông Bí", full_name: "Thành phố Uông Bí", province_code: 77 },
            { code: 774, name: "Quảng Yên", full_name: "Thị xã Quảng Yên", province_code: 77 },
            { code: 775, name: "Đông Triều", full_name: "Thị xã Đông Triều", province_code: 77 },
            { code: 776, name: "Ba Chẽ", full_name: "Huyện Ba Chẽ", province_code: 77 },
            { code: 777, name: "Vân Đồn", full_name: "Huyện Vân Đồn", province_code: 77 },
          ],
        };

        const districts = districtsData[province_code] || [
          // Generic districts for provinces that don't have specific data
          { code: parseInt(province_code) * 1000 + 1, name: "Huyện 1", full_name: "Huyện 1", province_code: parseInt(province_code) },
          { code: parseInt(province_code) * 1000 + 2, name: "Huyện 2", full_name: "Huyện 2", province_code: parseInt(province_code) },
          { code: parseInt(province_code) * 1000 + 3, name: "Huyện 3", full_name: "Huyện 3", province_code: parseInt(province_code) },
          { code: parseInt(province_code) * 1000 + 4, name: "Huyện 4", full_name: "Huyện 4", province_code: parseInt(province_code) },
          { code: parseInt(province_code) * 1000 + 5, name: "Huyện 5", full_name: "Huyện 5", province_code: parseInt(province_code) },
        ];
        return res.json({
          success: true,
          data: districts,
        });
      }

      // Handle wards request
      if (type === 'wards' && district_code) {
        const wardsData = {
          // Sample wards for Hanoi districts
          1: [ // Ba Đình
            { code: 1, name: "Phúc Xá", full_name: "Phường Phúc Xá", district_code: 1 },
            { code: 4, name: "Trúc Bạch", full_name: "Phường Trúc Bạch", district_code: 1 },
            { code: 6, name: "Vĩnh Phúc", full_name: "Phường Vĩnh Phúc", district_code: 1 },
            { code: 7, name: "Cống Vị", full_name: "Phường Cống Vị", district_code: 1 },
            { code: 8, name: "Liễu Giai", full_name: "Phường Liễu Giai", district_code: 1 },
            { code: 10, name: "Nguyễn Trung Trực", full_name: "Phường Nguyễn Trung Trực", district_code: 1 },
            { code: 13, name: "Quán Thánh", full_name: "Phường Quán Thánh", district_code: 1 },
            { code: 16, name: "Ngọc Hà", full_name: "Phường Ngọc Hà", district_code: 1 },
            { code: 19, name: "Điện Biên", full_name: "Phường Điện Biên", district_code: 1 },
            { code: 22, name: "Đội Cấn", full_name: "Phường Đội Cấn", district_code: 1 },
            { code: 25, name: "Ngọc Khánh", full_name: "Phường Ngọc Khánh", district_code: 1 },
            { code: 28, name: "Kim Mã", full_name: "Phường Kim Mã", district_code: 1 },
            { code: 31, name: "Giảng Võ", full_name: "Phường Giảng Võ", district_code: 1 },
            { code: 34, name: "Thành Công", full_name: "Phường Thành Công", district_code: 1 },
          ],
          2: [ // Hoàn Kiếm
            { code: 37, name: "Phúc Tân", full_name: "Phường Phúc Tân", district_code: 2 },
            { code: 40, name: "Đồng Xuân", full_name: "Phường Đồng Xuân", district_code: 2 },
            { code: 43, name: "Hàng Mã", full_name: "Phường Hàng Mã", district_code: 2 },
            { code: 46, name: "Hàng Buồm", full_name: "Phường Hàng Buồm", district_code: 2 },
            { code: 49, name: "Hàng Đào", full_name: "Phường Hàng Đão", district_code: 2 },
            { code: 52, name: "Hàng Bồ", full_name: "Phường Hàng Bồ", district_code: 2 },
            { code: 55, name: "Cửa Đông", full_name: "Phường Cửa Đông", district_code: 2 },
            { code: 58, name: "Lý Thái Tổ", full_name: "Phường Lý Thái Tổ", district_code: 2 },
            { code: 61, name: "Hàng Bạc", full_name: "Phường Hàng Bạc", district_code: 2 },
            { code: 64, name: "Hàng Gai", full_name: "Phường Hàng Gai", district_code: 2 },
            { code: 67, name: "Chương Dương Độ", full_name: "Phường Chương Dương Độ", district_code: 2 },
            { code: 70, name: "Hàng Trống", full_name: "Phường Hàng Trống", district_code: 2 },
            { code: 73, name: "Cửa Nam", full_name: "Phường Cửa Nam", district_code: 2 },
            { code: 76, name: "Hàng Bông", full_name: "Phường Hàng Bông", district_code: 2 },
            { code: 79, name: "Tràng Tiền", full_name: "Phường Tràng Tiền", district_code: 2 },
            { code: 82, name: "Trần Hưng Đạo", full_name: "Phường Trần Hưng Đạo", district_code: 2 },
            { code: 85, name: "Phan Chu Trinh", full_name: "Phường Phan Chu Trinh", district_code: 2 },
            { code: 88, name: "Hàng Bài", full_name: "Phường Hàng Bài", district_code: 2 },
          ],
          760: [ // Quận 1 - HCMC
            { code: 26734, name: "Tân Định", full_name: "Phường Tân Định", district_code: 760 },
            { code: 26737, name: "Đa Kao", full_name: "Phường Đa Kao", district_code: 760 },
            { code: 26740, name: "Bến Nghé", full_name: "Phường Bến Nghé", district_code: 760 },
            { code: 26743, name: "Bến Thành", full_name: "Phường Bến Thành", district_code: 760 },
            { code: 26746, name: "Nguyễn Thái Bình", full_name: "Phường Nguyễn Thái Bình", district_code: 760 },
            { code: 26749, name: "Phạm Ngũ Lão", full_name: "Phường Phạm Ngũ Lão", district_code: 760 },
            { code: 26752, name: "Cầu Ông Lãnh", full_name: "Phường Cầu Ông Lãnh", district_code: 760 },
            { code: 26755, name: "Cô Giang", full_name: "Phường Cô Giang", district_code: 760 },
            { code: 26758, name: "Nguyễn Cư Trinh", full_name: "Phường Nguyễn Cư Trinh", district_code: 760 },
            { code: 26761, name: "Cầu Kho", full_name: "Phường Cầu Kho", district_code: 760 },
          ],
        };

        const wards = wardsData[district_code] || [
          { code: 1, name: "Phường 1", full_name: "Phường 1", district_code: parseInt(district_code) },
          { code: 2, name: "Phường 2", full_name: "Phường 2", district_code: parseInt(district_code) },
          { code: 3, name: "Phường 3", full_name: "Phường 3", district_code: parseInt(district_code) },
          { code: 4, name: "Phường 4", full_name: "Phường 4", district_code: parseInt(district_code) },
          { code: 5, name: "Phường 5", full_name: "Phường 5", district_code: parseInt(district_code) },
        ];

        return res.json({
          success: true,
          data: wards,
        });
      }

      // Default response for backwards compatibility
      const locations = [
        { id: 1, name: "Hà Nội", code: "HN", type: "city" },
        { id: 79, name: "TP Hồ Chí Minh", code: "HCM", type: "city" },
        { id: 48, name: "Đà Nẵng", code: "DN", type: "city" },
        { id: 92, name: "Cần Thơ", code: "CT", type: "city" },
      ];

      res.json({
        success: true,
        data: locations,
      });
    } catch (error) {
      console.error('Get locations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get locations',
      });
    }
  },

  // Get districts by province
  async getDistricts(req, res) {
    try {
      const { province_id } = req.params;

      if (!province_id) {
        return res.status(400).json({
          success: false,
          message: 'Province ID is required',
        });
      }

      // Sample districts data for major cities
      const districtsData = {
        1: [ // Hà Nội
          { id: 1, name: "Ba Đình", code: "BD" },
          { id: 2, name: "Hoàn Kiếm", code: "HK" },
          { id: 3, name: "Tây Hồ", code: "TH" },
          { id: 4, name: "Long Biên", code: "LB" },
          { id: 5, name: "Cầu Giấy", code: "CG" },
          { id: 6, name: "Đống Đa", code: "DD" },
          { id: 7, name: "Hai Bà Trưng", code: "HBT" },
          { id: 8, name: "Hoàng Mai", code: "HM" },
          { id: 9, name: "Thanh Xuân", code: "TX" },
        ],
        79: [ // TP Hồ Chí Minh
          { id: 760, name: "Quận 1", code: "Q1" },
          { id: 761, name: "Quận 2", code: "Q2" },
          { id: 762, name: "Quận 3", code: "Q3" },
          { id: 763, name: "Quận 4", code: "Q4" },
          { id: 764, name: "Quận 5", code: "Q5" },
          { id: 765, name: "Quận 6", code: "Q6" },
          { id: 766, name: "Quận 7", code: "Q7" },
          { id: 767, name: "Quận 8", code: "Q8" },
          { id: 768, name: "Quận 9", code: "Q9" },
          { id: 769, name: "Quận 10", code: "Q10" },
          { id: 770, name: "Quận 11", code: "Q11" },
          { id: 771, name: "Quận 12", code: "Q12" },
          { id: 772, name: "Quận Bình Thạnh", code: "BT" },
          { id: 773, name: "Quận Gò Vấp", code: "GV" },
          { id: 774, name: "Quận Phú Nhuận", code: "PN" },
          { id: 775, name: "Quận Tân Bình", code: "TB" },
          { id: 776, name: "Quận Tân Phú", code: "TP" },
        ],
        48: [ // Đà Nẵng
          { id: 490, name: "Hải Châu", code: "HC" },
          { id: 491, name: "Cam Lệ", code: "CL" },
          { id: 492, name: "Thanh Khê", code: "TK" },
          { id: 493, name: "Liên Chiểu", code: "LC" },
          { id: 494, name: "Ngũ Hành Sơn", code: "NHS" },
          { id: 495, name: "Sơn Trà", code: "ST" },
        ],
      };

      const districts = districtsData[province_id] || [];

      res.json({
        success: true,
        data: districts,
      });
    } catch (error) {
      console.error('Get districts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get districts',
      });
    }
  },

  // Get wards by district
  async getWards(req, res) {
    try {
      const { district_id } = req.params;

      if (!district_id) {
        return res.status(400).json({
          success: false,
          message: 'District ID is required',
        });
      }

      // Sample wards data
      const wards = [
        { id: 1, name: "Phường 1", code: "P1" },
        { id: 2, name: "Phường 2", code: "P2" },
        { id: 3, name: "Phường 3", code: "P3" },
        { id: 4, name: "Phường 4", code: "P4" },
        { id: 5, name: "Phường 5", code: "P5" },
      ];

      res.json({
        success: true,
        data: wards,
      });
    } catch (error) {
      console.error('Get wards error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get wards',
      });
    }
  },
};
