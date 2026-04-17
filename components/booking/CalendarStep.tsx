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
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ru } from "date-fns/locale";

type Slot = { id: number; startsAt: string; durationMin: number };
type SlotGroup = { date: string; slots: Slot[] };

interface Props {
  onSelect: (slot: Slot) => void;
}

export function CalendarStep({ onSelect }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slotGroups, setSlotGroups] = useState<SlotGroup[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const to = format(endOfMonth(addMonths(currentMonth, 1)), "yyyy-MM-dd");
      const res = await fetch(`/api/slots?from=${from}&to=${to}`);
      const data: SlotGroup[] = await res.json();
      setSlotGroups(data);
      setLoading(false);
    }
    fetchSlots();
  }, [currentMonth]);

  const availableDates = new Set(slotGroups.map((g) => g.date));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const selectedGroup = selectedDate
    ? slotGroups.find((g) => g.date === format(selectedDate, "yyyy-MM-dd"))
    : null;

  const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Выберите время</h2>
      <p className="text-gray-500 text-sm">Выберите удобный слот для собеседования (1 час)</p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ←
          </button>
          <span className="font-medium text-gray-900 capitalize">
            {format(currentMonth, "LLLL yyyy", { locale: ru })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            →
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isAvailable = availableDates.has(dateStr);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isPast = isBefore(day, startOfDay(new Date()));
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (isAvailable && !isPast) setSelectedDate(day);
                }}
                disabled={!isAvailable || isPast}
                className={`
                  h-10 w-10 mx-auto rounded-full text-sm font-medium transition-all
                  ${!isCurrentMonth ? "text-gray-300" : ""}
                  ${isPast && isCurrentMonth ? "text-gray-300 cursor-not-allowed" : ""}
                  ${isAvailable && !isPast && isCurrentMonth ? "cursor-pointer" : ""}
                  ${isSelected ? "bg-black text-white" : ""}
                  ${isAvailable && !isPast && !isSelected && isCurrentMonth ? "bg-green-50 text-green-700 hover:bg-green-100 font-semibold" : ""}
                  ${isToday(day) && !isSelected ? "ring-2 ring-black ring-offset-1" : ""}
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        {loading && (
          <p className="text-center text-sm text-gray-400 mt-4">Загружаем слоты...</p>
        )}
      </div>

      {/* Time slots for selected date */}
      {selectedDate && (
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-3">
            {format(selectedDate, "d MMMM — доступное время:", { locale: ru })}
          </h3>
          {selectedGroup ? (
            <div className="flex flex-wrap gap-3">
              {selectedGroup.slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => onSelect(slot)}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 hover:bg-black hover:text-white hover:border-black transition-all"
                >
                  {format(new Date(slot.startsAt), "HH:mm")}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Нет доступных слотов на эту дату</p>
          )}
        </div>
      )}
    </div>
  );
}
