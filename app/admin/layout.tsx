"use client";

import { AdminLayout } from "../../components/admin/AdminLayout";
import { ProtectedRoute } from "../../components/ProtectedRoute";

export default function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute adminOnly>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
