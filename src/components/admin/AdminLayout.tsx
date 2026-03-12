import { Outlet, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminSessionTimeout } from "@/hooks/useAdminSessionTimeout";
import AdminSidebar from "./AdminSidebar";
import { Loader2 } from "lucide-react";

const AdminLayout = () => {
  const { session, isAdmin, loading, signOut } = useAdminAuth();
  useAdminSessionTimeout(signOut);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar onSignOut={signOut} />
      <main className="ml-64 flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
