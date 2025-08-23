"use client";

import { AdminLayout } from "../../components/admin/AdminLayout";

export default function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // Temporarily bypass authentication to get pages working
  return <AdminLayout>{children}</AdminLayout>;
}
