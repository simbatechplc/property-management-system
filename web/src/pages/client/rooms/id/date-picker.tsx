import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, X as XIcon, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, eachDayOfInterval, isWithinInterval } from "date-fns";

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
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Build a set of all booked date strings for fast lookup
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

  const isBooked = (date: Date) => {
    const key = date.toISOString().split("T")[0];
    return bookedDates.has(key);
  };

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
  }

  const disabledCheckIn = (date: Date) => isPast(date) || isBooked(date);
  const disabledCheckOut = (date: Date) =>
    isPast(date) || isBooked(date) || (checkIn ? date < checkIn : false);

  const modifiers = {
    booked: (date: Date) => isBooked(date),
  };

  const modifiersClassNames = {
    booked: "line-through text-red-400 opacity-60 cursor-not-allowed",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Check-in
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 justify-start px-0 py-0 text-sm text-foreground"
              >
                <span className="truncate">
                  {checkIn ? format(checkIn, "MMM d, yyyy") : "Select"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 z-[99999]" align="center" side="top" avoidCollisions sideOffset={8}>
              <Calendar
                mode="single"
                disabled={disabledCheckIn}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                onDayMouseEnter={(date) => setHoveredDate(date)}
                onDayMouseLeave={() => setHoveredDate(null)}
                footer={
                  hoveredDate && isBooked(hoveredDate) ? (
                    <p className="text-xs text-red-500 text-center pt-1">
                      This date is already booked
                    </p>
                  ) : null
                }
                onSelect={(date) => {
                  setCheckIn(date as Date);
                  if (checkOut && date && checkOut < (date as Date))
                    setCheckOut(null);
                  setOpen(false);
                }}
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <Button size="sm" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); }}>Done</Button>
                <Button size="sm" variant="secondary" onPointerDown={(e) => { e.preventDefault(); clearDates(); }} title="Clear dates">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Check-out
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <Popover open={checkoutOpen} onOpenChange={setCheckoutOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 justify-start px-0 py-0 text-sm text-foreground"
              >
                <span className="truncate">
                  {checkOut ? format(checkOut, "MMM d, yyyy") : "Select"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 z-[99999]" align="center" side="top" avoidCollisions sideOffset={8}>
              <Calendar
                mode="single"
                disabled={disabledCheckOut}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                onDayMouseEnter={(date) => setHoveredDate(date)}
                onDayMouseLeave={() => setHoveredDate(null)}
                footer={
                  hoveredDate && isBooked(hoveredDate) ? (
                    <p className="text-xs text-red-500 text-center pt-1">
                      This date is already booked
                    </p>
                  ) : null
                }
                onSelect={(date) => {
                  setCheckOut(date as Date);
                  setCheckoutOpen(false);
                }}
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <Button size="sm" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setCheckoutOpen(false); }}>Done</Button>
                <Button size="sm" variant="secondary" onPointerDown={(e) => { e.preventDefault(); clearDates(); }} title="Clear dates">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <XIcon className="h-3 w-3" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
