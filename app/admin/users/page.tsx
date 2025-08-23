import { UserManagement } from "../../../components/admin/UserManagement";
import { Suspense } from "react";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-6"><p>Loading users...</p></div>}>
      <UserManagement />
    </Suspense>
  );
}
