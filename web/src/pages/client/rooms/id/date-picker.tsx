import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  X as XIcon,
  Trash,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay, isSameMonth } from "date-fns";

type BookedRange = { checkIn: string | Date; checkOut: string | Date };

type Props = {
  initialCheckIn?: Date | null;
  initialCheckOut?: Date | null;
  onChange?: (checkIn: Date | null, checkOut: Date | null) => void;
  checkIn: any;
  setCheckIn: any;
  checkOut: any;
  setCheckOut: any;
  bookedRanges?: BookedRange[];
};

// Fully custom calendar grid — no react-day-picker, no focus/touch issues.
// Uses onTouchEnd + onMouseDown to fire immediately on both mobile and desktop.
function CustomCalendar({
  selected,
  onSelect,
  isDisabled,
  isBooked,
}: {
  selected: Date | null;
  onSelect: (date: Date) => void;
  isDisabled: (date: Date) => boolean;
  isBooked: (date: Date) => boolean;
}) {
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const d = selected || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Build the grid: 6 weeks × 7 days
  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
  const days: Date[] = [];
  let cur = gridStart;
  while (cur <= gridEnd) {
    days.push(new Date(cur));
    cur = new Date(cur.getTime() + 86400000);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDay = (e: React.SyntheticEvent, date: Date) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDisabled(date)) return;
    onSelect(date);
  };

  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="select-none w-full" style={{ touchAction: "manipulation" }}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onTouchEnd={(e) => { e.preventDefault(); setViewMonth(subMonths(viewMonth, 1)); }}
          onMouseDown={(e) => { e.preventDefault(); setViewMonth(subMonths(viewMonth, 1)); }}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onTouchEnd={(e) => { e.preventDefault(); setViewMonth(addMonths(viewMonth, 1)); }}
          onMouseDown={(e) => { e.preventDefault(); setViewMonth(addMonths(viewMonth, 1)); }}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((date, i) => {
          const isCurrentMonth = isSameMonth(date, viewMonth);
          const isSelected = selected ? isSameDay(date, selected) : false;
          const isToday = isSameDay(date, today);
          const disabled = isDisabled(date);
          const booked = isBooked(date);

          return (
            <div key={i} className="flex items-center justify-center aspect-square">
              <button
                type="button"
                disabled={disabled}
                onTouchEnd={(e) => handleDay(e, date)}
                onMouseDown={(e) => handleDay(e, date)}
                style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                className={[
                  "w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors",
                  !isCurrentMonth ? "opacity-30" : "",
                  disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                  booked ? "line-through text-red-400" : "",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : isToday
                    ? "border border-primary text-primary"
                    : isCurrentMonth && !disabled
                    ? "hover:bg-accent"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({
  initialCheckIn = null,
  initialCheckOut = null,
  onChange,
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  bookedRanges = [],
}: Props) {
  const [activeField, setActiveField] = useState<"checkIn" | "checkOut" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bookedDates = React.useMemo(() => {
    const set = new Set<string>();
    bookedRanges.forEach(({ checkIn: ci, checkOut: co }) => {
      if (!ci || !co) return;
      const start = new Date(ci);
      const end = new Date(co);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      try {
        eachDayOfInterval({ start, end }).forEach((d) =>
          set.add(d.toISOString().split("T")[0])
        );
      } catch {}
    });
    return set;
  }, [bookedRanges]);

  const isBooked = (date: Date) => bookedDates.has(date.toISOString().split("T")[0]);
  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  useEffect(() => {
    if (checkIn && checkOut && checkOut < checkIn) {
      setError("Check-out must be the same or after check-in");
    } else {
      setError(null);
    }
    onChange?.(checkIn, checkOut);
  }, [checkIn, checkOut, onChange]);

  function clearDates() {
    setCheckIn(null);
    setCheckOut(null);
    setActiveField(null);
  }

  function handleDone() {
    if (activeField === "checkIn") {
      if (checkIn) setActiveField("checkOut");
      else setActiveField(null);
    } else {
      setActiveField(null);
    }
  }

  function handleSelectDate(date: Date) {
    if (activeField === "checkIn") {
      setCheckIn(date);
      if (checkOut && checkOut < date) setCheckOut(null);
    } else if (activeField === "checkOut") {
      setCheckOut(date);
    }
  }

  const disabledCheckIn = (date: Date) => isPast(date) || isBooked(date);
  const disabledCheckOut = (date: Date) =>
    isPast(date) || isBooked(date) || (checkIn ? date < checkIn : false);

  return (
    <div className="space-y-3">
      {/* Date input buttons */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Check-in</label>
          <button
            type="button"
            onTouchEnd={(e) => { e.preventDefault(); setActiveField(activeField === "checkIn" ? null : "checkIn"); }}
            onMouseDown={(e) => { e.preventDefault(); setActiveField(activeField === "checkIn" ? null : "checkIn"); }}
            style={{ touchAction: "manipulation" }}
            className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              activeField === "checkIn" ? "border-primary bg-primary/5" : "border-input bg-card hover:border-primary/50"
            }`}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className={checkIn ? "text-foreground" : "text-muted-foreground"}>
              {checkIn ? format(checkIn, "MMM d, yyyy") : "Select date"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
          </button>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Check-out</label>
          <button
            type="button"
            onTouchEnd={(e) => { e.preventDefault(); setActiveField(activeField === "checkOut" ? null : "checkOut"); }}
            onMouseDown={(e) => { e.preventDefault(); setActiveField(activeField === "checkOut" ? null : "checkOut"); }}
            style={{ touchAction: "manipulation" }}
            className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              activeField === "checkOut" ? "border-primary bg-primary/5" : "border-input bg-card hover:border-primary/50"
            }`}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className={checkOut ? "text-foreground" : "text-muted-foreground"}>
              {checkOut ? format(checkOut, "MMM d, yyyy") : "Select date"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
          </button>
        </div>
      </div>

      {/* Inline calendar — data-vaul-no-drag prevents vaul Drawer from
          consuming the first touch as a drag-detection gesture */}
      {activeField && (
        <div className="rounded-xl border border-border bg-background shadow-sm p-3" data-vaul-no-drag>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-muted-foreground">
              {activeField === "checkIn" ? "Select check-in date" : "Select check-out date"}
              {activeField === "checkIn" && checkIn && (
                <span className="ml-2 text-primary font-semibold">{format(checkIn, "MMM d, yyyy")}</span>
              )}
              {activeField === "checkOut" && checkOut && (
                <span className="ml-2 text-primary font-semibold">{format(checkOut, "MMM d, yyyy")}</span>
              )}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-7 text-xs px-3"
                onTouchEnd={(e) => { e.preventDefault(); handleDone(); }}
                onMouseDown={(e) => { e.preventDefault(); handleDone(); }}
                onClick={undefined}
              >
                Done
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2 text-destructive"
                onTouchEnd={(e) => { e.preventDefault(); clearDates(); }}
                onMouseDown={(e) => { e.preventDefault(); clearDates(); }}
                onClick={undefined}
              >
                <Trash className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <CustomCalendar
            selected={activeField === "checkIn" ? checkIn || null : checkOut || null}
            onSelect={handleSelectDate}
            isDisabled={activeField === "checkIn" ? disabledCheckIn : disabledCheckOut}
            isBooked={isBooked}
          />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <XIcon className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}
