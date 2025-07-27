import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Youtube,
  Zap,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">H</span>
              </div>
              <div>
                <div className="font-bold text-lg">HACOM</div>
                <div className="text-sm text-gray-400">Siêu thị máy tính</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Cửa hàng máy tính uy tín với hơn 20 năm kinh nghiệm, chuyên cung
              cấp các sản phẩm công nghệ chất lượng cao.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <Youtube className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <Zap className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">Liên hệ</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-red-500" />
                <span className="text-sm">1900.1903 (7:30 - 22:00)</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-red-500" />
                <span className="text-sm">info@hacom.vn</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-sm">
                  131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-red-500" />
                <span className="text-sm">8:00 - 22:00 (T2-CN)</span>
              </div>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-bold text-lg mb-4">Hỗ trợ khách hàng</h3>
            <div className="space-y-2">
              <Link
                href="/huong-dan-mua-hang"
                className="block text-sm text-gray-400 hover:text-white"
              >
                Hướng dẫn mua hàng
              </Link>
              <Link
                href="/chinh-sach-bao-hanh"
                className="block text-sm text-gray-400 hover:text-white"
              >
                Chính sách bảo hành
              </Link>
              <Link
                href="/chinh-sach-doi-tra"
                className="block text-sm text-gray-400 hover:text-white"
              >
                Chính sách đổi trả
              </Link>
              <Link
                href="/chinh-sach-giao-hang"
                className="block text-sm text-gray-400 hover:text-white"
              >
                Chính sách giao hàng
              </Link>
              <Link
                href="/phuong-thuc-thanh-toan"
                className="block text-sm text-gray-400 hover:text-white"
              >
                Phương thức thanh toán
              </Link>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">Về HACOM</h3>
            <div className="space-y-2">
              <Link
                href="/gioi-thieu"
                className="block text-sm text-gray-400 hover:text-white"
              >
                Giới thiệu công ty
              </Link>
              <Link
                href="/tuyen-dung"
                className="block text-sm text-gray-400 hover:text-white"
              >
                Tuyển dụng
              </Link>
              <Link
                href="/tin-tuc"
                className="block text-sm text-gray-400 hover:text-white"
              >
                Tin tức
              </Link>
              <Link
                href="/lien-he"
                className="block text-sm text-gray-400 hover:text-white"
              >
                Liên hệ
              </Link>
              <Link
                href="/he-thong-cua-hang"
                className="block text-sm text-gray-400 hover:text-white"
              >
                Hệ thống cửa hàng
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2024 HACOM. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link
                href="/dieu-khoan-su-dung"
                className="text-sm text-gray-400 hover:text-white"
              >
                Điều khoản sử dụng
              </Link>
              <Link
                href="/chinh-sach-bao-mat"
                className="text-sm text-gray-400 hover:text-white"
              >
                Chính sách bảo mật
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
