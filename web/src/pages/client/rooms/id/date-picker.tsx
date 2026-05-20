import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, X as XIcon, Trash, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, eachDayOfInterval } from "date-fns";

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
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  // Pending date — holds the selected date until "Done" is pressed on mobile
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

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

  // When activeField changes, pre-populate pendingDate with current value
  useEffect(() => {
    if (activeField === "checkIn") setPendingDate(checkIn || null);
    else if (activeField === "checkOut") setPendingDate(checkOut || null);
    else setPendingDate(null);
  }, [activeField]);

  function clearDates() {
    setCheckIn(null);
    setCheckOut(null);
    setActiveField(null);
    setPendingDate(null);
  }

  function handleDone() {
    if (!pendingDate) {
      setActiveField(null);
      return;
    }
    if (activeField === "checkIn") {
      setCheckIn(pendingDate);
      if (checkOut && pendingDate && checkOut < pendingDate) setCheckOut(null);
      setActiveField("checkOut");
    } else if (activeField === "checkOut") {
      setCheckOut(pendingDate);
      setActiveField(null);
    }
    setPendingDate(null);
  }

  const disabledCheckIn = (date: Date) => isPast(date) || isBooked(date);
  const disabledCheckOut = (date: Date) =>
    isPast(date) || isBooked(date) || (checkIn ? date < checkIn : false);

  const modifiers = { booked: (date: Date) => isBooked(date) };
  const modifiersClassNames = { booked: "line-through text-red-400 opacity-60 cursor-not-allowed" };

  // Display value: show pending date while calendar is open, otherwise show confirmed date
  const checkInDisplay = activeField === "checkIn" && pendingDate ? pendingDate : checkIn;
  const checkOutDisplay = activeField === "checkOut" && pendingDate ? pendingDate : checkOut;

  return (
    <div className="space-y-3">
      {/* Date input buttons */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Check-in</label>
          <button
            type="button"
            onClick={() => setActiveField(activeField === "checkIn" ? null : "checkIn")}
            className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              activeField === "checkIn" ? "border-primary bg-primary/5" : "border-input bg-card hover:border-primary/50"
            }`}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className={checkInDisplay ? "text-foreground" : "text-muted-foreground"}>
              {checkInDisplay ? format(checkInDisplay, "MMM d, yyyy") : "Select date"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
          </button>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Check-out</label>
          <button
            type="button"
            onClick={() => setActiveField(activeField === "checkOut" ? null : "checkOut")}
            className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              activeField === "checkOut" ? "border-primary bg-primary/5" : "border-input bg-card hover:border-primary/50"
            }`}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className={checkOutDisplay ? "text-foreground" : "text-muted-foreground"}>
              {checkOutDisplay ? format(checkOutDisplay, "MMM d, yyyy") : "Select date"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
          </button>
        </div>
      </div>

      {/* Inline calendar */}
      {activeField && (
        <div className="rounded-xl border border-border bg-background shadow-sm p-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-muted-foreground">
              {activeField === "checkIn" ? "Select check-in date" : "Select check-out date"}
              {pendingDate && <span className="ml-2 text-primary font-semibold">{format(pendingDate, "MMM d, yyyy")}</span>}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-7 text-xs px-3"
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDone(); }}
              >
                Done
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2 text-destructive"
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); clearDates(); }}
              >
                <Trash className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={pendingDate || undefined}
            disabled={activeField === "checkIn" ? disabledCheckIn : disabledCheckOut}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            onDayMouseEnter={(date) => setHoveredDate(date)}
            onDayMouseLeave={() => setHoveredDate(null)}
            footer={
              hoveredDate && isBooked(hoveredDate) ? (
                <p className="text-xs text-red-500 text-center pt-1">This date is already booked</p>
              ) : null
            }
            onSelect={(date) => {
              // Just update pending — don't close yet. User must press Done.
              setPendingDate(date as Date || null);
            }}
            className="mx-auto"
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
