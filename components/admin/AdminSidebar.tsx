"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin/applications", label: "Заявки", icon: "📋" },
  { href: "/admin/slots", label: "Слоты", icon: "📅" },
  { href: "/admin/candidates", label: "Кандидаты", icon: "👤" },
  { href: "/admin/employer-inquiries", label: "Продажи", icon: "💼" },
  { href: "/admin/content", label: "Контент (SEO)", icon: "📝" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  async function fetchCounts() {
    try {
      const res = await fetch("/api/admin/applications/counts");
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.pending ?? 0);
      }
    } catch {
      // игнорируем сетевые ошибки в фоне
    }
  }

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 10_000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
          Recruit
        </Link>
        <p className="text-xs text-gray-400 mt-1">Панель управления</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isApplications = item.href === "/admin/applications";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isApplications && pendingCount > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                    isActive ? "bg-white text-black" : "bg-red-500 text-white"
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-gray-400 hover:text-gray-700 transition-colors px-4 py-2"
        >
          Выйти
        </button>
      </div>
    </aside>
  );
}
