import { BookingFlow } from "@/components/booking/BookingFlow";

export const metadata = { title: "Записаться на собес" };

export default function SobiesPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Главная
          </a>
        </div>
        <BookingFlow />
      </div>
    </main>
  );
}
