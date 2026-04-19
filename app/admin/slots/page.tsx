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
  parseISO,
  isWeekend,
  addMinutes,
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

function buildBulkSlots(
  dateFrom: string,
  dateTo: string,
  timeFrom: string,
  timeTo: string,
  stepMin: number,
  skipWeekends: boolean
): string[] {
  if (!dateFrom || !dateTo || !timeFrom || !timeTo) return [];
  const start = parseISO(dateFrom);
  const end = parseISO(dateTo);
  if (start > end) return [];

  const days = eachDayOfInterval({ start, end });
  const slots: string[] = [];

  const [fromH, fromM] = timeFrom.split(":").map(Number);
  const [toH, toM] = timeTo.split(":").map(Number);

  for (const day of days) {
    if (skipWeekends && isWeekend(day)) continue;
    let current = new Date(day);
    current.setHours(fromH, fromM, 0, 0);
    const limit = new Date(day);
    limit.setHours(toH, toM, 0, 0);

    while (current <= limit) {
      slots.push(current.toISOString());
      current = addMinutes(current, stepMin);
    }
  }
  return slots;
}

export default function SlotsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<SlotAdmin[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newTime, setNewTime] = useState("10:00");
  const [adding, setAdding] = useState(false);

  // Bulk form state
  const [bulkDateFrom, setBulkDateFrom] = useState("");
  const [bulkDateTo, setBulkDateTo] = useState("");
  const [bulkTimeFrom, setBulkTimeFrom] = useState("10:00");
  const [bulkTimeTo, setBulkTimeTo] = useState("18:00");
  const [bulkStep, setBulkStep] = useState(60);
  const [bulkDuration, setBulkDuration] = useState(60);
  const [bulkSkipWeekends, setBulkSkipWeekends] = useState(true);
  const [bulkAdding, setBulkAdding] = useState(false);

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

  const bulkPreview = buildBulkSlots(bulkDateFrom, bulkDateTo, bulkTimeFrom, bulkTimeTo, bulkStep, bulkSkipWeekends);

  async function addBulkSlots() {
    if (bulkPreview.length === 0) return;
    setBulkAdding(true);
    await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: bulkPreview, durationMin: bulkDuration }),
    });
    setBulkAdding(false);
    setShowBulkModal(false);
    fetchSlots();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Управление слотами</h1>
          <p className="text-sm text-gray-400 mt-1">Нажмите на дату чтобы увидеть слоты или добавить новый</p>
        </div>
        <button
          onClick={() => setShowBulkModal(true)}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Добавить диапазоном
        </button>
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
                  + Один слот
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

      {/* Add single slot modal */}
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

      {/* Bulk add modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Добавить слоты диапазоном</h3>

            <div className="space-y-4">
              {/* Date range */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Диапазон дат</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">С</label>
                    <input
                      type="date"
                      value={bulkDateFrom}
                      onChange={(e) => setBulkDateFrom(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">По</label>
                    <input
                      type="date"
                      value={bulkDateTo}
                      min={bulkDateFrom}
                      onChange={(e) => setBulkDateTo(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>

              {/* Time range */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Диапазон времени</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">С</label>
                    <input
                      type="time"
                      value={bulkTimeFrom}
                      onChange={(e) => setBulkTimeFrom(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">До</label>
                    <input
                      type="time"
                      value={bulkTimeTo}
                      onChange={(e) => setBulkTimeTo(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>

              {/* Step and duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Шаг между слотами</label>
                  <select
                    value={bulkStep}
                    onChange={(e) => setBulkStep(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value={30}>30 минут</option>
                    <option value={60}>1 час</option>
                    <option value={90}>1.5 часа</option>
                    <option value={120}>2 часа</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Длительность слота</label>
                  <select
                    value={bulkDuration}
                    onChange={(e) => setBulkDuration(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value={30}>30 минут</option>
                    <option value={60}>1 час</option>
                    <option value={90}>1.5 часа</option>
                    <option value={120}>2 часа</option>
                  </select>
                </div>
              </div>

              {/* Skip weekends */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkSkipWeekends}
                  onChange={(e) => setBulkSkipWeekends(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Пропускать выходные (сб, вс)</span>
              </label>

              {/* Preview */}
              {bulkPreview.length > 0 ? (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    Будет создано: <span className="text-black font-semibold">{bulkPreview.length}</span> слотов
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {bulkPreview.slice(0, 30).map((iso) => (
                      <span key={iso} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-lg text-gray-600">
                        {format(new Date(iso), "d.MM HH:mm")}
                      </span>
                    ))}
                    {bulkPreview.length > 30 && (
                      <span className="text-xs text-gray-400">+{bulkPreview.length - 30} ещё...</span>
                    )}
                  </div>
                </div>
              ) : (bulkDateFrom && bulkDateTo) ? (
                <p className="text-sm text-gray-400">Нет слотов в выбранном диапазоне</p>
              ) : null}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={addBulkSlots}
                disabled={bulkAdding || bulkPreview.length === 0}
                className="flex-1 bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {bulkAdding ? "Создаём..." : `Создать ${bulkPreview.length > 0 ? bulkPreview.length + " слотов" : ""}`}
              </button>
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-200"
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
