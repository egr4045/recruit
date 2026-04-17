"use client";
import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/Badge";

type SlotAdmin = {
  id: number;
  startsAt: string;
  durationMin: number;
  isAvailable: boolean;
  application: { id: number; fullName: string; status: string } | null;
};

export default function SlotsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<SlotAdmin[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTime, setNewTime] = useState("10:00");
  const [adding, setAdding] = useState(false);

  async function fetchSlots() {
    setLoading(true);
    const res = await fetch("/api/admin/slots");
    const data = await res.json();
    setSlots(data);
    setLoading(false);
  }

  useEffect(() => { fetchSlots(); }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const slotsByDate: Record<string, SlotAdmin[]> = {};
  for (const slot of slots) {
    const key = format(new Date(slot.startsAt), "yyyy-MM-dd");
    if (!slotsByDate[key]) slotsByDate[key] = [];
    slotsByDate[key].push(slot);
  }

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedSlots = selectedDateStr ? slotsByDate[selectedDateStr] || [] : [];

  const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  async function toggleSlot(slotId: number, isAvailable: boolean) {
    await fetch(`/api/admin/slots/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });
    fetchSlots();
  }

  async function deleteSlot(slotId: number) {
    if (!confirm("Удалить этот слот?")) return;
    const res = await fetch(`/api/admin/slots/${slotId}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
    }
    fetchSlots();
  }

  async function addSlot() {
    if (!selectedDate) return;
    setAdding(true);
    const [hours, minutes] = newTime.split(":").map(Number);
    const startsAt = new Date(selectedDate);
    startsAt.setHours(hours, minutes, 0, 0);

    await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAt: startsAt.toISOString() }),
    });
    setAdding(false);
    setShowAddModal(false);
    fetchSlots();
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Управление слотами</h1>
        <p className="text-sm text-gray-400 mt-1">Нажмите на дату чтобы увидеть слоты или добавить новый</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-gray-100">←</button>
            <span className="font-medium text-gray-900 capitalize">
              {format(currentMonth, "LLLL yyyy", { locale: ru })}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-gray-100">→</button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const daySlots = slotsByDate[dateStr] || [];
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  className={`h-10 w-10 mx-auto rounded-full text-sm relative transition-all
                    ${!isCurrentMonth ? "text-gray-300" : "text-gray-700 hover:bg-gray-100"}
                    ${isSelected ? "bg-black text-white hover:bg-black" : ""}
                  `}
                >
                  {format(day, "d")}
                  {daySlots.length > 0 && (
                    <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-black"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slots for selected date */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {!selectedDate ? (
            <div className="text-center py-12 text-sm text-gray-400">Выберите дату</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  {format(selectedDate, "d MMMM yyyy", { locale: ru })}
                </h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  + Добавить
                </button>
              </div>

              {selectedSlots.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">Нет слотов</p>
              ) : (
                <div className="space-y-3">
                  {selectedSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(slot.startsAt), "HH:mm")}
                          <span className="text-xs text-gray-400 ml-2">{slot.durationMin} мин</span>
                        </p>
                        {slot.application ? (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {slot.application.fullName} · <Badge status={slot.application.status} />
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {slot.isAvailable ? "Свободен" : "Заблокирован"}
                          </p>
                        )}
                      </div>
                      {!slot.application && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleSlot(slot.id, slot.isAvailable)}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                              slot.isAvailable
                                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {slot.isAvailable ? "Выкл" : "Вкл"}
                          </button>
                          <button
                            onClick={() => deleteSlot(slot.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add slot modal */}
      {showAddModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Добавить слот — {format(selectedDate, "d MMMM", { locale: ru })}
            </h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">Время начала</label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={addSlot}
                disabled={adding}
                className="flex-1 bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {adding ? "Добавляем..." : "Добавить"}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-medium"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
