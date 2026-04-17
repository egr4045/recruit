import { cn } from "@/lib/utils";

type BadgeVariant = "pending" | "confirmed" | "rejected" | "completed" | "default";

const labels: Record<string, string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждено",
  REJECTED: "Отклонено",
  COMPLETED: "Завершено",
};

const variants: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[status] || "bg-gray-100 text-gray-800"
      )}
    >
      {labels[status] || status}
    </span>
  );
}
