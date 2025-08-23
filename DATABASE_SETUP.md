# Database Setup Requirements

## MySQL Configuration

The application requires a MySQL database with the following configuration:

### Connection Settings
```javascript
{
  host: "localhost",
  user: "root", 
  password: "",
  database: "wocom",
  port: 3306
}
```

### Setup Steps

1. **Install MySQL Server** (if not already installed)
   ```bash
   # On Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server
   
   # On macOS with Homebrew
   brew install mysql
   
   # On Windows
   # Download and install from https://dev.mysql.com/downloads/mysql/
   ```

2. **Start MySQL Service**
   ```bash
   # On Ubuntu/Debian
   sudo systemctl start mysql
   sudo systemctl enable mysql
   
   # On macOS
   brew services start mysql
   
   # On Windows
   # Start through Services or MySQL Workbench
   ```

3. **Create Database**
   ```sql
   # Login to MySQL as root
   mysql -u root -p
   
   # Create the database
   CREATE DATABASE wocom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   # Grant permissions (if needed)
   GRANT ALL PRIVILEGES ON wocom.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Verify Connection**
   ```bash
   # Test database connection
   mysql -u root -p -e "USE wocom; SELECT 1;"
   ```

### Database Schema

The backend will automatically create the required tables when it starts, including:

- `users` - User accounts and authentication
- `categories` - Product categories
- `products` - Product catalog
- `orders` - Customer orders
- `order_items` - Order line items (NO foreign key to products for deletion flexibility)
- `product_categories` - Product-category relationships
- `product_reviews` - Product reviews and ratings
- `cart_items` - Shopping cart items
- `media` - File uploads and media management
- `seo_settings` - SEO configuration

### Important Schema Changes

The `order_items` table has been modified to allow product deletion without affecting existing orders:

```sql
-- OLD (with foreign key constraint)
CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE

-- NEW (no foreign key constraint to products)
-- Removed the foreign key constraint to allow product deletion
-- Order items will retain product information even when product is deleted
```

### Starting the Application

1. **Ensure MySQL is running**
2. **Start Backend Server**
   ```bash
   npm run backend:dev
   ```
3. **Start Frontend Server**
   ```bash
   npm run dev
   ```

### Troubleshooting

**Connection Refused Error**: Ensure MySQL service is running on port 3306
```bash
# Check if MySQL is running
sudo systemctl status mysql
# Or check port
netstat -tlnp | grep :3306
```

**Access Denied Error**: Verify username and password
```bash
mysql -u root -p
```

**Database Does Not Exist**: Create the database manually
```sql
CREATE DATABASE wocom;
```

### Environment Variables

The application uses these environment variables (with fallbacks):
```
DB_HOST=localhost (default)
DB_USER=root (default) 
DB_PASSWORD= (default: empty)
DB_NAME=wocom (default)
DB_PORT=3306 (default)
```

To override defaults, create a `.env` file in the backend directory:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=wocom
DB_PORT=3306
```
