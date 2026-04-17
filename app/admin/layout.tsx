import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminFromCookie } from "@/lib/auth-server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname");

  // Login page has no admin chrome and no auth check (middleware allows it)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const admin = await getAdminFromCookie();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
