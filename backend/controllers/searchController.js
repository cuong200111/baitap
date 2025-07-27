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
  // Get all locations (provinces/cities)
  async getLocations(req, res) {
    try {
      // Sample Vietnam provinces/cities data
      const locations = [
        { id: 1, name: "Hà Nội", code: "HN", type: "city" },
        { id: 79, name: "TP Hồ Chí Minh", code: "HCM", type: "city" },
        { id: 48, name: "Đà Nẵng", code: "DN", type: "city" },
        { id: 92, name: "Cần Thơ", code: "CT", type: "city" },
        { id: 33, name: "Hải Phòng", code: "HP", type: "city" },
        { id: 77, name: "Quảng Ninh", code: "QN", type: "province" },
        { id: 26, name: "Khánh Hòa", code: "KH", type: "province" },
        { id: 20, name: "Quảng Nam", code: "QNM", type: "province" },
        { id: 2, name: "Hà Giang", code: "HG", type: "province" },
        { id: 4, name: "Cao Bằng", code: "CB", type: "province" },
        { id: 6, name: "Bắc Kạn", code: "BK", type: "province" },
        { id: 8, name: "Tuyên Quang", code: "TQ", type: "province" },
        { id: 10, name: "Lào Cai", code: "LC", type: "province" },
        { id: 11, name: "Điện Biên", code: "DB", type: "province" },
        { id: 12, name: "Lai Châu", code: "LCH", type: "province" },
        { id: 14, name: "Sơn La", code: "SL", type: "province" },
        { id: 15, name: "Yên Bái", code: "YB", type: "province" },
        { id: 17, name: "Hoà Bình", code: "HB", type: "province" },
        { id: 19, name: "Thái Nguyên", code: "TN", type: "province" },
        { id: 22, name: "Lạng Sơn", code: "LS", type: "province" },
        { id: 24, name: "Bắc Giang", code: "BG", type: "province" },
        { id: 25, name: "Phú Thọ", code: "PT", type: "province" },
        { id: 27, name: "Vĩnh Phúc", code: "VP", type: "province" },
        { id: 30, name: "Bắc Ninh", code: "BN", type: "province" },
        { id: 31, name: "Hải Dương", code: "HD", type: "province" },
        { id: 35, name: "Hưng Yên", code: "HY", type: "province" },
        { id: 36, name: "Thái Bình", code: "TB", type: "province" },
        { id: 37, name: "Hà Nam", code: "HNM", type: "province" },
        { id: 38, name: "Nam Định", code: "ND", type: "province" },
        { id: 40, name: "Ninh Bình", code: "NB", type: "province" },
        { id: 42, name: "Thanh Hóa", code: "TH", type: "province" },
        { id: 44, name: "Nghệ An", code: "NA", type: "province" },
        { id: 45, name: "Hà Tĩnh", code: "HT", type: "province" },
        { id: 46, name: "Quảng Bình", code: "QB", type: "province" },
        { id: 49, name: "Quảng Trị", code: "QT", type: "province" },
        { id: 51, name: "Thừa Thiên Huế", code: "TTH", type: "province" },
        { id: 52, name: "Quảng Ngãi", code: "QNG", type: "province" },
        { id: 54, name: "Bình Định", code: "BD", type: "province" },
        { id: 56, name: "Phú Yên", code: "PY", type: "province" },
        { id: 58, name: "Ninh Thuận", code: "NT", type: "province" },
        { id: 60, name: "Bình Thuận", code: "BT", type: "province" },
        { id: 62, name: "Kon Tum", code: "KT", type: "province" },
        { id: 64, name: "Gia Lai", code: "GL", type: "province" },
        { id: 66, name: "Đắk Lắk", code: "DL", type: "province" },
        { id: 67, name: "Đắk Nông", code: "DN", type: "province" },
        { id: 68, name: "Lâm Đồng", code: "LD", type: "province" },
        { id: 70, name: "Bình Phước", code: "BP", type: "province" },
        { id: 72, name: "Tây Ninh", code: "TN", type: "province" },
        { id: 74, name: "Bình Dương", code: "BD", type: "province" },
        { id: 75, name: "Đồng Nai", code: "DN", type: "province" },
        { id: 77, name: "Bà Rịa - Vũng Tàu", code: "VT", type: "province" },
        { id: 80, name: "Long An", code: "LA", type: "province" },
        { id: 82, name: "Tiền Giang", code: "TG", type: "province" },
        { id: 83, name: "Bến Tre", code: "BT", type: "province" },
        { id: 84, name: "Trà Vinh", code: "TV", type: "province" },
        { id: 86, name: "Vĩnh Long", code: "VL", type: "province" },
        { id: 87, name: "Đồng Tháp", code: "DT", type: "province" },
        { id: 89, name: "An Giang", code: "AG", type: "province" },
        { id: 91, name: "Kiên Giang", code: "KG", type: "province" },
        { id: 93, name: "Hậu Giang", code: "HG", type: "province" },
        { id: 94, name: "Sóc Trăng", code: "ST", type: "province" },
        { id: 95, name: "Bạc Liêu", code: "BL", type: "province" },
        { id: 96, name: "Cà Mau", code: "CM", type: "province" },
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
