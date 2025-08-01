"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [userExistsError, setUserExistsError] = useState(false);
  const { register, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Mật kh���u phải có ít nhất 6 ký tự");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Email không hợp lệ");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone || undefined,
      );
    } catch (error: any) {
      console.error("Registration error:", error);

      if (error.message && error.message.includes("User already exists")) {
        setUserExistsError(true);
        setError(
          "❌ Email này đã được sử dụng trong hệ thống. " +
            "Có thể do: 1) Bạn đã đăng ký trước đó - hãy thử đăng nhập, " +
            "2) Email đã tồn tại trong dữ liệu demo. " +
            "Giải pháp: Thử email khác hoặc liên hệ admin để xóa tài khoản cũ.",
        );
      } else {
        setUserExistsError(false);
        setError(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">
            ZOXVN
          </CardTitle>
          <p className="text-gray-600">Tạo tài khoản mới</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                  {userExistsError && (
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/debug/auth`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "reset" }),
                            });
                            const result = await response.json();
                            if (result.success) {
                              setError(
                                "✅ Đã reset tài khoản admin thành công. Bây giờ bạn có thể thử đăng ký lại.",
                              );
                              setUserExistsError(false);
                            } else {
                              setError(`Reset failed: ${result.message}`);
                            }
                          } catch (error) {
                            setError("Lỗi khi reset tài khoản");
                          }
                        }}
                      >
                        🔄 Reset tài khoản admin (chỉ cho demo)
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="fullName">Họ và tên *</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Nhập email của bạn"
              />
            </div>

            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                placeholder="Nhập số điện thoại (tùy chọn)"
              />
            </div>

            <div>
              <Label htmlFor="password">Mật khẩu *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Nhập lại mật khẩu"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đăng ký
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
