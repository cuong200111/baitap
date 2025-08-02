"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Trash2,
  Shield,
  CheckCircle,
  AlertCircle,
  Building,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { WithAuth } from "@/components/AuthGuard";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PaymentMethod {
  id: number;
  type: "credit_card" | "bank_transfer" | "e_wallet";
  card_number?: string;
  card_holder?: string;
  expiry_month?: number;
  expiry_year?: number;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  wallet_type?: string;
  wallet_account?: string;
  is_default: boolean;
  created_at: string;
}

interface BillingAddress {
  id: number;
  company_name?: string;
  tax_code?: string;
  address: string;
  phone: string;
  email: string;
  is_default: boolean;
}

export default function BillingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [billingAddresses, setBillingAddresses] = useState<BillingAddress[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);

  const [cardForm, setCardForm] = useState({
    card_number: "",
    card_holder: "",
    expiry_month: "",
    expiry_year: "",
    cvv: "",
  });

  const [addressForm, setAddressForm] = useState({
    company_name: "",
    tax_code: "",
    address: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    // Only load data if user is authenticated (AuthGuard handles auth)
    if (user && isAuthenticated) {
      loadBillingData();
    }
  }, [user, isAuthenticated]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      // For now, simulate data loading
      // In real app, fetch from API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      setPaymentMethods([
        {
          id: 1,
          type: "credit_card",
          card_number: "4111****1111",
          card_holder: "NGUYEN VAN A",
          expiry_month: 12,
          expiry_year: 2025,
          is_default: true,
          created_at: "2024-01-15T00:00:00Z",
        },
        {
          id: 2,
          type: "bank_transfer",
          bank_name: "Ngân hàng Vietcombank",
          account_number: "0123456789",
          account_holder: "NGUYEN VAN A",
          is_default: false,
          created_at: "2024-02-01T00:00:00Z",
        },
      ]);

      setBillingAddresses([
        {
          id: 1,
          company_name: "CÔNG TY TNHH ABC",
          tax_code: "0123456789",
          address: "123 Đường ABC, Quận 1, TP.HCM",
          phone: "0912345678",
          email: "invoice@company.com",
          is_default: true,
        },
      ]);
    } catch (error) {
      console.error("Failed to load billing data:", error);
      toast.error("Có lỗi xảy ra khi tải thông tin thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    try {
      // Validate form
      if (
        !cardForm.card_number ||
        !cardForm.card_holder ||
        !cardForm.expiry_month ||
        !cardForm.expiry_year
      ) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        return;
      }

      // Mock API call
      const newCard: PaymentMethod = {
        id: Date.now(),
        type: "credit_card",
        card_number: cardForm.card_number.replace(/\d(?=\d{4})/g, "*"),
        card_holder: cardForm.card_holder.toUpperCase(),
        expiry_month: parseInt(cardForm.expiry_month),
        expiry_year: parseInt(cardForm.expiry_year),
        is_default: paymentMethods.length === 0,
        created_at: new Date().toISOString(),
      };

      setPaymentMethods((prev) => [...prev, newCard]);
      setCardForm({
        card_number: "",
        card_holder: "",
        expiry_month: "",
        expiry_year: "",
        cvv: "",
      });
      setIsAddCardOpen(false);
      toast.success("Thêm thẻ thanh toán thành công");
    } catch (error) {
      console.error("Failed to add card:", error);
      toast.error("Có lỗi xảy ra khi thêm thẻ");
    }
  };

  const handleAddAddress = async () => {
    try {
      // Validate form
      if (!addressForm.address || !addressForm.phone || !addressForm.email) {
        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
        return;
      }

      // Mock API call
      const newAddress: BillingAddress = {
        id: Date.now(),
        ...addressForm,
        is_default: billingAddresses.length === 0,
      };

      setBillingAddresses((prev) => [...prev, newAddress]);
      setAddressForm({
        company_name: "",
        tax_code: "",
        address: "",
        phone: "",
        email: "",
      });
      setIsAddAddressOpen(false);
      toast.success("Thêm địa chỉ xuất hóa đơn thành công");
    } catch (error) {
      console.error("Failed to add address:", error);
      toast.error("Có lỗi xảy ra khi thêm địa chỉ");
    }
  };

  const handleSetDefault = async (id: number, type: "payment" | "address") => {
    try {
      if (type === "payment") {
        setPaymentMethods((prev) =>
          prev.map((method) => ({
            ...method,
            is_default: method.id === id,
          })),
        );
      } else {
        setBillingAddresses((prev) =>
          prev.map((address) => ({
            ...address,
            is_default: address.id === id,
          })),
        );
      }
      toast.success("Đã cập nhật mặc định");
    } catch (error) {
      console.error("Failed to set default:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: number, type: "payment" | "address") => {
    try {
      if (type === "payment") {
        setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
      } else {
        setBillingAddresses((prev) =>
          prev.filter((address) => address.id !== id),
        );
      }
      toast.success("Xóa thành công");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Có lỗi xảy ra khi xóa");
    }
  };

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    switch (method.type) {
      case "credit_card":
        return {
          title: `Thẻ tín dụng`,
          subtitle: `${method.card_number} • ${method.expiry_month}/${method.expiry_year}`,
          icon: CreditCard,
        };
      case "bank_transfer":
        return {
          title: method.bank_name || "Chuyển khoản ngân hàng",
          subtitle: `${method.account_number} • ${method.account_holder}`,
          icon: Building,
        };
      case "e_wallet":
        return {
          title: method.wallet_type || "Ví điện tử",
          subtitle: method.wallet_account || "",
          icon: CreditCard,
        };
      default:
        return {
          title: "Phương thức thanh toán",
          subtitle: "",
          icon: CreditCard,
        };
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Thông tin thanh toán
            </h1>
            <p className="text-gray-600">
              Quản lý phương thức thanh toán và hóa đơn
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>

        <Tabs defaultValue="payment-methods" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payment-methods">
              Phương thức thanh toán
            </TabsTrigger>
            <TabsTrigger value="billing-addresses">
              Địa chỉ xuất hóa đơn
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment-methods" className="space-y-6">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Phương thức thanh toán
                  </CardTitle>
                  <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm thẻ
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Thêm thẻ thanh toán</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="card_number">Số thẻ</Label>
                          <Input
                            id="card_number"
                            value={cardForm.card_number}
                            onChange={(e) =>
                              setCardForm((prev) => ({
                                ...prev,
                                card_number: e.target.value,
                              }))
                            }
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        <div>
                          <Label htmlFor="card_holder">Chủ thẻ</Label>
                          <Input
                            id="card_holder"
                            value={cardForm.card_holder}
                            onChange={(e) =>
                              setCardForm((prev) => ({
                                ...prev,
                                card_holder: e.target.value,
                              }))
                            }
                            placeholder="NGUYEN VAN A"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="expiry_month">Tháng</Label>
                            <Select
                              value={cardForm.expiry_month}
                              onValueChange={(value) =>
                                setCardForm((prev) => ({
                                  ...prev,
                                  expiry_month: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="MM" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                  <SelectItem
                                    key={i + 1}
                                    value={(i + 1).toString().padStart(2, "0")}
                                  >
                                    {(i + 1).toString().padStart(2, "0")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="expiry_year">Năm</Label>
                            <Select
                              value={cardForm.expiry_year}
                              onValueChange={(value) =>
                                setCardForm((prev) => ({
                                  ...prev,
                                  expiry_year: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="YYYY" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 10 }, (_, i) => {
                                  const year = new Date().getFullYear() + i;
                                  return (
                                    <SelectItem
                                      key={year}
                                      value={year.toString()}
                                    >
                                      {year}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              value={cardForm.cvv}
                              onChange={(e) =>
                                setCardForm((prev) => ({
                                  ...prev,
                                  cvv: e.target.value,
                                }))
                              }
                              placeholder="123"
                              maxLength={3}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddCard} className="flex-1">
                            Thêm thẻ
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddCardOpen(false)}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Chưa có phương thức thanh toán nào
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => {
                      const display = getPaymentMethodDisplay(method);
                      const IconComponent = display.icon;

                      return (
                        <div
                          key={method.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-6 w-6 text-gray-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {display.title}
                                </span>
                                {method.is_default && (
                                  <Badge variant="secondary">Mặc định</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {display.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!method.is_default && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSetDefault(method.id, "payment")
                                }
                              >
                                Đặt mặc định
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(method.id, "payment")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Note */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Thông tin thẻ của bạn được bảo mật bằng mã hóa SSL 256-bit và
                tuân thủ tiêu chuẩn PCI DSS.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="billing-addresses" className="space-y-6">
            {/* Billing Addresses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Địa chỉ xuất hóa đơn
                  </CardTitle>
                  <Dialog
                    open={isAddAddressOpen}
                    onOpenChange={setIsAddAddressOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm địa chỉ
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Thêm địa chỉ xuất hóa đơn</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="company_name">Tên công ty</Label>
                          <Input
                            id="company_name"
                            value={addressForm.company_name}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                company_name: e.target.value,
                              }))
                            }
                            placeholder="Công ty TNHH ABC"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tax_code">Mã số thuế</Label>
                          <Input
                            id="tax_code"
                            value={addressForm.tax_code}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                tax_code: e.target.value,
                              }))
                            }
                            placeholder="0123456789"
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Địa chỉ *</Label>
                          <Input
                            id="address"
                            value={addressForm.address}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            placeholder="123 Đường ABC, Quận 1, TP.HCM"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone">Số điện thoại *</Label>
                            <Input
                              id="phone"
                              value={addressForm.phone}
                              onChange={(e) =>
                                setAddressForm((prev) => ({
                                  ...prev,
                                  phone: e.target.value,
                                }))
                              }
                              placeholder="0912345678"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={addressForm.email}
                              onChange={(e) =>
                                setAddressForm((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              placeholder="invoice@company.com"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddAddress} className="flex-1">
                            Thêm địa chỉ
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddAddressOpen(false)}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {billingAddresses.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Chưa có địa chỉ xuất hóa đơn nào
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {billingAddresses.map((address) => (
                      <div
                        key={address.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <Building className="h-6 w-6 text-gray-400 mt-1" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {address.company_name && (
                                <span className="font-medium">
                                  {address.company_name}
                                </span>
                              )}
                              {address.is_default && (
                                <Badge variant="secondary">Mặc định</Badge>
                              )}
                            </div>
                            {address.tax_code && (
                              <p className="text-sm text-gray-600">
                                MST: {address.tax_code}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              {address.address}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.phone} • {address.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!address.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleSetDefault(address.id, "address")
                              }
                            >
                              Đặt mặc định
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(address.id, "address")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
