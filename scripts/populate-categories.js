// Simple script to test and populate categories
const categories = [
  {
    id: 1,
    name: "Laptop, MacBook, Surface",
    slug: "laptop",
    description: "Laptop, MacBook và Surface từ các thương hiệu hàng đầu",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop",
    parent_id: null,
    sort_order: 1,
    is_active: 1,
  },
  {
    id: 2,
    name: "PC Desktop & Workstation",
    slug: "pc-desktop",
    description: "Máy tính để bàn và workstation mạnh mẽ",
    image:
      "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=600&h=400&fit=crop",
    parent_id: null,
    sort_order: 2,
    is_active: 1,
  },
  {
    id: 3,
    name: "Gaming Gear & Phụ kiện",
    slug: "gaming-gear",
    description: "Phụ kiện gaming cao cấp",
    image:
      "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=600&h=400&fit=crop",
    parent_id: null,
    sort_order: 3,
    is_active: 1,
  },
  {
    id: 4,
    name: "Màn hình & Thiết bị hiển thị",
    slug: "man-hinh",
    description: "Màn hình gaming, văn phòng, đồ họa",
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=400&fit=crop",
    parent_id: null,
    sort_order: 4,
    is_active: 1,
  },
  {
    id: 5,
    name: "Điện thoại & Tablet",
    slug: "dien-thoai-tablet",
    description: "Smartphone và tablet từ Apple, Samsung, Xiaomi",
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
    parent_id: null,
    sort_order: 5,
    is_active: 1,
  },
];

console.log("Default categories:", JSON.stringify(categories, null, 2));
console.log("Total categories:", categories.length);
