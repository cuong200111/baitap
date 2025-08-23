export default function AdminUsersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Admin Users page is working!</p>
        <div className="mt-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold">Demo Users:</h3>
            <div className="mt-2">
              <div className="flex justify-between py-2 border-b">
                <span>admin@hacom.vn</span>
                <span className="text-blue-600">Admin</span>
              </div>
              <div className="flex justify-between py-2">
                <span>user@example.com</span>
                <span className="text-green-600">User</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
